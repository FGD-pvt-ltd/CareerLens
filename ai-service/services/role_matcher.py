"""
Role Matcher Service

Compares candidate aggregated skill confidence against target job role requirements
to deterministically compute skill-level match tiers (strong_match, partial_match, gap)
and explainable weighted contributions.
"""

from typing import Any, Dict, List, Union

from models.matching import RoleMatchResponse, RoleSkillMatch
from services.evidence_service import _resolve_canonical_skill
from services.role_service import resolve_role_requirements


def determine_match_status(confidence: float) -> str:
    """
    Categorizes candidate confidence into deterministic match status tiers:
    - confidence < 0.50: gap
    - 0.50 <= confidence < 0.70: partial_match
    - 0.70 <= confidence: strong_match
    """
    if confidence < 0.50:
        return "gap"
    elif confidence < 0.70:
        return "partial_match"
    else:
        return "strong_match"


def generate_match_explanation(
    skill_name: str,
    matched_role: str,
    importance: str,
    candidate_confidence: float,
    match_status: str,
) -> str:
    """
    Generates a deterministic, constructive explanation for a role skill match.
    Gaps indicate insufficient evidence, not lack of ability.
    """
    if match_status == "strong_match":
        return (
            f"{skill_name} is a {importance}-priority {matched_role} requirement "
            f"and is strongly supported by the candidate's available evidence."
        )
    elif match_status == "partial_match":
        return (
            f"{skill_name} is a {importance}-priority {matched_role} requirement with "
            f"partial evidence support; additional practical artifacts would strengthen this skill."
        )
    else:
        # Gap
        if candidate_confidence == 0.0:
            return (
                f"{skill_name} is an important {matched_role} requirement, but no "
                f"supporting evidence was available for this candidate."
            )
        else:
            return (
                f"{skill_name} is a {importance}-priority {matched_role} requirement, "
                f"but current supporting evidence is weak (confidence: {candidate_confidence:.2f})."
            )


def match_candidate_to_role(
    role_input: str,
    candidate_skills: List[Union[Dict[str, Any], Any]],
) -> RoleMatchResponse:
    """
    Matches candidate aggregated skill confidences against the requirements of a target role.
    
    Args:
        role_input: Target job role title or alias (e.g. "AI Engineer", "SDE")
        candidate_skills: List of candidate skill dictionaries or AggregatedSkillResult objects
        
    Returns:
        RoleMatchResponse detailing required skills, match tiers, and weighted contributions.
        
    Raises:
        ValueError: If role_input is invalid or not recognized in the supported taxonomy.
    """
    # 1. Resolve target role requirements
    role_reqs = resolve_role_requirements(role_input)
    matched_role = role_reqs.matched_role

    # 2. Ingest candidate skills into a canonical lookup dictionary
    candidate_lookup: Dict[str, Dict[str, Any]] = {}
    candidate_raw_keys = set()

    for item in candidate_skills or []:
        if hasattr(item, "skill_name"):
            raw_name = getattr(item, "skill_name")
            conf = getattr(item, "confidence", 0.0)
            status = getattr(item, "evidence_status", "insufficient_evidence")
            strength = getattr(item, "evidence_strength", "none")
        elif isinstance(item, dict):
            raw_name = item.get("skill_name") or item.get("name") or ""
            conf = item.get("confidence", 0.0)
            status = item.get("evidence_status", "insufficient_evidence")
            strength = item.get("evidence_strength", "none")
        else:
            continue

        if not raw_name:
            continue

        canonical_name, _ = _resolve_canonical_skill(str(raw_name))
        key = canonical_name.lower()
        candidate_raw_keys.add(key)

        # Clamp confidence safely between 0.0 and 0.95
        clamped_conf = max(0.0, min(0.95, float(conf)))

        # Handle duplicates: keep the entry with higher confidence
        if key in candidate_lookup:
            if clamped_conf > candidate_lookup[key]["confidence"]:
                candidate_lookup[key] = {
                    "canonical_name": canonical_name,
                    "confidence": clamped_conf,
                    "evidence_status": str(status),
                    "evidence_strength": str(strength),
                }
        else:
            candidate_lookup[key] = {
                "canonical_name": canonical_name,
                "confidence": clamped_conf,
                "evidence_status": str(status),
                "evidence_strength": str(strength),
            }

    # 3. Evaluate each role-required skill
    skill_matches: List[RoleSkillMatch] = []
    required_keys = set()

    strong_count = 0
    partial_count = 0
    gap_count = 0

    for req in role_reqs.skills_required:
        req_name = req.skill_name
        req_key = req_name.lower()
        required_keys.add(req_key)

        importance = req.importance
        weight = round(req.importance_weight, 2)

        # Check candidate support
        if req_key in candidate_lookup:
            cand = candidate_lookup[req_key]
            cand_conf = round(cand["confidence"], 2)
            cand_status = cand["evidence_status"]
            cand_strength = cand["evidence_strength"]
        else:
            cand_conf = 0.0
            cand_status = "insufficient_evidence"
            cand_strength = "none"

        match_status = determine_match_status(cand_conf)
        weighted_contribution = round(cand_conf * weight, 2)

        if match_status == "strong_match":
            strong_count += 1
        elif match_status == "partial_match":
            partial_count += 1
        else:
            gap_count += 1

        explanation = generate_match_explanation(
            skill_name=req_name,
            matched_role=matched_role,
            importance=importance,
            candidate_confidence=cand_conf,
            match_status=match_status,
        )

        match_item = RoleSkillMatch(
            skill_name=req_name,
            category=req.category,
            required=True,
            importance=importance,
            importance_weight=weight,
            candidate_confidence=cand_conf,
            candidate_evidence_status=cand_status,
            candidate_evidence_strength=cand_strength,
            match_status=match_status,
            weighted_match_contribution=weighted_contribution,
            explanation=explanation,
        )
        skill_matches.append(match_item)

    # 4. Identify extra candidate skills (not required by this role, NOT treated as gaps)
    unmatched_candidate_skills: List[str] = []
    for key, cand in candidate_lookup.items():
        if key not in required_keys:
            unmatched_candidate_skills.append(cand["canonical_name"])

    unmatched_candidate_skills.sort()

    return RoleMatchResponse(
        role=role_reqs.role,
        matched_role=matched_role,
        skills_evaluated=len(skill_matches),
        strong_matches=strong_count,
        partial_matches=partial_count,
        gaps=gap_count,
        skill_matches=skill_matches,
        unmatched_candidate_skills=unmatched_candidate_skills,
    )
