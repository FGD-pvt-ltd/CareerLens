"""
Evidence Aggregation Models

Defines models for aggregating candidate resume skill claims with multi-source evidence
to compute deterministic, explainable confidence ratings without claiming mastery.
"""

from typing import Any, Dict, List, Optional
from models.evidence import EvidenceItem, EvidenceExplanation

try:
    from pydantic import BaseModel, Field
    HAS_PYDANTIC = True
except ImportError:
    HAS_PYDANTIC = False


if HAS_PYDANTIC:

    class AggregatedSkillResult(BaseModel):
        """Aggregated evidence evaluation for an individual skill."""
        skill_name: str
        category: str
        claimed_in_resume: bool = True
        evidence_status: str = Field(
            ...,
            description="Status: strongly_supported, partially_supported, or insufficient_evidence",
        )
        evidence_strength: str = Field(
            ...,
            description="Overall strength: none, weak, moderate, or strong",
        )
        confidence: float = Field(
            ...,
            ge=0.0,
            le=0.95,
            description="Aggregated evidence confidence between 0.0 and 0.95 (never 1.0)",
        )
        evidence_count: int
        evidence_sources: List[str] = Field(
            default_factory=list,
            description="List of distinct evidence platforms (e.g. ['GitHub', 'LeetCode'])",
        )
        supporting_evidence: List[EvidenceItem] = Field(
            default_factory=list,
            description="Collection of EvidenceItem artifacts supporting this skill",
        )
        explanation: str = Field(
            ...,
            description="Human-readable explanation of the evidence basis",
        )
        is_certification_capped: bool = Field(
            default=False,
            description="Whether this skill's confidence was capped at 0.60 due to certification-only evidence",
        )

    class EvidenceAggregationRequest(BaseModel):
        """Request payload for aggregating claimed skills with evidence artifacts."""
        claimed_skills: List[Any] = Field(
            ...,
            description="List of skill names or skill dicts extracted from the resume",
        )
        evidence_items: List[EvidenceItem] = Field(
            default_factory=list,
            description="Collection of EvidenceItem artifacts to correlate",
        )

    class EvidenceAggregationResponse(BaseModel):
        """Response envelope containing the deterministic aggregation results."""
        skills_analyzed: int
        skills: List[AggregatedSkillResult]
        evidence_explanations: List[EvidenceExplanation] = Field(
            default_factory=list,
            description="Structured explanations regarding evidence caps and policies",
        )

        @property
        def aggregated_skills(self) -> List[AggregatedSkillResult]:
            return self.skills

else:

    class AggregatedSkillResult:
        def __init__(
            self,
            skill_name: str,
            category: str,
            claimed_in_resume: bool,
            evidence_status: str,
            evidence_strength: str,
            confidence: float,
            evidence_count: int,
            evidence_sources: Optional[List[str]] = None,
            supporting_evidence: Optional[List[EvidenceItem]] = None,
            explanation: str = "",
            is_certification_capped: bool = False,
            **kwargs,
        ):
            self.skill_name = skill_name
            self.category = category
            self.claimed_in_resume = claimed_in_resume
            self.evidence_status = evidence_status
            self.evidence_strength = evidence_strength
            self.confidence = float(confidence)
            self.evidence_count = evidence_count
            self.evidence_sources = list(evidence_sources) if evidence_sources is not None else []
            self.supporting_evidence = list(supporting_evidence) if supporting_evidence is not None else []
            self.explanation = explanation
            self.is_certification_capped = bool(is_certification_capped)

        def model_dump(self) -> dict:
            return {
                "skill_name": self.skill_name,
                "category": self.category,
                "claimed_in_resume": self.claimed_in_resume,
                "evidence_status": self.evidence_status,
                "evidence_strength": self.evidence_strength,
                "confidence": self.confidence,
                "evidence_count": self.evidence_count,
                "evidence_sources": self.evidence_sources,
                "supporting_evidence": [
                    e.model_dump() if hasattr(e, "model_dump") else e
                    for e in self.supporting_evidence
                ],
                "explanation": self.explanation,
                "is_certification_capped": self.is_certification_capped,
            }

    class EvidenceAggregationRequest:
        def __init__(
            self,
            claimed_skills: Optional[List[Any]] = None,
            evidence_items: Optional[List[EvidenceItem]] = None,
            **kwargs,
        ):
            self.claimed_skills = list(claimed_skills) if claimed_skills is not None else []
            self.evidence_items = list(evidence_items) if evidence_items is not None else []

    class EvidenceAggregationResponse:
        def __init__(
            self,
            skills_analyzed: int,
            skills: List[AggregatedSkillResult],
            evidence_explanations: Optional[List[Any]] = None,
            **kwargs,
        ):
            self.skills_analyzed = skills_analyzed
            self.skills = list(skills)
            self.evidence_explanations = list(evidence_explanations) if evidence_explanations is not None else []

        @property
        def aggregated_skills(self) -> List[AggregatedSkillResult]:
            return self.skills

        def model_dump(self) -> dict:
            return {
                "skills_analyzed": self.skills_analyzed,
                "skills": [
                    s.model_dump() if hasattr(s, "model_dump") else s
                    for s in self.skills
                ],
                "evidence_explanations": [
                    e.model_dump() if hasattr(e, "model_dump") else e
                    for e in self.evidence_explanations
                ],
            }
