"""
Role Matching Models

Data models for comparing candidate aggregated skill confidence against target
job role requirements to compute explainable match contributions and gap analysis.
"""

from typing import Any, Dict, List, Optional

try:
    from pydantic import BaseModel, Field
    HAS_PYDANTIC = True
except ImportError:
    HAS_PYDANTIC = False


if HAS_PYDANTIC:

    class RoleSkillMatch(BaseModel):
        """Evaluation of an individual role-required skill against candidate evidence."""
        skill_name: str
        category: str
        required: bool = True
        importance: str = Field(
            ...,
            description="Role priority level: high, medium, or low",
            examples=["high", "medium", "low"],
        )
        importance_weight: float = Field(
            ...,
            description="Numeric importance weight: high=1.0, medium=0.6, low=0.3",
            examples=[1.0, 0.6, 0.3],
        )
        candidate_confidence: float = Field(
            ...,
            ge=0.0,
            le=0.95,
            description="Candidate evidence confidence score for this skill (0.0 to 0.95)",
        )
        candidate_evidence_status: str = Field(
            ...,
            description="Candidate status: strongly_supported, partially_supported, or insufficient_evidence",
        )
        candidate_evidence_strength: str = Field(
            ...,
            description="Candidate strength: strong, moderate, weak, or none",
        )
        match_status: str = Field(
            ...,
            description="Role match tier: strong_match, partial_match, or gap",
            examples=["strong_match", "partial_match", "gap"],
        )
        weighted_match_contribution: float = Field(
            ...,
            description="Contribution to eventual readiness: confidence * importance_weight",
        )
        explanation: str = Field(
            ...,
            description="Explainable narrative detailing why this skill matches or represents a gap",
        )

    class RoleMatchRequest(BaseModel):
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

    class RoleMatchResponse(BaseModel):
        """Structured comparison of candidate evidence against role requirements."""
        role: str
        matched_role: str
        skills_evaluated: int
        strong_matches: int
        partial_matches: int
        gaps: int
        skill_matches: List[RoleSkillMatch]
        unmatched_candidate_skills: List[str] = Field(
            default_factory=list,
            description="Candidate skills that are not part of this specific role's requirements",
        )

else:

    class RoleSkillMatch:
        def __init__(
            self,
            skill_name: str,
            category: str,
            required: bool = True,
            importance: str = "medium",
            importance_weight: float = 0.6,
            candidate_confidence: float = 0.0,
            candidate_evidence_status: str = "insufficient_evidence",
            candidate_evidence_strength: str = "none",
            match_status: str = "gap",
            weighted_match_contribution: float = 0.0,
            explanation: str = "",
            **kwargs,
        ):
            self.skill_name = skill_name
            self.category = category
            self.required = required
            self.importance = importance
            self.importance_weight = float(importance_weight)
            self.candidate_confidence = float(candidate_confidence)
            self.candidate_evidence_status = candidate_evidence_status
            self.candidate_evidence_strength = candidate_evidence_strength
            self.match_status = match_status
            self.weighted_match_contribution = float(weighted_match_contribution)
            self.explanation = explanation

        def model_dump(self) -> dict:
            return {
                "skill_name": self.skill_name,
                "category": self.category,
                "required": self.required,
                "importance": self.importance,
                "importance_weight": self.importance_weight,
                "candidate_confidence": self.candidate_confidence,
                "candidate_evidence_status": self.candidate_evidence_status,
                "candidate_evidence_strength": self.candidate_evidence_strength,
                "match_status": self.match_status,
                "weighted_match_contribution": self.weighted_match_contribution,
                "explanation": self.explanation,
            }

    class RoleMatchRequest:
        def __init__(self, role: str, candidate_skills: Optional[List[Any]] = None, **kwargs):
            self.role = role
            self.candidate_skills = list(candidate_skills) if candidate_skills is not None else []

    class RoleMatchResponse:
        def __init__(
            self,
            role: str,
            matched_role: str,
            skills_evaluated: int,
            strong_matches: int,
            partial_matches: int,
            gaps: int,
            skill_matches: List[RoleSkillMatch],
            unmatched_candidate_skills: Optional[List[str]] = None,
            **kwargs,
        ):
            self.role = role
            self.matched_role = matched_role
            self.skills_evaluated = skills_evaluated
            self.strong_matches = strong_matches
            self.partial_matches = partial_matches
            self.gaps = gaps
            self.skill_matches = list(skill_matches)
            self.unmatched_candidate_skills = (
                list(unmatched_candidate_skills) if unmatched_candidate_skills is not None else []
            )

        def model_dump(self) -> dict:
            return {
                "role": self.role,
                "matched_role": self.matched_role,
                "skills_evaluated": self.skills_evaluated,
                "strong_matches": self.strong_matches,
                "partial_matches": self.partial_matches,
                "gaps": self.gaps,
                "skill_matches": [
                    m.model_dump() if hasattr(m, "model_dump") else m
                    for m in self.skill_matches
                ],
                "unmatched_candidate_skills": self.unmatched_candidate_skills,
            }
