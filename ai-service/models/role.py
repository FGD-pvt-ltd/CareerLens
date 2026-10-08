"""
Role Requirements Models

Data models for representing role requirement requests, responses,
and canonical skill requirement items with importance tiers.
"""

from typing import List, Optional

try:
    from pydantic import BaseModel, Field
    HAS_PYDANTIC = True
except ImportError:
    HAS_PYDANTIC = False


if HAS_PYDANTIC:

    class SkillRequirementItem(BaseModel):
        """Individual skill requirement for a target role."""
        skill_name: str
        category: str
        importance: str = Field(
            ...,
            description="Controlled importance level: high, medium, or low",
            examples=["high", "medium", "low"],
        )
        importance_weight: float = Field(
            ...,
            description="Numeric importance weight: high=1.0, medium=0.6, low=0.3",
            examples=[1.0, 0.6, 0.3],
        )
        description: str = Field(
            ...,
            description="Explanation of why this skill is needed for the role",
        )

    class RoleRequirementsRequest(BaseModel):
        """Request payload containing the target job role name or alias."""
        role: str = Field(
            ...,
            description="Target job role title or alias (e.g. 'AI Engineer', 'SDE', 'Data Scientist')",
            examples=["AI Engineer", "Software Developer", "Data Analyst"],
            min_length=1,
        )

    class RoleRequirementsResponse(BaseModel):
        """Deterministic response detailing the expected skills for a matched role."""
        role: str
        matched_role: str
        total_required_skills: int
        high_priority_skills: int
        medium_priority_skills: int
        low_priority_skills: int
        skills_required: List[SkillRequirementItem]

else:

    class SkillRequirementItem:
        def __init__(
            self,
            skill_name: str,
            category: str,
            importance: str,
            importance_weight: float,
            description: str,
            **kwargs,
        ):
            self.skill_name = skill_name
            self.category = category
            self.importance = importance
            self.importance_weight = float(importance_weight)
            self.description = description

        def model_dump(self) -> dict:
            return {
                "skill_name": self.skill_name,
                "category": self.category,
                "importance": self.importance,
                "importance_weight": self.importance_weight,
                "description": self.description,
            }

    class RoleRequirementsRequest:
        def __init__(self, role: str, **kwargs):
            self.role = role

    class RoleRequirementsResponse:
        def __init__(
            self,
            role: str,
            matched_role: str,
            total_required_skills: int,
            high_priority_skills: int,
            medium_priority_skills: int,
            low_priority_skills: int,
            skills_required: List[SkillRequirementItem],
            **kwargs,
        ):
            self.role = role
            self.matched_role = matched_role
            self.total_required_skills = total_required_skills
            self.high_priority_skills = high_priority_skills
            self.medium_priority_skills = medium_priority_skills
            self.low_priority_skills = low_priority_skills
            self.skills_required = list(skills_required)

        def model_dump(self) -> dict:
            return {
                "role": self.role,
                "matched_role": self.matched_role,
                "total_required_skills": self.total_required_skills,
                "high_priority_skills": self.high_priority_skills,
                "medium_priority_skills": self.medium_priority_skills,
                "low_priority_skills": self.low_priority_skills,
                "skills_required": [
                    s.model_dump() if hasattr(s, "model_dump") else s
                    for s in self.skills_required
                ],
            }
