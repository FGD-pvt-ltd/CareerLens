"""
Gemini LLM Provider

Integrates Google's official GenAI SDK to generate structured natural-language explanations
grounded strictly in the deterministic analysis without modifying scores or claiming mastery.
"""

import json
import re
from typing import Any, Dict, List, Optional, Union

from config.settings import get_gemini_api_key, get_gemini_model
from models.llm import LLMExplanationResponse
from services.fallback_llm import _get_field
from services.llm_prompt import build_explanation_prompt
from services.llm_provider import LLMProvider

try:
    from google import genai
    from google.genai import types as genai_types
    HAS_GENAI = True
except ImportError:
    HAS_GENAI = False
    genai = None
    genai_types = None

FORBIDDEN_MASTERY_TERMS = [
    "mastered",
    "mastery",
    "expert",
    "guaranteed",
    "proven",
    "definitely know",
    "definitely knows",
    "proves you know",
    "guaranteed to get",
    "100% ready",
]


def validate_gemini_response(
    response: LLMExplanationResponse,
    analysis: Union[Dict[str, Any], Any],
) -> bool:
    """
    Validates that a Gemini-generated response adheres strictly to ProfiQ's evidence principles:
    1. Does not contain forbidden mastery claims.
    2. Mentions or aligns with the authoritative target role.
    3. Does not contradict the deterministic readiness score.
    4. Strengths refer to actual candidate skills.
    5. Priority gaps refer to actual role gaps.
    """
    if not response or not isinstance(response, LLMExplanationResponse):
        return False

    # Check for empty essential fields
    if not response.overview or not response.explanation or not response.disclaimer:
        return False

    combined_text = (
        f"{response.overview} {response.explanation} "
        f"{' '.join(response.strengths)} {' '.join(response.priority_gaps)} "
        f"{' '.join(response.recommendations)}"
    ).lower()

    # Rule 1: No mastery claims
    for term in FORBIDDEN_MASTERY_TERMS:
        if term in combined_text:
            return False

    # Rule 2: Target role alignment
    target_role = _get_field(analysis, "target_role", "")
    if target_role and target_role.lower() not in combined_text:
        return False

    # Rule 3: No score contradiction (must not assert a different /100 score)
    score = int(_get_field(analysis, "readiness_score", 0))
    score_matches = re.findall(r"(\d+)/100", response.overview + " " + response.explanation)
    for found_score_str in score_matches:
        if int(found_score_str) != score:
            return False

    # Rule 4: If candidate has no supported skills, strengths shouldn't assert strong support
    raw_matches = _get_field(analysis, "skill_matches", [])
    has_any_supported = any(
        float(_get_field(m, "candidate_confidence", 0.0)) > 0
        or _get_field(m, "match_status") in ("strong_match", "partial_match")
        for m in raw_matches
    )
    if not has_any_supported and response.strengths:
        # Check if strengths claim specific skills instead of expressing no support
        for s in response.strengths:
            if "strongly supported" in s.lower() and "no skills" not in s.lower():
                return False

    # Rule 5: If candidate has no gaps, priority_gaps shouldn't assert severe gaps
    raw_gaps = _get_field(analysis, "skill_gaps", [])
    if not raw_gaps and response.priority_gaps:
        for g in response.priority_gaps:
            if "insufficient evidence" in g.lower() and "no" not in g.lower():
                return False

    return True


class GeminiProvider(LLMProvider):
    """
    Google GenAI SDK provider generating natural-language explanations.
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        model_name: Optional[str] = None,
        client: Optional[Any] = None,
    ):
        self.api_key = api_key or get_gemini_api_key()
        self.model_name = model_name or get_gemini_model()
        self._client = client

    def __repr__(self) -> str:
        return f"GeminiProvider(model_name='{self.model_name}')"

    def __str__(self) -> str:
        return f"GeminiProvider(model_name='{self.model_name}')"

    def _get_client(self) -> Any:
        if self._client is not None:
            return self._client
        if not HAS_GENAI:
            raise RuntimeError("The official 'google-genai' SDK is not installed.")
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY is not configured.")
        self._client = genai.Client(api_key=self.api_key)
        return self._client

    def generate_explanation(
        self,
        analysis: Union[Dict[str, Any], Any],
        candidate_context: Optional[str] = None,
        tone: Optional[str] = None,
    ) -> LLMExplanationResponse:
        """
        Sends structured analysis to Gemini and requests structured JSON output.
        Validates the output against evidence grounding rules before returning.
        """
        client = self._get_client()
        prompt = build_explanation_prompt(analysis, candidate_context, tone)

        # Build GenerateContentConfig requesting structured JSON
        config = None
        if HAS_GENAI and genai_types is not None:
            try:
                config = genai_types.GenerateContentConfig(
                    response_mime_type="application/json",
                    temperature=0.2,
                )
            except Exception:
                config = {"response_mime_type": "application/json"}
        else:
            config = {"response_mime_type": "application/json"}

        # Request generation from Gemini
        api_response = client.models.generate_content(
            model=self.model_name,
            contents=prompt,
            config=config,
        )

        response_text = getattr(api_response, "text", "") or ""
        if not response_text.strip():
            raise ValueError("Gemini returned an empty response text.")

        # Clean potential markdown wrapping e.g. ```json ... ```
        cleaned_text = response_text.strip()
        if cleaned_text.startswith("```"):
            lines = cleaned_text.splitlines()
            if lines[0].startswith("```"):
                lines = lines[1:]
            if lines and lines[-1].startswith("```"):
                lines = lines[:-1]
            cleaned_text = "\n".join(lines).strip()

        parsed_json = json.loads(cleaned_text)
        if not isinstance(parsed_json, dict):
            raise ValueError("Parsed Gemini response is not a JSON object.")

        candidate_response = LLMExplanationResponse(
            overview=parsed_json.get("overview", ""),
            strengths=parsed_json.get("strengths", []),
            priority_gaps=parsed_json.get("priority_gaps", []),
            recommendations=parsed_json.get("recommendations", []),
            explanation=parsed_json.get("explanation", ""),
            disclaimer=parsed_json.get("disclaimer", ""),
            provider_used="gemini",
        )

        # Validate groundedness and principles
        if not validate_gemini_response(candidate_response, analysis):
            raise ValueError("Gemini response failed evidence grounding and validation checks.")

        return candidate_response
