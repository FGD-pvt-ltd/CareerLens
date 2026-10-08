"""
Candidate Analysis Orchestrator Service

Combines resume skill extraction, evidence aggregation, role requirements matching,
readiness scoring, skill gap detection, and personalized roadmap generation into
ONE unified, deterministic, and explainable analysis pipeline.
"""

from typing import Any, Dict, List, Optional, Union

from models.analysis import AnalysisResponse
from models.evidence import EvidenceItem
from models.gap import SkillGap
from models.matching import RoleSkillMatch
from models.roadmap import RoadmapItem
from services.evidence_aggregator import aggregate_evidence_for_skills
from services.readiness_service import analyze_job_readiness
from services.roadmap_service import generate_personalized_roadmap
from services.role_matcher import match_candidate_to_role
from services.role_service import resolve_role_requirements
from services.skill_extractor import extract_skills_from_text


def generate_analysis_summary(
    matched_role: str,
    readiness_score: int,
    readiness_label: str,
    skill_matches: List[RoleSkillMatch],
    skill_gaps: List[SkillGap],
    roadmap_items: List[RoadmapItem],
) -> str:
    """
    Constructs a deterministic, explainable human-readable summary detailing:
    - Target job role
    - Overall readiness score and descriptive tier
    - Strongest supported skills
    - Priority gaps
    - Concrete recommended next steps
    
    Reflects actual analysis results and uses strictly evidence-based language
    without claiming absolute or verified mastery.
    """
    sections: List[str] = [
        f"Candidate analysis for {matched_role}.",
        f"Overall readiness: {readiness_score}/100 — {readiness_label}.",
    ]

    # 1. Strongest supported skills (confidence >= 0.70)
    strong_skills = [
        m.skill_name
        for m in skill_matches
        if getattr(m, "match_status", "") == "strong_match"
    ]
    sections.append("Strongest supported skills:")
    if strong_skills:
        sections.append(", ".join(strong_skills))
    else:
        sections.append("No skills currently meet the strong support threshold.")

    # 2. Priority skill gaps (high severity first)
    high_gaps = [
        g.skill_name
        for g in skill_gaps
        if getattr(g, "gap_severity", "") == "high"
    ]
    if not high_gaps and skill_gaps:
        high_gaps = [g.skill_name for g in skill_gaps]

    sections.append("Priority gaps:")
    if high_gaps:
        sections.append(", ".join(high_gaps))
    else:
        sections.append("No critical skill gaps identified.")

    # 3. Recommended next steps drawn from top roadmap milestones
    sections.append("Recommended next steps:")
    if roadmap_items:
        top_items = roadmap_items[:2]
        action_parts = []
        for it in top_items:
            action_parts.append(
                f"build a practical project for {it.skill_name} ('{it.suggested_project}')"
            )
        action_desc = " and ".join(action_parts)
        sections.append(
            f"Focus on priority gaps: {action_desc}, and produce verifiable evidence artifacts to support your claims."
        )
    else:
        sections.append(
            "All required skills are strongly supported by available evidence. Maintain current repositories and explore advanced domain topics."
        )

    return "\n\n".join(sections)


def analyze_candidate(
    resume_text: str,
    target_role: str,
    evidence_items: Optional[List[Union[EvidenceItem, Dict[str, Any], Any]]] = None,
) -> AnalysisResponse:
    """
    Executes the complete candidate evaluation pipeline:
    1. Validates resume text and target role.
    2. Extracts claimed skills from resume text.
    3. Aggregates claimed skills with external evidence items.
    4. Resolves canonical role requirements.
    5. Computes skill-by-skill role matches and weighted contributions.
    6. Calculates deterministic readiness score and identifies skill gaps.
    7. Generates personalized milestone roadmap.
    8. Synthesizes an explainable, evidence-grounded summary.
    
    Args:
        resume_text: Cleaned, readable text extracted from candidate resume.
        target_role: Target job title or alias (e.g. 'AI Engineer', 'SDE').
        evidence_items: Optional list of external EvidenceItem objects or dictionaries.
        
    Returns:
        AnalysisResponse with complete structured analysis.
        
    Raises:
        ValueError: If resume_text is empty or target_role is unrecognized.
    """
    # STEP 1: Validate input
    if not resume_text or not isinstance(resume_text, str) or not resume_text.strip():
        raise ValueError("Resume text cannot be empty or contain only whitespace.")

    if not target_role or not isinstance(target_role, str) or not target_role.strip():
        raise ValueError("Target role cannot be empty or contain only whitespace.")

    # Validate target role against canonical role requirements engine
    role_requirements = resolve_role_requirements(target_role)
    matched_role = role_requirements.matched_role

    # STEP 2: Extract claimed skills using existing skill extractor
    extraction_result = extract_skills_from_text(resume_text)
    claimed_skills = extraction_result.get("skills_detected_in_resume", [])

    # STEP 3 & 4: Combine claimed skills and evidence items using evidence aggregation service
    evidence_list = evidence_items or []
    aggregation_response = aggregate_evidence_for_skills(
        claimed_skills=claimed_skills,
        evidence_items=evidence_list,
    )
    aggregated_skills = aggregation_response.skills
    evidence_explanations = getattr(aggregation_response, "evidence_explanations", [])

    # STEP 5 & 6: Match candidate aggregated skills against role requirements
    role_match_response = match_candidate_to_role(
        role_input=matched_role,
        candidate_skills=aggregated_skills,
    )
    skill_matches = role_match_response.skill_matches

    # STEP 7: Calculate readiness score, label, and prioritized gaps
    readiness_response = analyze_job_readiness(
        role_input=matched_role,
        candidate_skills=aggregated_skills,
    )
    readiness_score = readiness_response.readiness_score
    readiness_label = readiness_response.score_label
    skill_gaps = readiness_response.skill_gaps

    # STEP 8: Generate personalized roadmap from identified skill gaps
    roadmap_response = generate_personalized_roadmap(
        role_input=matched_role,
        candidate_skills=aggregated_skills,
    )

    # STEP 9: Generate explainable human-readable summary
    summary = generate_analysis_summary(
        matched_role=matched_role,
        readiness_score=readiness_score,
        readiness_label=readiness_label,
        skill_matches=skill_matches,
        skill_gaps=skill_gaps,
        roadmap_items=roadmap_response.roadmap_items,
    )

    # STEP 10: Return complete unified analysis
    return AnalysisResponse(
        target_role=matched_role,
        claimed_skills=claimed_skills,
        aggregated_skills=aggregated_skills,
        role_requirements=role_requirements,
        skill_matches=skill_matches,
        readiness_score=readiness_score,
        readiness_label=readiness_label,
        skill_gaps=skill_gaps,
        roadmap=roadmap_response,
        summary=summary,
        evidence_items=evidence_list,
        evidence_explanations=evidence_explanations,
    )
