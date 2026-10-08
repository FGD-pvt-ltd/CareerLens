"""
Evidence Service

Associates candidate evidence artifacts with detected skills, applies verification
rules (e.g., certification dampening, multi-source aggregation), and creates
structured Skill -> Evidence -> Evidence Strength -> Confidence representations.
"""

from typing import List, Dict, Any, Union
from config.skills_dictionary import SKILL_DEFINITIONS
from models.evidence import (
    EvidenceItem,
    EvidenceStrength,
    EvidenceType,
    SkillEvidenceMapping,
    VerificationStatus,
    EvidenceAssociationResponse,
)

# Canonical skill lookup mapping lowercase name -> (canonical_name, category)
_CANONICAL_LOOKUP: Dict[str, tuple[str, str]] = {}
for skill in SKILL_DEFINITIONS:
    canonical = skill["name"]
    category = skill["category"]
    _CANONICAL_LOOKUP[canonical.lower()] = (canonical, category)
    for alias in skill["aliases"]:
        _CANONICAL_LOOKUP[alias.lower()] = (canonical, category)


def _resolve_canonical_skill(skill_name: str) -> tuple[str, str]:
    """Resolves a raw skill name into canonical name and category."""
    lower = skill_name.strip().lower()
    if lower in _CANONICAL_LOOKUP:
        return _CANONICAL_LOOKUP[lower]
    return (skill_name.strip(), "General Technical Skills")


def _calculate_aggregate_metrics(evidence_items: List[EvidenceItem]) -> tuple[str, float, VerificationStatus, str]:
    """
    Computes overall evidence strength, aggregate confidence, and verification status.
    
    Rules enforced:
    1. No evidence: strength 'none', confidence 0.0, status UNVERIFIED.
    2. A certificate alone cannot grant 'strong' evidence (capped at 'moderate', max confidence 0.60).
    3. Multiple independent evidence sources reinforce aggregate confidence.
    4. Projects, code repos, and platform scores provide practical proof.
    """
    if not evidence_items:
        return ("none", 0.0, VerificationStatus.UNVERIFIED, "Claimed in resume, but no supporting evidence provided.")

    # Rule: Check if certification is the ONLY source of evidence
    is_only_certification = all(e.evidence_type == EvidenceType.CERTIFICATION for e in evidence_items)

    strengths = [e.evidence_strength for e in evidence_items]
    has_strong = any(s == EvidenceStrength.STRONG for s in strengths)
    has_moderate = any(s == EvidenceStrength.MODERATE for s in strengths)

    # Base confidence is the highest single piece of evidence
    base_confidence = max(e.confidence for e in evidence_items)

    # Multi-source boost: additional independent artifacts increase credibility (+0.05 per extra source, max +0.15)
    source_boost = min(0.15, 0.05 * (len(evidence_items) - 1)) if len(evidence_items) > 1 else 0.0
    combined_confidence = round(min(1.0, base_confidence + source_boost), 2)

    # Rule: A certificate alone should NOT automatically mean the skill is strongly verified
    if is_only_certification:
        overall_strength = EvidenceStrength.MODERATE.value if (has_strong or has_moderate) else EvidenceStrength.WEAK.value
        combined_confidence = min(0.60, combined_confidence)
        status = VerificationStatus.PARTIALLY_VERIFIED
        note = "Supported by certification. Theoretical or coursework attestation present, but practical code artifacts are pending."
        return (overall_strength, combined_confidence, status, note)

    # Multi-source or non-certification evaluation
    if has_strong or (len(evidence_items) >= 2 and has_moderate):
        overall_strength = EvidenceStrength.STRONG.value
        status = VerificationStatus.VERIFIED if combined_confidence >= 0.70 else VerificationStatus.PARTIALLY_VERIFIED
        note = "Strong practical evidence verified through project, repository, or coding evaluation."
    elif has_moderate:
        overall_strength = EvidenceStrength.MODERATE.value
        status = VerificationStatus.PARTIALLY_VERIFIED
        note = "Moderate evidence available supporting this skill."
    else:
        overall_strength = EvidenceStrength.WEAK.value
        status = VerificationStatus.PARTIALLY_VERIFIED
        note = "Weak evidence provided. Suggest adding code artifacts or detailed projects."

    return (overall_strength, combined_confidence, status, note)


def associate_evidence_with_skills(
    detected_skills: Union[List[Dict[str, Any]], List[str], None] = None,
    evidence_items: Union[List[EvidenceItem], List[Dict[str, Any]], None] = None,
) -> EvidenceAssociationResponse:
    """
    Associates evidence items with skills detected in the candidate's resume.
    
    Args:
        detected_skills: List of skill dictionaries (from skill_extractor) or list of skill names.
        evidence_items: List of EvidenceItem instances or dictionaries representing artifacts.
        
    Returns:
        EvidenceAssociationResponse with structured Skill -> Evidence mappings.
    """
    detected_skills = detected_skills or []
    evidence_items_raw = evidence_items or []

    # 1. Normalize and parse EvidenceItem instances
    parsed_evidence: List[EvidenceItem] = []
    for item in evidence_items_raw:
        if isinstance(item, EvidenceItem):
            parsed_evidence.append(item)
        elif isinstance(item, dict):
            parsed_evidence.append(EvidenceItem(**item))

    # 2. Build map of skills to track
    # Key: canonical_name.lower() -> { "name": ..., "category": ..., "is_claimed": bool, "found_in": ..., "evidence": [...] }
    skill_registry: Dict[str, Dict[str, Any]] = {}

    # Ingest detected skills from resume
    for skill_entry in detected_skills:
        if isinstance(skill_entry, dict):
            raw_name = skill_entry.get("name", "")
            category = skill_entry.get("category", "")
            found_in = skill_entry.get("found_in", "resume")
        else:
            raw_name = str(skill_entry)
            category = ""
            found_in = "resume"

        if not raw_name:
            continue

        canonical_name, fallback_cat = _resolve_canonical_skill(raw_name)
        category = category or fallback_cat
        key = canonical_name.lower()

        skill_registry[key] = {
            "skill_name": canonical_name,
            "category": category,
            "is_claimed_in_resume": True,
            "found_in": found_in,
            "evidence": [],
        }

    # 3. Associate evidence items with skills via related_skills
    for evidence in parsed_evidence:
        for related_skill_raw in evidence.related_skills:
            canonical_name, fallback_cat = _resolve_canonical_skill(related_skill_raw)
            key = canonical_name.lower()

            if key not in skill_registry:
                # Skill demonstrated by external evidence even if NOT explicitly listed on resume
                skill_registry[key] = {
                    "skill_name": canonical_name,
                    "category": fallback_cat,
                    "is_claimed_in_resume": False,
                    "found_in": None,
                    "evidence": [],
                }

            skill_registry[key]["evidence"].append(evidence)

    # 4. Generate structured SkillEvidenceMapping for each skill
    mappings: List[SkillEvidenceMapping] = []
    verified_count = 0
    partially_verified_count = 0
    unverified_count = 0

    # Sort skills deterministically by category then name
    sorted_skills = sorted(
        skill_registry.values(),
        key=lambda s: (s["category"], s["skill_name"]),
    )

    for item in sorted_skills:
        ev_list: List[EvidenceItem] = item["evidence"]
        has_ev = len(ev_list) > 0

        overall_strength, confidence, status, note = _calculate_aggregate_metrics(ev_list)

        if status == VerificationStatus.VERIFIED:
            verified_count += 1
        elif status == VerificationStatus.PARTIALLY_VERIFIED:
            partially_verified_count += 1
        else:
            unverified_count += 1

        mapping = SkillEvidenceMapping(
            skill_name=item["skill_name"],
            category=item["category"],
            is_claimed_in_resume=item["is_claimed_in_resume"],
            found_in=item["found_in"],
            verification_status=status,
            has_evidence=has_ev,
            overall_evidence_strength=overall_strength,
            aggregate_confidence=confidence,
            evidence_count=len(ev_list),
            evidence=ev_list,
            notes=note,
        )
        mappings.append(mapping)

    summary = (
        f"Evaluated {len(mappings)} candidate skills: {verified_count} verified with strong evidence, "
        f"{partially_verified_count} partially verified with moderate/weak evidence, and "
        f"{unverified_count} unverified claims awaiting evidence."
    )

    return EvidenceAssociationResponse(
        total_skills=len(mappings),
        verified_count=verified_count,
        partially_verified_count=partially_verified_count,
        unverified_count=unverified_count,
        skills_evidence_map=mappings,
        verification_summary=summary,
    )
