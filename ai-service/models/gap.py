"""
Skill Gap Models

Defines data models representing skills requiring development for a target job role,
including importance, gap severity, evidence status, and constructive explanations.
"""

from typing import Any, Dict, Optional

try:
    from pydantic import BaseModel, Field
    HAS_PYDANTIC = True
except ImportError:
    HAS_PYDANTIC = False


if HAS_PYDANTIC:

    class SkillGap(BaseModel):
        """A role requirement where candidate evidence confidence is below strong match threshold (< 0.70)."""
        skill_name: str
        category: str
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
            description="Candidate evidence confidence score (0.0 to 0.69)",
        )
        match_status: str = Field(
            ...,
            description="Role match tier: gap (< 0.50) or partial_match (0.50 to 0.69)",
            examples=["gap", "partial_match"],
        )
        gap_severity: str = Field(
            ...,
            description="Severity of the skill gap: high, medium, or low",
            examples=["high", "medium", "low"],
        )
        evidence_status: str = Field(
            ...,
            description="Candidate evidence status: insufficient_evidence, partially_supported, etc.",
        )
        explanation: str = Field(
            ...,
            description="Constructive, evidence-based narrative explaining why this requirement is a gap",
        )

else:

    class SkillGap:
        def __init__(
            self,
            skill_name: str,
            category: str,
            importance: str = "medium",
            importance_weight: float = 0.6,
            candidate_confidence: float = 0.0,
            match_status: str = "gap",
            gap_severity: str = "high",
            evidence_status: str = "insufficient_evidence",
            explanation: str = "",
            **kwargs,
        ):
            self.skill_name = skill_name
            self.category = category
            self.importance = importance
            self.importance_weight = float(importance_weight)
            self.candidate_confidence = float(candidate_confidence)
            self.match_status = match_status
            self.gap_severity = gap_severity
            self.evidence_status = evidence_status
            self.explanation = explanation

        def model_dump(self) -> dict:
            return {
                "skill_name": self.skill_name,
                "category": self.category,
                "importance": self.importance,
                "importance_weight": self.importance_weight,
                "candidate_confidence": self.candidate_confidence,
                "match_status": self.match_status,
                "gap_severity": self.gap_severity,
                "evidence_status": self.evidence_status,
                "explanation": self.explanation,
            }
