"""
Evidence Aggregator Service

Combines a candidate's claimed resume skills with all available evidence artifacts
to compute deterministic, explainable evidence confidence without claiming mastery.
"""

from typing import Any, Dict, List, Optional, Tuple, Union

from models.evidence import (
    EvidenceItem,
    EvidenceStrength,
    EvidenceType,
    EvidenceExplanation,
    CERTIFICATION_CAP_TYPE,
    CERTIFICATION_CAP_TITLE,
    CERTIFICATION_CAP_MESSAGE,
)
from models.aggregation import AggregatedSkillResult, EvidenceAggregationResponse
from services.evidence_service import _resolve_canonical_skill

CONFIDENCE_MAX = 0.95


def _get_artifact_key(item: EvidenceItem) -> str:
    """
    Returns a unique identifier for an evidence artifact to prevent duplicate
    entries from the same repository or source from artificially inflating confidence.
    """
    if item.url and item.url.strip():
        return item.url.strip().lower()
    source_str = (item.source or "").strip().lower()
    title_str = (item.title or "").strip().lower()
    return f"{source_str}::{title_str}"


get_artifact_key = _get_artifact_key


def _format_source_types_phrase(unique_items: List[EvidenceItem]) -> str:
    """Formats a readable phrase summarizing unique evidence sources/types."""
    types = []
    seen_types = set()
    for item in unique_items:
        t = item.evidence_type
        if t in seen_types:
            continue
        seen_types.add(t)
        if t == EvidenceType.GITHUB_REPOSITORY:
            types.append("GitHub repositories")
        elif t == EvidenceType.CODING_PLATFORM:
            types.append(f"coding platform activity on {item.source}")
        elif t == EvidenceType.PROJECT:
            types.append("project implementations")
        elif t == EvidenceType.CERTIFICATION:
            types.append("a certification")
        elif t == EvidenceType.ASSESSMENT:
            types.append(f"an assessment from {item.source}")
        elif t == EvidenceType.COURSEWORK:
            types.append("coursework")
        else:
            types.append(f"{item.source} evidence")

    if not types:
        return "external sources"
    if len(types) == 1:
        return types[0]
    if len(types) == 2:
        return f"{types[0]} and {types[1]}"
    return f"{', '.join(types[:-1])}, and {types[-1]}"


def _build_explanation(
    skill_name: str,
    status: str,
    unique_artifacts: List[EvidenceItem],
    is_only_cert: bool,
    is_forked_only: bool,
) -> str:
    """
    Generates a deterministic, human-readable explanation of the evidence basis
    supporting a claimed skill.
    """
    if status == "insufficient_evidence" or not unique_artifacts:
        return (
            f"The skill is claimed in the resume, but no supporting evidence "
            f"was available in the analyzed sources."
        )

    if is_only_cert:
        return (
            f"{skill_name} is claimed in the resume and is supported by a certification, "
            f"but no practical implementation evidence was available."
        )

    if is_forked_only:
        fork_item = unique_artifacts[0]
        return (
            f"{skill_name} is claimed in the resume and is referenced in a forked GitHub "
            f"repository ({fork_item.title}), providing weak evidence without confirmed original authorship."
        )

    if len(unique_artifacts) > 1:
        sources_phrase = _format_source_types_phrase(unique_artifacts)
        return (
            f"{skill_name} is claimed in the resume and is supported by multiple "
            f"independent evidence sources including {sources_phrase}."
        )

    # Single unique evidence artifact
    item = unique_artifacts[0]
    t = item.evidence_type

    if t == EvidenceType.GITHUB_REPOSITORY:
        return f"{skill_name} is claimed in the resume and is supported by a public GitHub repository ({item.title})."
    elif t == EvidenceType.CODING_PLATFORM:
        return f"{skill_name} is claimed in the resume and is supported by coding platform activity on {item.source} ({item.title})."
    elif t == EvidenceType.PROJECT:
        return f"{skill_name} is claimed in the resume and is supported by project evidence ({item.title})."
    elif t == EvidenceType.ASSESSMENT:
        return f"{skill_name} is claimed in the resume and is supported by an assessment on {item.source}."
    elif t == EvidenceType.COURSEWORK:
        return f"{skill_name} is claimed in the resume and is supported by coursework, but lacks practical code repository evidence."
    else:
        return f"{skill_name} is claimed in the resume and is supported by {item.source} evidence ({item.title})."


def calculate_aggregated_confidence(
    unique_artifacts: List[EvidenceItem],
) -> Tuple[float, str, str, bool, bool]:
    """
    Computes deterministic aggregated confidence and strength using diminishing returns.
    
    Returns:
        (confidence, evidence_status, evidence_strength, is_only_cert, is_forked_only)
    """
    if not unique_artifacts:
        return (0.0, "insufficient_evidence", "none", False, False)

    # Check if certification is the ONLY source of evidence
    is_only_cert = all(
        item.evidence_type == EvidenceType.CERTIFICATION for item in unique_artifacts
    )

    # Check if only forked GitHub repository evidence
    is_forked_only = len(unique_artifacts) == 1 and bool(
        unique_artifacts[0].metadata.get("is_fork")
    )

    if is_only_cert:
        # Rule: A certification alone should not produce high practical-confidence
        # Cap confidence strictly at 0.60; status is partially_supported
        base_cert_conf = max(item.confidence for item in unique_artifacts)
        capped_conf = round(min(0.60, base_cert_conf), 2)
        strength = "moderate" if capped_conf >= 0.50 else "weak"
        return (capped_conf, "partially_supported", strength, True, False)

    if is_forked_only:
        # Rule: forked repository evidence should remain weak
        fork_item = unique_artifacts[0]
        capped_conf = round(min(0.50, fork_item.confidence), 2)
        return (capped_conf, "partially_supported", "weak", False, True)

    # Effective confidences of unique independent artifacts
    effective_confidences: List[float] = []
    for item in unique_artifacts:
        c = item.confidence
        # Ensure strength ranges are respected
        if item.evidence_strength == EvidenceStrength.STRONG:
            c = max(0.75, min(0.85, c))
        elif item.evidence_strength == EvidenceStrength.MODERATE:
            c = max(0.55, min(0.70, c))
        elif item.evidence_strength == EvidenceStrength.WEAK:
            c = max(0.40, min(0.50, c))
        effective_confidences.append(c)

    # Sort descending: best independent source is the anchor
    effective_confidences.sort(reverse=True)

    # 1 source
    current_confidence = effective_confidences[0]

    # Diminishing returns formula for multiple independent sources:
    # Each subsequent source captures 40% of its confidence value from remaining headroom
    for additional_c in effective_confidences[1:]:
        headroom = CONFIDENCE_MAX - current_confidence
        step_gain = headroom * (additional_c * 0.40)
        current_confidence += step_gain

    final_confidence = round(min(CONFIDENCE_MAX, current_confidence), 2)

    # Categorize status and strength
    if final_confidence >= 0.75:
        status = "strongly_supported"
        strength = "strong"
    elif final_confidence >= 0.50:
        status = "partially_supported"
        strength = "moderate"
    else:
        status = "partially_supported"
        strength = "weak"

    return (final_confidence, status, strength, False, False)


def aggregate_evidence_for_skills(
    claimed_skills: List[Any],
    evidence_items: List[Union[EvidenceItem, Dict[str, Any]]],
) -> EvidenceAggregationResponse:
    """
    Aggregates claimed resume skills with all provided evidence artifacts to produce
    explainable evidence-confidence results without claiming mastery.
    """
    # 1. Parse and validate EvidenceItem instances
    parsed_items: List[EvidenceItem] = []
    for raw in evidence_items:
        if isinstance(raw, EvidenceItem):
            parsed_items.append(raw)
        elif isinstance(raw, dict):
            parsed_items.append(EvidenceItem(**raw))

    # 2. Build skill registry from claimed_skills
    # Preserves every claimed skill even when evidence is completely missing
    skill_registry: Dict[str, Dict[str, Any]] = {}

    for claim in claimed_skills:
        if isinstance(claim, dict):
            raw_name = claim.get("name") or claim.get("skill_name") or ""
            raw_cat = claim.get("category") or ""
        else:
            raw_name = str(claim).strip()
            raw_cat = ""

        if not raw_name:
            continue

        canonical_name, fallback_cat = _resolve_canonical_skill(raw_name)
        category = raw_cat or fallback_cat
        key = canonical_name.lower()

        if key not in skill_registry:
            skill_registry[key] = {
                "skill_name": canonical_name,
                "category": category,
                "claimed_in_resume": True,
                "supporting_evidence": [],
            }

    # 3. Associate evidence items with skills via related_skills
    for item in parsed_items:
        for related_skill in item.related_skills:
            canonical_name, fallback_cat = _resolve_canonical_skill(related_skill)
            key = canonical_name.lower()

            if key not in skill_registry:
                # Skill demonstrated in evidence but not claimed on resume
                skill_registry[key] = {
                    "skill_name": canonical_name,
                    "category": fallback_cat,
                    "claimed_in_resume": False,
                    "supporting_evidence": [],
                }

            skill_registry[key]["supporting_evidence"].append(item)

    # 4. Process each skill deterministically
    results: List[AggregatedSkillResult] = []

    # Sort deterministically by category then skill name
    sorted_skills = sorted(
        skill_registry.values(),
        key=lambda s: (s["category"], s["skill_name"]),
    )

    for entry in sorted_skills:
        skill_name = entry["skill_name"]
        category = entry["category"]
        claimed = entry["claimed_in_resume"]
        all_evidence = entry["supporting_evidence"]

        # Deduplicate evidence artifacts to prevent identical sources from inflating confidence
        unique_artifacts_map: Dict[str, EvidenceItem] = {}
        for ev in all_evidence:
            art_key = _get_artifact_key(ev)
            if art_key not in unique_artifacts_map:
                unique_artifacts_map[art_key] = ev
            else:
                # Keep the higher confidence version of the duplicate artifact
                if ev.confidence > unique_artifacts_map[art_key].confidence:
                    unique_artifacts_map[art_key] = ev

        unique_artifacts = list(unique_artifacts_map.values())

        # Collect unique source platform names
        evidence_sources = sorted(list({ev.source for ev in all_evidence if ev.source}))

        # Calculate aggregated confidence and classification
        (
            confidence,
            status,
            strength,
            is_only_cert,
            is_forked_only,
        ) = calculate_aggregated_confidence(unique_artifacts)

        # Generate human-readable explanation
        explanation = _build_explanation(
            skill_name=skill_name,
            status=status,
            unique_artifacts=unique_artifacts,
            is_only_cert=is_only_cert,
            is_forked_only=is_forked_only,
        )

        result_item = AggregatedSkillResult(
            skill_name=skill_name,
            category=category,
            claimed_in_resume=claimed,
            evidence_status=status,
            evidence_strength=strength,
            confidence=confidence,
            evidence_count=len(all_evidence),
            evidence_sources=evidence_sources,
            supporting_evidence=all_evidence,
            explanation=explanation,
            is_certification_capped=is_only_cert,
        )
        results.append(result_item)

    evidence_explanations: List[EvidenceExplanation] = []
    for item in results:
        if getattr(item, "is_certification_capped", False):
            evidence_explanations.append(
                EvidenceExplanation(
                    skill=item.skill_name,
                    type=CERTIFICATION_CAP_TYPE,
                    title=CERTIFICATION_CAP_TITLE,
                    message=CERTIFICATION_CAP_MESSAGE,
                )
            )

    return EvidenceAggregationResponse(
        skills_analyzed=len(results),
        skills=results,
        evidence_explanations=evidence_explanations,
    )
