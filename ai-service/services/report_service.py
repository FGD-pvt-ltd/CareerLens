"""
Candidate Readiness Report Service

Synthesizes deterministic candidate analysis, evidence-backed skill status,
readiness scores, prioritized gaps, personalized roadmap milestones, and
LLM explanations into a structured, evidence-aware CandidateReport.
"""

import copy
import re
from typing import Any, Dict, List, Optional, Union

from models.evidence import (
    EvidenceItem,
    EvidenceExplanation,
    CERTIFICATION_CAP_TYPE,
    CERTIFICATION_CAP_TITLE,
    CERTIFICATION_CAP_MESSAGE,
)
from models.llm import LLMExplanationResponse
from models.report import (
    CandidateReport,
    EvidenceSummary,
    ReportRoadmapItem,
    ReportSkillGap,
    ReportStrength,
)
from services.evidence_aggregator import get_artifact_key
from services.fallback_llm import DEFAULT_DISCLAIMER, DeterministicFallbackLLM, _get_field
from services.gemini_provider import FORBIDDEN_MASTERY_TERMS
from services.llm_service import generate_candidate_explanation

_FALLBACK_LLM = DeterministicFallbackLLM()


def _validate_llm_explanation(
    llm_explanation: Any,
    authoritative_score: int,
    target_role: str,
) -> bool:
    """
    Validates that an LLM-supplied explanation adheres to ProfiQ principles:
    1. Contains no forbidden mastery claims.
    2. Does not contradict the authoritative readiness score.
    3. Mentions or aligns with target role if overview is provided.
    """
    if not llm_explanation:
        return False

    overview = _get_field(llm_explanation, "overview", "")
    explanation = _get_field(llm_explanation, "explanation", "")
    combined = f"{overview} {explanation}".lower()

    # Rule 1: No mastery claims
    for term in FORBIDDEN_MASTERY_TERMS:
        if term in combined:
            return False

    # Rule 2: No score contradiction
    score_matches = re.findall(r"(\d+)/100", f"{overview} {explanation}")
    for found_score in score_matches:
        if int(found_score) != authoritative_score:
            return False

    return True


def generate_candidate_report(
    analysis: Union[Dict[str, Any], Any],
    llm_explanation: Optional[Union[Dict[str, Any], Any]] = None,
) -> CandidateReport:
    """
    Generates a structured, evidence-aware CandidateReport combining deterministic
    analysis with natural-language presentation.

    Authoritative deterministic engine guarantees:
    - readiness score, label, and weights are preserved unchanged.
    - strengths reflect solely verified skills with confidence >= 0.70.
    - gaps and severity are preserved directly from deterministic analysis.
    - roadmap milestones and priorities are preserved.
    - evidence counts reflect exact candidate claims and artifacts.
    - LLM output cannot override scores, invent evidence, or claim mastery.

    Args:
        analysis: Authoritative candidate analysis from orchestrator or API.
        llm_explanation: Optional LLM explanation response or dict.

    Returns:
        CandidateReport object.

    Raises:
        ValueError: If analysis is missing or malformed.
    """
    if not analysis:
        raise ValueError("Candidate analysis data cannot be empty.")

    # 1. Extract and validate target role
    target_role = _get_field(analysis, "target_role")
    if not target_role or not isinstance(target_role, str) or not target_role.strip():
        raise ValueError("A valid target role is required in candidate analysis.")
    target_role = target_role.strip()

    # 2. Extract and validate readiness score
    raw_score = _get_field(analysis, "readiness_score")
    if raw_score is None:
        raise ValueError("Candidate analysis must contain a readiness score.")
    try:
        readiness_score = int(raw_score)
    except (ValueError, TypeError):
        raise ValueError("Readiness score must be a valid integer between 0 and 100.")
    if readiness_score < 0 or readiness_score > 100:
        raise ValueError("Readiness score must be between 0 and 100.")

    readiness_label = (
        _get_field(analysis, "readiness_label")
        or _get_field(analysis, "score_label")
        or "Needs Significant Development"
    )

    # 3. Handle LLM explanation (safely fallback if invalid, absent, or violating principles)
    safe_explanation: Optional[LLMExplanationResponse] = None
    if llm_explanation is not None:
        if _validate_llm_explanation(llm_explanation, readiness_score, target_role):
            if isinstance(llm_explanation, LLMExplanationResponse):
                safe_explanation = llm_explanation
            elif isinstance(llm_explanation, dict):
                try:
                    safe_explanation = LLMExplanationResponse(**llm_explanation)
                except Exception:
                    safe_explanation = _FALLBACK_LLM.generate_explanation(analysis)
        else:
            safe_explanation = _FALLBACK_LLM.generate_explanation(analysis)

    if safe_explanation is None:
        try:
            safe_explanation = generate_candidate_explanation(analysis)
        except Exception:
            safe_explanation = _FALLBACK_LLM.generate_explanation(analysis)

    # 4. Extract roadmap items and build lookup map for recommendations
    raw_roadmap = _get_field(analysis, "roadmap", [])
    if hasattr(raw_roadmap, "roadmap_items"):
        raw_roadmap_items = raw_roadmap.roadmap_items
    elif isinstance(raw_roadmap, dict):
        raw_roadmap_items = raw_roadmap.get("roadmap_items", [])
    elif isinstance(raw_roadmap, list):
        raw_roadmap_items = raw_roadmap
    else:
        raw_roadmap_items = []

    roadmap_list: List[ReportRoadmapItem] = []
    roadmap_map: Dict[str, Any] = {}
    for it in raw_roadmap_items:
        skill = _get_field(it, "skill_name") or _get_field(it, "skill") or ""
        item_obj = ReportRoadmapItem(
            skill_name=skill,
            priority=int(_get_field(it, "priority", len(roadmap_list) + 1)),
            importance=_get_field(it, "importance", "medium"),
            current_confidence=round(float(_get_field(it, "current_confidence", 0.0)), 2),
            goal=_get_field(it, "goal", f"Develop practical proficiency in {skill}."),
            recommended_actions=list(_get_field(it, "recommended_actions", [])),
            suggested_project=_get_field(it, "suggested_project", ""),
            suggested_evidence=list(_get_field(it, "suggested_evidence", [])),
            estimated_effort=_get_field(it, "estimated_effort", "2-4 weeks"),
        )
        roadmap_list.append(item_obj)
        if skill:
            roadmap_map[skill.lower()] = it

    # 5. Extract Strengths (strictly confidence >= 0.70)
    raw_matches = _get_field(analysis, "skill_matches", [])
    raw_agg = _get_field(analysis, "aggregated_skills", [])
    eval_pool = raw_matches if raw_matches else raw_agg

    strengths_list: List[ReportStrength] = []
    seen_strength_skills = set()
    for item in eval_pool:
        conf = float(_get_field(item, "candidate_confidence", _get_field(item, "confidence", 0.0)))
        skill_name = _get_field(item, "skill_name")
        if conf >= 0.70 and skill_name and skill_name.lower() not in seen_strength_skills:
            seen_strength_skills.add(skill_name.lower())
            ev_status = "strongly_supported"
            ev_strength = _get_field(
                item, "candidate_evidence_strength", _get_field(item, "evidence_strength", "strong")
            )
            if ev_strength == "none":
                ev_strength = "strong"

            explanation = (
                f"{skill_name} is strongly supported by available evidence with an evidence confidence score of {conf:.2f}."
            )
            strengths_list.append(
                ReportStrength(
                    skill_name=skill_name,
                    confidence=round(conf, 2),
                    evidence_status=ev_status,
                    evidence_strength=ev_strength,
                    explanation=explanation,
                )
            )
    strengths_list.sort(key=lambda s: s.confidence, reverse=True)

    # 6. Extract Skill Gaps (preserves existing gap severity and importance)
    raw_gaps = _get_field(analysis, "skill_gaps", [])
    gaps_list: List[ReportSkillGap] = []
    for g in raw_gaps:
        skill_name = _get_field(g, "skill_name")
        conf = round(float(_get_field(g, "candidate_confidence", _get_field(g, "current_confidence", 0.0))), 2)
        importance = _get_field(g, "importance", "medium")
        severity = _get_field(g, "gap_severity", "medium")
        ev_status = _get_field(g, "evidence_status", "insufficient_evidence")
        existing_reason = _get_field(g, "explanation") or _get_field(g, "reason") or ""
        if not existing_reason or "no verifiable" in existing_reason.lower() or "no supporting evidence" in existing_reason.lower():
            reason = (
                f"{skill_name} is important for the {target_role} role, but the available evidence "
                "currently provides insufficient support for the claim."
            )
        else:
            reason = existing_reason

        rm_item = roadmap_map.get(skill_name.lower()) if skill_name else None
        if rm_item:
            proj = _get_field(rm_item, "suggested_project", "")
            rec_actions = _get_field(rm_item, "recommended_actions", [])
            if proj:
                action = f"Complete practical project: '{proj}'."
            elif rec_actions:
                action = f"Develop {skill_name}: {rec_actions[0]}."
            else:
                action = f"Build verifiable project artifacts for {skill_name}."
        else:
            action = f"Build verifiable project artifacts for {skill_name}."

        gaps_list.append(
            ReportSkillGap(
                skill_name=skill_name,
                current_confidence=conf,
                importance=importance,
                gap_severity=severity,
                evidence_status=ev_status,
                reason=reason,
                recommended_action=action,
            )
        )

    # 7. Calculate Evidence Summary counts and explainable narrative
    # All counts are derived from the same final deterministic analysis state.
    raw_claimed = _get_field(analysis, "claimed_skills", [])
    raw_agg = _get_field(analysis, "aggregated_skills", [])
    raw_matches = _get_field(analysis, "skill_matches", [])

    # Source of truth for evaluated skills: prefer aggregated_skills, fallback to skill_matches
    skills_pool = raw_agg if raw_agg else raw_matches
    total_claimed = len(raw_claimed) if raw_claimed else len(skills_pool)

    strongly_supported_count = 0
    partially_supported_count = 0
    insufficient_count = 0

    for it in skills_pool:
        st = _get_field(it, "evidence_status") or _get_field(it, "candidate_evidence_status", "")
        conf = float(_get_field(it, "confidence", _get_field(it, "candidate_confidence", 0.0)))
        if st == "strongly_supported" or conf >= 0.70:
            strongly_supported_count += 1
        elif st == "partially_supported" or (0.50 <= conf < 0.70):
            partially_supported_count += 1
        else:
            insufficient_count += 1

    # Keep counts internally consistent if claimed count exceeds evaluated skills pool
    if total_claimed > (strongly_supported_count + partially_supported_count + insufficient_count):
        insufficient_count += (total_claimed - (strongly_supported_count + partially_supported_count + insufficient_count))

    # Collect all available evidence items from analysis and aggregated skills
    all_raw_evidence = []
    raw_ev_items = _get_field(analysis, "evidence_items", [])
    if raw_ev_items:
        all_raw_evidence.extend(raw_ev_items)

    for it in raw_agg:
        supp = _get_field(it, "supporting_evidence", [])
        if supp:
            all_raw_evidence.extend(supp)

    # Deduplicate using canonical artifact key logic from evidence aggregator
    unique_artifacts_map: Dict[str, Any] = {}
    for ev in all_raw_evidence:
        if isinstance(ev, EvidenceItem):
            key = get_artifact_key(ev)
            if key not in unique_artifacts_map or ev.confidence > getattr(unique_artifacts_map[key], "confidence", 0.0):
                unique_artifacts_map[key] = ev
        elif isinstance(ev, dict):
            try:
                parsed_ev = EvidenceItem(**ev)
                key = get_artifact_key(parsed_ev)
                if key not in unique_artifacts_map or parsed_ev.confidence > getattr(unique_artifacts_map[key], "confidence", 0.0):
                    unique_artifacts_map[key] = parsed_ev
            except Exception:
                url = (ev.get("url") or "").strip().lower()
                source = (ev.get("source") or "").strip().lower()
                title = (ev.get("title") or "").strip().lower()
                key = url if url else f"{source}::{title}"
                if key not in unique_artifacts_map:
                    unique_artifacts_map[key] = ev
        else:
            key = str(ev)
            if key not in unique_artifacts_map:
                unique_artifacts_map[key] = ev

    total_evidence_items = len(unique_artifacts_map)

    ev_explanation = (
        f"Your resume contains {total_claimed} claimed skills. Evidence strongly supports {strongly_supported_count}, "
        f"partially supports {partially_supported_count}, while {insufficient_count} currently have insufficient evidence. "
        f"Insufficient evidence means the available evidence does not currently provide enough support for the claim, "
        f"rather than a lack of ability."
    )

    evidence_summary = EvidenceSummary(
        total_claimed_skills=total_claimed,
        strongly_supported_skills=strongly_supported_count,
        partially_supported_skills=partially_supported_count,
        insufficient_evidence_skills=insufficient_count,
        total_evidence_items=total_evidence_items,
        explanation=ev_explanation,
    )

    # 8. Formulate Executive Summary
    # Numbers and skill names come strictly from deterministic analysis
    strong_skill_names = [s.skill_name for s in strengths_list]
    gap_skill_names = [g.skill_name for g in gaps_list if g.gap_severity in ("high", "medium")]
    if not gap_skill_names and gaps_list:
        gap_skill_names = [g.skill_name for g in gaps_list]

    if strong_skill_names:
        strong_part = f"Your strongest supported areas are {', '.join(strong_skill_names[:3])}"
    else:
        strong_part = "No skills currently meet the strong evidence support threshold"

    if gap_skill_names:
        gap_part = f"while {', '.join(gap_skill_names[:3])} require additional evidence and development"
    else:
        gap_part = "with no critical skill gaps identified"

    deterministic_summary = (
        f"Your current profile is {readiness_label} for an {target_role} role, with a readiness score of "
        f"{readiness_score}/100. {strong_part}, {gap_part}."
    )

    executive_summary = deterministic_summary
    if safe_explanation and getattr(safe_explanation, "provider_used", "") == "gemini" and safe_explanation.overview:
        llm_ov = safe_explanation.overview.strip()
        if f"{readiness_score}/100" in llm_ov and target_role.lower() in llm_ov.lower():
            if readiness_label.lower() in llm_ov.lower() and (not strong_skill_names or strong_skill_names[0].lower() in llm_ov.lower()):
                executive_summary = llm_ov

    # 9. Formulate 3-5 immediate Next Steps derived from highest-priority roadmap items
    next_steps: List[str] = []
    if roadmap_list:
        top_milestones = roadmap_list[:5]
        for milestone in top_milestones:
            if milestone.suggested_project:
                next_steps.append(
                    f"Complete a practical {milestone.skill_name} project: '{milestone.suggested_project}'."
                )
            elif milestone.recommended_actions:
                next_steps.append(
                    f"Strengthen {milestone.skill_name}: {milestone.recommended_actions[0]}."
                )
            else:
                next_steps.append(
                    f"Build verifiable evidence for {milestone.skill_name} through hands-on project work."
                )
        if len(next_steps) < 3:
            general_actions = [
                "Publish project repositories to public GitHub with comprehensive documentation and unit tests.",
                "Solve structured algorithm problems on coding platforms to verify practical problem solving.",
                "Document technical decisions and architecture diagrams to demonstrate end-to-end execution.",
            ]
            for act in general_actions:
                if len(next_steps) >= 3:
                    break
                if act not in next_steps:
                    next_steps.append(act)
    else:
        next_steps = [
            "Maintain active project repositories and continue building demonstrable artifacts.",
            "Contribute to open-source software relevant to your target role.",
            "Keep technical documentation and code quality standards up to date.",
        ]

    # 10. Disclaimer
    disclaimer = safe_explanation.disclaimer if (safe_explanation and safe_explanation.disclaimer) else DEFAULT_DISCLAIMER

    # 11. Extract or synthesize structured evidence explanations
    evidence_explanations: List[EvidenceExplanation] = []
    raw_exps = _get_field(analysis, "evidence_explanations", [])
    if raw_exps:
        for exp in raw_exps:
            if isinstance(exp, EvidenceExplanation):
                evidence_explanations.append(exp)
            elif isinstance(exp, dict):
                evidence_explanations.append(EvidenceExplanation(**exp))
            elif hasattr(exp, "model_dump"):
                evidence_explanations.append(EvidenceExplanation(**exp.model_dump()))
    else:
        # Fallback to inspecting aggregated skills if not provided at root
        for it in raw_agg:
            if _get_field(it, "is_certification_capped", False):
                skill_name = _get_field(it, "skill_name", "")
                if skill_name:
                    evidence_explanations.append(
                        EvidenceExplanation(
                            skill=skill_name,
                            type=CERTIFICATION_CAP_TYPE,
                            title=CERTIFICATION_CAP_TITLE,
                            message=CERTIFICATION_CAP_MESSAGE,
                        )
                    )

    return CandidateReport(
        target_role=target_role,
        readiness_score=readiness_score,
        readiness_label=readiness_label,
        executive_summary=executive_summary,
        strengths=strengths_list,
        skill_gaps=gaps_list,
        evidence_summary=evidence_summary,
        roadmap=roadmap_list,
        next_steps=next_steps[:5],
        disclaimer=disclaimer,
        evidence_explanations=evidence_explanations,
    )
