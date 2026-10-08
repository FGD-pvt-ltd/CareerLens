"""
Skill Gap Service

Identifies, evaluates, and prioritizes skill gaps for role requirements where candidate
evidence confidence is below the strong match threshold (< 0.70).
"""

from typing import Any, Dict, List, Union
from models.gap import SkillGap
from models.matching import RoleSkillMatch

SEVERITY_ORDER: Dict[str, int] = {
    "high": 0,
    "medium": 1,
    "low": 2,
}


def determine_gap_severity(importance: str, confidence: float) -> str:
    """
    Deterministically computes gap severity based on role requirement importance
    and candidate evidence confidence:
    
    - High importance + confidence < 0.50 -> 'high'
    - High importance + confidence >= 0.50 but < 0.70 -> 'medium'
    - Medium importance + confidence < 0.50 -> 'high'
    - Medium importance + confidence >= 0.50 but < 0.70 -> 'medium'
    - Low importance + confidence < 0.50 -> 'medium'
    - Low importance + confidence >= 0.50 but < 0.70 -> 'low'
    """
    imp = (importance or "").strip().lower()
    conf = max(0.0, float(confidence))

    if imp in ("high", "medium"):
        if conf < 0.50:
            return "high"
        else:
            return "medium"
    else:
        # "low" or any lower priority default
        if conf < 0.50:
            return "medium"
        else:
            return "low"


def generate_gap_explanation(
    skill_name: str,
    importance: str,
    candidate_confidence: float,
    evidence_status: str,
) -> str:
    """
    Constructs an evidence-focused, constructive explanation for a skill gap.
    Frames missing or weak evidence without asserting lack of candidate capability.
    """
    imp = (importance or "medium").strip().lower()
    conf = max(0.0, float(candidate_confidence))
    status = (evidence_status or "").strip().lower()

    if conf == 0.0 or status == "insufficient_evidence":
        return (
            f"{skill_name} is a {imp}-priority requirement for this role, "
            f"but no supporting evidence was available."
        )
    elif conf < 0.50:
        return (
            f"{skill_name} is a {imp}-priority requirement with insufficient "
            f"supporting evidence (confidence {conf:.2f})."
        )
    else:
        return (
            f"{skill_name} is a {imp}-priority requirement with partial "
            f"supporting evidence (confidence {conf:.2f}), "
            f"which represents an opportunity to strengthen role readiness."
        )


def identify_and_prioritize_gaps(
    skill_matches: List[Union[RoleSkillMatch, Dict[str, Any]]],
) -> List[SkillGap]:
    """
    Extracts all role-required skills with candidate confidence < 0.70,
    computes deterministic gap severity and explanations, and sorts them by:
    1. Gap severity priority (high > medium > low)
    2. Importance weight descending
    3. Candidate confidence ascending (least supported first)
    4. Skill name ascending (deterministic tie-breaker)
    """
    gaps: List[SkillGap] = []

    for item in skill_matches:
        if isinstance(item, dict):
            skill_name = item.get("skill_name", "")
            category = item.get("category", "")
            importance = item.get("importance", "medium")
            importance_weight = float(item.get("importance_weight", 0.6))
            cand_conf = float(item.get("candidate_confidence", 0.0))
            cand_status = str(item.get("candidate_evidence_status", "insufficient_evidence"))
            match_status = str(item.get("match_status", "gap"))
        else:
            skill_name = getattr(item, "skill_name", "")
            category = getattr(item, "category", "")
            importance = getattr(item, "importance", "medium")
            importance_weight = float(getattr(item, "importance_weight", 0.6))
            cand_conf = float(getattr(item, "candidate_confidence", 0.0))
            cand_status = str(getattr(item, "candidate_evidence_status", "insufficient_evidence"))
            match_status = str(getattr(item, "match_status", "gap"))

        # Gaps are role requirements where candidate confidence is below strong match (< 0.70)
        if cand_conf >= 0.70:
            continue

        cand_conf_rounded = round(cand_conf, 2)
        severity = determine_gap_severity(importance, cand_conf_rounded)
        explanation = generate_gap_explanation(
            skill_name=skill_name,
            importance=importance,
            candidate_confidence=cand_conf_rounded,
            evidence_status=cand_status,
        )

        gap_item = SkillGap(
            skill_name=skill_name,
            category=category,
            importance=importance,
            importance_weight=round(importance_weight, 2),
            candidate_confidence=cand_conf_rounded,
            match_status=match_status,
            gap_severity=severity,
            evidence_status=cand_status,
            explanation=explanation,
        )
        gaps.append(gap_item)

    # Prioritize gaps
    def sort_key(g: SkillGap):
        sev_rank = SEVERITY_ORDER.get(g.gap_severity.lower(), 3)
        return (
            sev_rank,
            -g.importance_weight,
            g.candidate_confidence,
            g.skill_name.lower(),
        )

    gaps.sort(key=sort_key)
    return gaps
