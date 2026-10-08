"""
Personalized Roadmap Service

Transforms identified role skill gaps into deterministic, prioritized, and
actionable improvement milestones with realistic student projects and verifiable
evidence recommendations.
"""

from typing import Any, Dict, List, Union
from config.roadmap_actions import get_skill_roadmap_actions
from models.roadmap import RoadmapItem, RoadmapResponse
from services.readiness_service import analyze_job_readiness


def estimate_roadmap_effort(gap_severity: str, importance: str) -> str:
    """
    Computes deterministic estimated effort based on gap severity and role importance:
    - High severity + high importance -> '1–2 months'
    - High severity + medium/low importance -> '2–4 weeks'
    - Medium severity + high/medium importance -> '2–4 weeks'
    - Medium severity + low importance -> '1–2 weeks'
    - Low severity -> '1–2 weeks'
    """
    sev = (gap_severity or "").strip().lower()
    imp = (importance or "").strip().lower()

    if sev == "high":
        if imp == "high":
            return "1–2 months"
        else:
            return "2–4 weeks"
    elif sev == "medium":
        if imp in ("high", "medium"):
            return "2–4 weeks"
        else:
            return "1–2 weeks"
    else:
        # Low severity
        return "1–2 weeks"


def generate_roadmap_reason(
    skill_name: str,
    matched_role: str,
    gap_severity: str,
    current_confidence: float,
) -> str:
    """
    Constructs an evidence-focused reason for why this skill milestone is needed,
    reinforcing ProfiQ's Claim -> Evidence -> Readiness -> Action lifecycle.
    """
    conf = max(0.0, float(current_confidence))

    if conf == 0.0 or conf < 0.50:
        return (
            f"{skill_name} is important for the {matched_role} role, but the available evidence "
            "currently provides insufficient support for the claim."
        )
    else:
        return (
            f"{skill_name} is required for the {matched_role} role with partial evidence support; "
            "creating additional verifiable artifacts will strengthen role readiness."
        )


def generate_personalized_roadmap(
    role_input: str,
    candidate_skills: List[Union[Dict[str, Any], Any]],
) -> RoadmapResponse:
    """
    Generates a personalized improvement roadmap by converting prioritized skill gaps
    into actionable milestones with concrete projects and evidence targets.
    
    Args:
        role_input: Target job role title or alias (e.g. 'AI Engineer', 'SDE')
        candidate_skills: List of candidate skill dictionaries or AggregatedSkillResult objects
        
    Returns:
        RoadmapResponse containing prioritized RoadmapItems and summary counts.
        
    Raises:
        ValueError: If role_input is invalid or not recognized in the supported taxonomy.
    """
    # 1. Reuse existing readiness service to resolve role and extract prioritized gaps
    readiness_res = analyze_job_readiness(
        role_input=role_input,
        candidate_skills=candidate_skills,
    )

    matched_role = readiness_res.matched_role
    gaps = readiness_res.skill_gaps

    roadmap_items: List[RoadmapItem] = []

    # 2. Convert each prioritized gap into a concrete roadmap milestone
    for idx, gap in enumerate(gaps):
        priority = idx + 1
        actions_data = get_skill_roadmap_actions(gap.skill_name)
        effort = estimate_roadmap_effort(gap.gap_severity, gap.importance)
        reason = generate_roadmap_reason(
            skill_name=gap.skill_name,
            matched_role=matched_role,
            gap_severity=gap.gap_severity,
            current_confidence=gap.candidate_confidence,
        )

        item = RoadmapItem(
            skill_name=gap.skill_name,
            category=gap.category,
            priority=priority,
            importance=gap.importance,
            current_confidence=gap.candidate_confidence,
            current_evidence_status=gap.evidence_status,
            gap_severity=gap.gap_severity,
            goal=actions_data["goal"],
            recommended_actions=actions_data["recommended_actions"],
            suggested_project=actions_data["suggested_project"],
            suggested_evidence=actions_data["suggested_evidence"],
            estimated_effort=effort,
            reason=reason,
        )
        roadmap_items.append(item)

    # 3. Calculate category counts based on gap severity tiers
    high_count = sum(1 for it in roadmap_items if it.gap_severity == "high")
    med_count = sum(1 for it in roadmap_items if it.gap_severity == "medium")
    low_count = sum(1 for it in roadmap_items if it.gap_severity == "low")

    return RoadmapResponse(
        role=readiness_res.role,
        matched_role=matched_role,
        total_roadmap_items=len(roadmap_items),
        high_priority_items=high_count,
        medium_priority_items=med_count,
        low_priority_items=low_count,
        roadmap_items=roadmap_items,
    )
