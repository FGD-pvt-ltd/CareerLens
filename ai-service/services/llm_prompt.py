"""
LLM Prompt Construction Service

Builds grounded, structured prompts instructing LLM providers to explain deterministic
candidate analysis without altering scores, inventing evidence, or making mastery claims.
"""

import json
from typing import Any, Dict, Optional, Union

from services.fallback_llm import _get_field


def build_explanation_prompt(
    analysis: Union[Dict[str, Any], Any],
    candidate_context: Optional[str] = None,
    tone: Optional[str] = None,
) -> str:
    """
    Constructs a grounded, instruction-guided prompt that supplies structured analysis
    and enforces strict evidence-grounded constraints for natural-language generation.
    """
    target_role = _get_field(analysis, "target_role") or "Target Role"
    readiness_score = int(_get_field(analysis, "readiness_score", 0))
    readiness_label = _get_field(analysis, "readiness_label") or _get_field(analysis, "score_label") or "Needs Significant Development"

    # Extract skill matches summary
    raw_matches = _get_field(analysis, "skill_matches", [])
    matches_summary = []
    for m in raw_matches:
        matches_summary.append({
            "skill_name": _get_field(m, "skill_name"),
            "importance": _get_field(m, "importance"),
            "candidate_confidence": _get_field(m, "candidate_confidence"),
            "match_status": _get_field(m, "match_status"),
            "evidence_status": _get_field(m, "candidate_evidence_status"),
        })

    # Extract skill gaps summary
    raw_gaps = _get_field(analysis, "skill_gaps", [])
    gaps_summary = []
    for g in raw_gaps:
        gaps_summary.append({
            "skill_name": _get_field(g, "skill_name"),
            "importance": _get_field(g, "importance"),
            "gap_severity": _get_field(g, "gap_severity"),
            "candidate_confidence": _get_field(g, "candidate_confidence"),
            "match_status": _get_field(g, "match_status"),
        })

    # Extract roadmap summary
    raw_roadmap = _get_field(analysis, "roadmap", [])
    if isinstance(raw_roadmap, list):
        roadmap_items = raw_roadmap
    elif hasattr(raw_roadmap, "roadmap_items"):
        roadmap_items = raw_roadmap.roadmap_items
    elif isinstance(raw_roadmap, dict):
        roadmap_items = raw_roadmap.get("roadmap_items", [])
    else:
        roadmap_items = []

    roadmap_summary = []
    for it in roadmap_items:
        roadmap_summary.append({
            "skill_name": _get_field(it, "skill_name"),
            "goal": _get_field(it, "goal"),
            "suggested_project": _get_field(it, "suggested_project"),
            "estimated_effort": _get_field(it, "estimated_effort"),
            "recommended_actions": _get_field(it, "recommended_actions", []),
        })

    structured_data = {
        "target_role": target_role,
        "readiness_score": readiness_score,
        "readiness_label": readiness_label,
        "skill_matches": matches_summary,
        "skill_gaps": gaps_summary,
        "roadmap_milestones": roadmap_summary,
    }

    selected_tone = tone or "constructive"
    context_str = f"\nCandidate Background Context: {candidate_context}" if candidate_context else ""

    prompt = f"""You are the explanation layer of ProfiQ, an AI-powered employability and career-readiness analyzer.

CORE PRINCIPLES & BOUNDARIES:
1. The supplied deterministic analysis is authoritative.
2. Do not change numerical values. The readiness score is {readiness_score}/100 and must remain unchanged.
3. Do not invent skills.
4. Do not invent evidence, repositories, or artifacts.
5. Do not invent projects.
6. Do not claim mastery (never use words such as 'mastered', 'expert', 'guaranteed', 'proven', or 'definitely knows').
7. Do not guarantee employment or predict hiring chances.
8. Clearly distinguish between claimed skills, verifiable evidence, and current readiness. Missing evidence represents an absence of verifiable artifacts rather than a lack of ability.
9. Explain the provided analysis clearly and constructively in a {selected_tone} tone.{context_str}

SUPPLIED DETERMINISTIC ANALYSIS (AUTHORITATIVE):
{json.dumps(structured_data, indent=2)}

OUTPUT INSTRUCTIONS:
Return a valid JSON object matching the following schema exactly:
{{
  "overview": "A clear 1-2 sentence high-level overview stating the readiness score of {readiness_score}/100 and current {readiness_label} tier for {target_role}.",
  "strengths": ["List of skills that are strongly supported or supported by available evidence"],
  "priority_gaps": ["List of priority skill requirements that currently have insufficient or partial evidence"],
  "recommendations": ["List of actionable next steps drawn from the roadmap milestones and suggested projects"],
  "explanation": "A structured, detailed narrative synthesizing the candidate's standing and concrete development path.",
  "disclaimer": "ProfiQ evaluates evidence-based employability readiness from observable artifacts and resume claims. It does not provide hiring guarantees or assess unobservable capabilities. Missing evidence represents an absence of verifiable artifacts rather than a lack of ability."
}}
"""
    return prompt.strip()
