"""
Job Readiness Models

Data models for calculating and reporting overall evidence-based job readiness scores
and prioritized skill gap breakdowns against target role requirements.
"""

from typing import Any, Dict, List, Optional
from models.gap import SkillGap

try:
    from pydantic import BaseModel, Field
    HAS_PYDANTIC = True
except ImportError:
    HAS_PYDANTIC = False


if HAS_PYDANTIC:

    class ReadinessAnalysisRequest(BaseModel):
        """Request payload containing target role and candidate aggregated skills."""
        role: str = Field(
            ...,
            description="Target job role title or alias (e.g. 'AI Engineer', 'SDE', 'Data Scientist')",
            examples=["AI Engineer", "Software Developer"],
            min_length=1,
        )
        candidate_skills: List[Any] = Field(
            default_factory=list,
            description="List of aggregated skill objects or dictionaries for the candidate",
        )

    class ReadinessAnalysisResponse(BaseModel):
        """Structured evaluation of overall candidate readiness and prioritized skill gaps."""
        role: str
        matched_role: str
        readiness_score: int = Field(
            ...,
            ge=0,
            le=100,
            description="Overall evidence-based readiness score from 0 to 100",
        )
        score_label: str = Field(
            ...,
            description="Descriptive tier for the readiness score",
            examples=[
                "Needs Significant Development",
                "Developing",
                "Moderately Ready",
                "Strongly Ready",
                "Highly Ready",
            ],
        )
        total_required_skills: int
        strong_matches: int
        partial_matches: int
        gaps: int
        weighted_score: float = Field(
            ...,
            description="Sum of weighted match contributions across role-required skills",
        )
        maximum_possible_score: float = Field(
            ...,
            description="Sum of importance weights across all required role skills",
        )
        skill_gaps: List[SkillGap] = Field(
            default_factory=list,
            description="Prioritized list of role skill requirements needing development (< 0.70 confidence)",
        )
        explanation: str = Field(
            ...,
            description="Constructive, evidence-based narrative explaining the readiness score",
        )

else:

    class ReadinessAnalysisRequest:
        def __init__(self, role: str, candidate_skills: Optional[List[Any]] = None, **kwargs):
            self.role = role
            self.candidate_skills = list(candidate_skills) if candidate_skills is not None else []

    class ReadinessAnalysisResponse:
        def __init__(
            self,
            role: str,
            matched_role: str,
            readiness_score: int,
            score_label: str,
            total_required_skills: int,
            strong_matches: int,
            partial_matches: int,
            gaps: int,
            weighted_score: float,
            maximum_possible_score: float,
            skill_gaps: List[SkillGap],
            explanation: str,
            **kwargs,
        ):
            self.role = role
            self.matched_role = matched_role
            self.readiness_score = int(readiness_score)
            self.score_label = score_label
            self.total_required_skills = int(total_required_skills)
            self.strong_matches = int(strong_matches)
            self.partial_matches = int(partial_matches)
            self.gaps = int(gaps)
            self.weighted_score = float(weighted_score)
            self.maximum_possible_score = float(maximum_possible_score)
            self.skill_gaps = list(skill_gaps)
            self.explanation = explanation

        def model_dump(self) -> dict:
            return {
                "role": self.role,
                "matched_role": self.matched_role,
                "readiness_score": self.readiness_score,
                "score_label": self.score_label,
                "total_required_skills": self.total_required_skills,
                "strong_matches": self.strong_matches,
                "partial_matches": self.partial_matches,
                "gaps": self.gaps,
                "weighted_score": self.weighted_score,
                "maximum_possible_score": self.maximum_possible_score,
                "skill_gaps": [
                    g.model_dump() if hasattr(g, "model_dump") else g
                    for g in self.skill_gaps
                ],
                "explanation": self.explanation,
            }
