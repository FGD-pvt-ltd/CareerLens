"""
Unit Tests for Gemini LLM Provider and Integration

Verifies GeminiProvider initialization, mocked GenAI client responses, structured JSON parsing,
schema validation, prompt construction, grounding enforcement, automatic degradation to fallback,
configurable model names, and API route compatibility without making any real network/API calls.
"""

import copy
import json
import os
import sys
import unittest
from unittest.mock import MagicMock, patch

# Ensure ai-service root is in Python module search path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from config.settings import DEFAULT_GEMINI_MODEL, get_gemini_model, is_gemini_configured
from models.llm import LLMExplanationRequest, LLMExplanationResponse
from services.fallback_llm import DeterministicFallbackLLM
from services.gemini_provider import GeminiProvider, validate_gemini_response
from services.llm_prompt import build_explanation_prompt
from services.llm_provider import LLMProvider
from services.llm_service import generate_candidate_explanation, get_default_provider

try:
    from fastapi.testclient import TestClient
    from main import app
    HAS_TEST_CLIENT = True
except ImportError:
    HAS_TEST_CLIENT = False


class TestGeminiProvider(unittest.TestCase):
    """Mocked test suite for Google Gemini integration in ProfiQ."""

    def setUp(self):
        """Standard mock candidate analysis payload."""
        self._orig_api_key = os.environ.get("GEMINI_API_KEY")
        self._orig_model = os.environ.get("GEMINI_MODEL")
        os.environ["GEMINI_API_KEY"] = "mock-gemini-test-key"

        self.sample_analysis = {
            "target_role": "AI Engineer",
            "readiness_score": 68,
            "readiness_label": "Moderately Ready",
            "skill_matches": [
                {
                    "skill_name": "Python",
                    "match_status": "strong_match",
                    "candidate_confidence": 0.85,
                    "candidate_evidence_status": "strongly_supported",
                    "importance": "high",
                },
                {
                    "skill_name": "Git",
                    "match_status": "strong_match",
                    "candidate_confidence": 0.80,
                    "candidate_evidence_status": "strongly_supported",
                    "importance": "medium",
                },
                {
                    "skill_name": "Docker",
                    "match_status": "partial_match",
                    "candidate_confidence": 0.60,
                    "candidate_evidence_status": "partially_supported",
                    "importance": "medium",
                },
            ],
            "skill_gaps": [
                {
                    "skill_name": "Machine Learning",
                    "importance": "high",
                    "candidate_confidence": 0.0,
                    "gap_severity": "high",
                    "match_status": "gap",
                },
                {
                    "skill_name": "Data Structures & Algorithms",
                    "importance": "medium",
                    "candidate_confidence": 0.55,
                    "gap_severity": "medium",
                    "match_status": "partial_match",
                },
            ],
            "roadmap": [
                {
                    "skill_name": "Machine Learning",
                    "suggested_project": "Build a predictive machine learning pipeline",
                    "goal": "Develop end-to-end ML modeling skills.",
                    "estimated_effort": "4-6 weeks",
                    "recommended_actions": ["Study scikit-learn", "Implement classifier"],
                },
                {
                    "skill_name": "Data Structures & Algorithms",
                    "suggested_project": "Build an algorithm visualizer",
                    "goal": "Strengthen algorithmic problem solving.",
                    "estimated_effort": "2-3 weeks",
                    "recommended_actions": ["Practice LeetCode medium problems"],
                },
            ],
        }

        self.valid_gemini_json = {
            "overview": "The candidate achieves a readiness score of 68/100 for AI Engineer, placing them in the Moderately Ready tier.",
            "strengths": [
                "Python is strongly supported by project evidence.",
                "Git version control is strongly evidenced.",
            ],
            "priority_gaps": [
                "Machine Learning has high importance with insufficient evidence.",
                "Data Structures & Algorithms requires strengthening.",
            ],
            "recommendations": [
                "Build a predictive machine learning pipeline with reproducible metrics.",
                "Develop an algorithm visualizer project.",
            ],
            "explanation": "The candidate demonstrates strong foundational readiness for AI Engineer with 68/100 readiness. Python and Git are well-supported, while Machine Learning represents the primary development area.",
            "disclaimer": "ProfiQ evaluates evidence-based employability readiness from observable artifacts and resume claims. It does not provide hiring guarantees.",
        }

    def tearDown(self):
        """Restore environment variables."""
        if self._orig_api_key is not None:
            os.environ["GEMINI_API_KEY"] = self._orig_api_key
        elif "GEMINI_API_KEY" in os.environ:
            del os.environ["GEMINI_API_KEY"]

        if self._orig_model is not None:
            os.environ["GEMINI_MODEL"] = self._orig_model
        elif "GEMINI_MODEL" in os.environ:
            del os.environ["GEMINI_MODEL"]

    def _create_mock_client(self, text_response: str) -> MagicMock:
        """Helper to create a fully mocked GenAI client returning specific text."""
        mock_client = MagicMock()
        mock_response = MagicMock()
        mock_response.text = text_response
        mock_client.models.generate_content.return_value = mock_response
        return mock_client

    def test_1_gemini_provider_initialization(self):
        """1. Gemini provider initializes correctly with provided credentials and defaults."""
        provider = GeminiProvider(api_key="mock-key-123", model_name="gemini-2.5-flash")
        self.assertIsInstance(provider, LLMProvider)
        self.assertEqual(provider.api_key, "mock-key-123")
        self.assertEqual(provider.model_name, "gemini-2.5-flash")

    def test_2_valid_gemini_response(self):
        """2. Valid Gemini response is parsed and returns LLMExplanationResponse with provider_used='gemini'."""
        mock_client = self._create_mock_client(json.dumps(self.valid_gemini_json))
        provider = GeminiProvider(api_key="mock-key", client=mock_client)

        res = provider.generate_explanation(self.sample_analysis)
        self.assertIsInstance(res, LLMExplanationResponse)
        self.assertEqual(res.provider_used, "gemini")
        self.assertIn("68/100", res.overview)
        self.assertIn("AI Engineer", res.overview)
        self.assertEqual(len(res.strengths), 2)
        self.assertEqual(len(res.priority_gaps), 2)
        self.assertEqual(len(res.recommendations), 2)
        self.assertTrue(len(res.explanation) > 20)

    def test_3_structured_json_parsing_with_markdown(self):
        """3. Handles structured JSON returned within markdown code fences (```json ... ```)."""
        wrapped_text = f"```json\n{json.dumps(self.valid_gemini_json)}\n```"
        mock_client = self._create_mock_client(wrapped_text)
        provider = GeminiProvider(api_key="mock-key", client=mock_client)

        res = provider.generate_explanation(self.sample_analysis)
        self.assertIsInstance(res, LLMExplanationResponse)
        self.assertEqual(res.provider_used, "gemini")
        self.assertIn("68/100", res.overview)

    def test_4_invalid_json_handling(self):
        """4. Invalid JSON from Gemini raises error and degrades cleanly to fallback provider."""
        mock_client = self._create_mock_client("This is completely invalid JSON { broken")
        provider = GeminiProvider(api_key="mock-key", client=mock_client)

        # Direct provider call raises exception
        with self.assertRaises(Exception):
            provider.generate_explanation(self.sample_analysis)

        # Service coordinator catches error and transparently uses fallback
        res = generate_candidate_explanation(self.sample_analysis, provider=provider)
        self.assertIsInstance(res, LLMExplanationResponse)
        self.assertEqual(res.provider_used, "fallback")
        self.assertIn("AI Engineer", res.overview)

    def test_5_invalid_pydantic_response(self):
        """5. JSON missing required fields triggers validation failure and falls back cleanly."""
        incomplete_json = {"random_field": "no overview, explanation, or disclaimer"}
        mock_client = self._create_mock_client(json.dumps(incomplete_json))
        provider = GeminiProvider(api_key="mock-key", client=mock_client)

        with self.assertRaises(ValueError):
            provider.generate_explanation(self.sample_analysis)

        res = generate_candidate_explanation(self.sample_analysis, provider=provider)
        self.assertIsInstance(res, LLMExplanationResponse)
        self.assertEqual(res.provider_used, "fallback")

    def test_6_gemini_api_exception_handling(self):
        """6. Runtime API exceptions from Gemini SDK degrade gracefully to fallback without exposing errors."""
        mock_client = MagicMock()
        mock_client.models.generate_content.side_effect = RuntimeError("503 Service Unavailable / Quota Exceeded")
        provider = GeminiProvider(api_key="mock-key", client=mock_client)

        res = generate_candidate_explanation(self.sample_analysis, provider=provider)
        self.assertIsInstance(res, LLMExplanationResponse)
        self.assertEqual(res.provider_used, "fallback")
        self.assertIn("AI Engineer", res.overview)

    def test_7_missing_api_key_uses_fallback(self):
        """7. Missing or empty GEMINI_API_KEY defaults cleanly to deterministic fallback provider."""
        os.environ["GEMINI_API_KEY"] = ""
        self.assertFalse(is_gemini_configured())

        default_provider = get_default_provider()
        self.assertIsInstance(default_provider, DeterministicFallbackLLM)

        res = generate_candidate_explanation(self.sample_analysis)
        self.assertIsInstance(res, LLMExplanationResponse)
        self.assertEqual(res.provider_used, "fallback")

    def test_8_fallback_after_gemini_failure(self):
        """8. Fallback provider returns valid deterministic response when Gemini fails."""
        failing_mock = MagicMock()
        failing_mock.models.generate_content.side_effect = ConnectionError("Connection refused")
        provider = GeminiProvider(api_key="mock-key", client=failing_mock)

        res = generate_candidate_explanation(self.sample_analysis, provider=provider)
        self.assertEqual(res.provider_used, "fallback")
        self.assertIn("68/100", res.overview)
        self.assertTrue(len(res.strengths) >= 1)
        self.assertTrue(len(res.priority_gaps) >= 1)

    def test_9_prompt_contains_supplied_analysis(self):
        """9. Prompt builder injects all key deterministic analysis fields verbatim."""
        prompt = build_explanation_prompt(self.sample_analysis)
        self.assertIn("AI Engineer", prompt)
        self.assertIn("68", prompt)
        self.assertIn("Python", prompt)
        self.assertIn("Git", prompt)
        self.assertIn("Machine Learning", prompt)
        self.assertIn("Build a predictive machine learning pipeline", prompt)

    def test_10_prompt_says_not_to_invent_evidence(self):
        """10. Prompt explicitly instructs model not to invent evidence, skills, or projects."""
        prompt = build_explanation_prompt(self.sample_analysis)
        self.assertIn("Do not invent skills", prompt)
        self.assertIn("Do not invent evidence", prompt)
        self.assertIn("Do not invent projects", prompt)

    def test_11_prompt_says_not_to_claim_mastery(self):
        """11. Prompt explicitly forbids mastery claims and employment guarantees."""
        prompt = build_explanation_prompt(self.sample_analysis)
        self.assertIn("Do not claim mastery", prompt)
        self.assertIn("mastered", prompt)
        self.assertIn("expert", prompt)
        self.assertIn("Do not guarantee employment", prompt)

    def test_12_unsupported_claims_trigger_fallback(self):
        """12. Hallucinated mastery claims or score contradictions fail validation and trigger fallback."""
        # Scenario A: Forbidden mastery claim
        mastery_json = copy.deepcopy(self.valid_gemini_json)
        mastery_json["explanation"] = "The candidate has completely mastered AI engineering and is an expert guaranteed to get hired."
        mock_client = self._create_mock_client(json.dumps(mastery_json))
        provider = GeminiProvider(api_key="mock-key", client=mock_client)

        res = generate_candidate_explanation(self.sample_analysis, provider=provider)
        self.assertEqual(res.provider_used, "fallback")

        # Scenario B: Numerical score contradiction
        contradicting_json = copy.deepcopy(self.valid_gemini_json)
        contradicting_json["overview"] = "The candidate achieves a readiness score of 95/100 for AI Engineer."
        mock_client2 = self._create_mock_client(json.dumps(contradicting_json))
        provider2 = GeminiProvider(api_key="mock-key", client=mock_client2)

        res2 = generate_candidate_explanation(self.sample_analysis, provider=provider2)
        self.assertEqual(res2.provider_used, "fallback")

    def test_13_deterministic_analysis_remains_unchanged(self):
        """13. Execution through GeminiProvider never mutates the original analysis data structure."""
        mock_client = self._create_mock_client(json.dumps(self.valid_gemini_json))
        provider = GeminiProvider(api_key="mock-key", client=mock_client)

        original_copy = copy.deepcopy(self.sample_analysis)
        generate_candidate_explanation(self.sample_analysis, provider=provider)

        self.assertEqual(self.sample_analysis, original_copy)
        self.assertEqual(self.sample_analysis["readiness_score"], 68)

    def test_14_model_name_is_configurable(self):
        """14. Model name respects default, environment override, and explicit constructor argument."""
        # Default model
        os.environ.pop("GEMINI_MODEL", None)
        self.assertEqual(get_gemini_model(), DEFAULT_GEMINI_MODEL)

        # Environment variable override
        os.environ["GEMINI_MODEL"] = "gemini-2.0-flash-lite"
        self.assertEqual(get_gemini_model(), "gemini-2.0-flash-lite")

        # Constructor argument override
        provider = GeminiProvider(api_key="mock", model_name="gemini-custom-model")
        self.assertEqual(provider.model_name, "gemini-custom-model")

    def test_15_existing_llm_endpoint_schema_valid(self):
        """15. FastAPI /llm/explain and /api/llm/explain endpoints return schema-valid responses."""
        if not HAS_TEST_CLIENT:
            self.skipTest("fastapi.testclient.TestClient not available.")

        client = TestClient(app)
        for path in ["/llm/explain", "/api/llm/explain"]:
            resp = client.post(path, json={"analysis": self.sample_analysis})
            self.assertEqual(resp.status_code, 200, f"Endpoint {path} failed: {resp.text}")
            data = resp.json()
            # Validate schema conforms strictly to LLMExplanationResponse
            validated = LLMExplanationResponse(**data)
            self.assertIn(validated.provider_used, ["gemini", "fallback"])
            self.assertTrue(len(validated.overview) > 0)
            self.assertTrue(len(validated.disclaimer) > 0)

    def test_16_repeated_fallback_execution_is_deterministic(self):
        """16. Repeated fallback execution is strictly deterministic with identical output across calls."""
        fallback = DeterministicFallbackLLM()
        res1 = fallback.generate_explanation(self.sample_analysis)
        res2 = fallback.generate_explanation(self.sample_analysis)

        self.assertEqual(res1.overview, res2.overview)
        self.assertEqual(res1.strengths, res2.strengths)
        self.assertEqual(res1.priority_gaps, res2.priority_gaps)
        self.assertEqual(res1.recommendations, res2.recommendations)
        self.assertEqual(res1.explanation, res2.explanation)
        self.assertEqual(res1.disclaimer, res2.disclaimer)
        self.assertEqual(res1.provider_used, res2.provider_used)

    def test_17_api_key_not_exposed_in_repr_or_str(self):
        """17. GeminiProvider repr and str do not expose secret API key."""
        secret_key = "super-secret-gemini-key-999"
        provider = GeminiProvider(api_key=secret_key, model_name="gemini-2.5-flash")
        self.assertNotIn(secret_key, repr(provider))
        self.assertNotIn(secret_key, str(provider))


if __name__ == "__main__":
    unittest.main()
