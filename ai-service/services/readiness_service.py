"""
Job Readiness Scoring Service

Calculates deterministic, explainable readiness scores for candidates against
target role requirements by aggregating skill match contributions and prioritizing
actionable skill gaps.
"""

from typing import Any, Dict, List, Union
from models.readiness import ReadinessAnalysisResponse
from services.gap_service import identify_and_prioritize_gaps
from services.role_matcher import match_candidate_to_role


def calculate_readiness_score(weighted_score: float, maximum_possible_score: float) -> int:
    """
    Computes overall readiness score using role-required skills:
    readiness_score = (sum of weighted match contributions / sum of importance weights) * 100
    
    Rounds to the nearest whole integer.
    Strictly bounded between 0 and 100.
    """
    if maximum_possible_score <= 0.0:
        return 0
    raw_score = (float(weighted_score) / float(maximum_possible_score)) * 100.0
    return min(100, max(0, int(round(raw_score))))


def get_readiness_score_label(score: int) -> str:
    """
    Deterministically maps readiness score to descriptive tiers:
    - 0–39: "Needs Significant Development"
    - 40–59: "Developing"
    - 60–74: "Moderately Ready"
    - 75–89: "Strongly Ready"
    - 90–100: "Highly Ready"
    """
    if score < 40:
        return "Needs Significant Development"
    elif score < 60:
        return "Developing"
    elif score < 75:
        return "Moderately Ready"
    elif score < 90:
        return "Strongly Ready"
    else:
        return "Highly Ready"


def generate_readiness_explanation(score: int, matched_role: str) -> str:
    """
    Generates a concise, evidence-grounded explanation for the readiness score.
    Emphasizes evidence backing without making speculative employment predictions.
    """
    return (
        f"Your current evidence supports a readiness score of {score}/100 for {matched_role}. "
        "Your readiness score is based on how strongly the available evidence supports the skills "
        "required for the selected role. High-priority skills contribute more to the score."
    )


def analyze_job_readiness(
    role_input: str,
    candidate_skills: List[Union[Dict[str, Any], Any]],
) -> ReadinessAnalysisResponse:
    """
    Evaluates candidate skills against a target role, computes the overall readiness score,
    determines the score tier, and identifies prioritized skill gaps.
    
    Args:
        role_input: Target job role title or alias (e.g. 'AI Engineer', 'SDE')
        candidate_skills: List of candidate skill dictionaries or AggregatedSkillResult objects
        
    Returns:
        ReadinessAnalysisResponse with score, breakdown counts, and prioritized skill gaps.
        
    Raises:
        ValueError: If role_input is invalid or not recognized in the supported taxonomy.
    """
    # 1. Match candidate skills against target role requirements
    role_match = match_candidate_to_role(
        role_input=role_input,
        candidate_skills=candidate_skills,
    )

    # 2. Compute weighted score and maximum possible score
    weighted_score = round(
        sum(m.weighted_match_contribution for m in role_match.skill_matches),
        2,
    )
    maximum_possible_score = round(
        sum(m.importance_weight for m in role_match.skill_matches),
        2,
    )

    # 3. Calculate bounded integer readiness score
    readiness_score = calculate_readiness_score(
        weighted_score=weighted_score,
        maximum_possible_score=maximum_possible_score,
    )

    # 4. Resolve score label and explanation
    score_label = get_readiness_score_label(readiness_score)
    explanation = generate_readiness_explanation(
        score=readiness_score,
        matched_role=role_match.matched_role,
    )

    # 5. Identify and prioritize skill gaps (< 0.70 confidence)
    skill_gaps = identify_and_prioritize_gaps(role_match.skill_matches)

    return ReadinessAnalysisResponse(
        role=role_match.role,
        matched_role=role_match.matched_role,
        readiness_score=readiness_score,
        score_label=score_label,
        total_required_skills=role_match.skills_evaluated,
        strong_matches=role_match.strong_matches,
        partial_matches=role_match.partial_matches,
        gaps=role_match.gaps,
        weighted_score=weighted_score,
        maximum_possible_score=maximum_possible_score,
        skill_gaps=skill_gaps,
        explanation=explanation,
    )
