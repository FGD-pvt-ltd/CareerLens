"""
Deterministic Fallback LLM Provider

Provides reliable, deterministic natural-language explanations derived from
structured candidate analysis without requiring external API keys, networks, or models.
"""

from typing import Any, Dict, List, Optional, Union

from models.llm import LLMExplanationResponse
from services.llm_provider import LLMProvider

DEFAULT_DISCLAIMER = (
    "ProfiQ evaluates evidence-based employability readiness from observable artifacts "
    "and resume claims. It does not provide hiring guarantees or assess unobservable capabilities. "
    "Missing evidence represents an absence of verifiable artifacts rather than a lack of ability."
)


def _get_field(data: Any, key: str, default: Any = None) -> Any:
    """Safely extracts a field from either a dict or an object."""
    if isinstance(data, dict):
        return data.get(key, default)
    return getattr(data, key, default)


class DeterministicFallbackLLM(LLMProvider):
    """
    Deterministic implementation of LLMProvider that synthesizes structured
    analysis data into clear, constructive, and evidence-grounded explanations.
    """

    def generate_explanation(
        self,
        analysis: Union[Dict[str, Any], Any],
        candidate_context: Optional[str] = None,
        tone: Optional[str] = None,
    ) -> LLMExplanationResponse:
        """
        Derives an explainable natural-language assessment entirely from structured analysis.
        """
        target_role = _get_field(analysis, "target_role") or "the target role"
        readiness_score = int(_get_field(analysis, "readiness_score", 0))
        readiness_label = _get_field(analysis, "readiness_label") or _get_field(analysis, "score_label") or "Needs Significant Development"

        # 1. Derive Strengths from skill_matches
        raw_matches = _get_field(analysis, "skill_matches", [])
        strengths: List[str] = []

        for m in raw_matches:
            name = _get_field(m, "skill_name") or ""
            status = _get_field(m, "match_status") or ""
            conf = float(_get_field(m, "candidate_confidence", 0.0))

            if not name:
                continue

            if status == "strong_match" or conf >= 0.70:
                strengths.append(f"{name} is strongly supported by the available evidence.")
            elif status == "partial_match" or (0.50 <= conf < 0.70):
                strengths.append(f"{name} has supporting evidence.")

        if not strengths:
            strengths.append("No skills currently meet the strong evidence support threshold for this role.")

        # 2. Derive Priority Gaps from skill_gaps
        raw_gaps = _get_field(analysis, "skill_gaps", [])
        priority_gaps: List[str] = []

        for g in raw_gaps:
            name = _get_field(g, "skill_name") or ""
            conf = float(_get_field(g, "candidate_confidence", 0.0))
            status = _get_field(g, "match_status") or ""

            if not name:
                continue

            if status == "partial_match" or (0.50 <= conf < 0.70):
                priority_gaps.append(f"{name} is currently a partial match.")
            else:
                priority_gaps.append(f"{name} has insufficient evidence.")

        if not priority_gaps:
            priority_gaps.append("No critical skill gaps identified for this role.")

        # 3. Derive Recommendations from roadmap
        raw_roadmap = _get_field(analysis, "roadmap", [])
        if isinstance(raw_roadmap, list):
            roadmap_items = raw_roadmap
        elif hasattr(raw_roadmap, "roadmap_items"):
            roadmap_items = raw_roadmap.roadmap_items
        elif isinstance(raw_roadmap, dict):
            roadmap_items = raw_roadmap.get("roadmap_items", [])
        else:
            roadmap_items = []

        recommendations: List[str] = []
        for it in roadmap_items:
            name = _get_field(it, "skill_name") or ""
            project = _get_field(it, "suggested_project") or ""
            goal = _get_field(it, "goal") or ""

            if not name:
                continue

            if project:
                recommendations.append(f"Build a practical {name} project ('{project}').")
            elif goal:
                recommendations.append(f"{goal}")
            else:
                recommendations.append(f"Strengthen {name} through regular coding practice.")

        if not recommendations:
            recommendations.append(
                "Maintain active project repositories and continue exploring advanced topics relevant to your target role."
            )

        # 4. Construct Overview
        overview = (
            f"You are currently {readiness_label.lower()} for the {target_role} role "
            f"with a readiness score of {readiness_score}/100."
        )

        # 5. Construct Coherent Narrative Explanation
        explanation_blocks: List[str] = [
            overview,
            f"Demonstrated Strengths:\n" + "\n".join(f"- {s}" for s in strengths),
            f"Priority Gaps:\n" + "\n".join(f"- {g}" for g in priority_gaps),
            f"Recommended Next Steps:\n" + "\n".join(f"- {r}" for r in recommendations),
        ]
        explanation = "\n\n".join(explanation_blocks)

        return LLMExplanationResponse(
            overview=overview,
            strengths=strengths,
            priority_gaps=priority_gaps,
            recommendations=recommendations,
            explanation=explanation,
            disclaimer=DEFAULT_DISCLAIMER,
        )
