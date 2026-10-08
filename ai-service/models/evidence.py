"""
Evidence Data Model

Defines structured models for candidate skill evidence items, evidence types,
controlled strength tiers, confidence ratings, and skill-to-evidence mappings.

Supports Pydantic when installed (FastAPI runtime) and falls back cleanly
to standard Python classes for zero-dependency test execution.
"""

from enum import Enum
from typing import Any, Dict, List, Optional

try:
    from pydantic import BaseModel, Field
    HAS_PYDANTIC = True
except ImportError:
    HAS_PYDANTIC = False


class EvidenceType(str, Enum):
    PROJECT = "project"
    GITHUB_REPOSITORY = "github_repository"
    CODING_PLATFORM = "coding_platform"
    CERTIFICATION = "certification"
    ASSESSMENT = "assessment"
    COURSEWORK = "coursework"
    OTHER = "other"


class EvidenceStrength(str, Enum):
    WEAK = "weak"
    MODERATE = "moderate"
    STRONG = "strong"


class VerificationStatus(str, Enum):
    UNVERIFIED = "unverified"
    PARTIALLY_VERIFIED = "partially_verified"
    VERIFIED = "verified"


CERTIFICATION_CAP_TYPE = "certification_cap"
CERTIFICATION_CAP_TITLE = "Why certification evidence is partially supported"
CERTIFICATION_CAP_MESSAGE = (
    "A certification demonstrates learning, but certification-only evidence does not fully "
    "demonstrate practical implementation. ProfiQ therefore caps certification-only confidence "
    "at 0.60. Projects, code repositories, assessments, or other practical evidence can provide stronger support."
)


if HAS_PYDANTIC:

    class EvidenceItem(BaseModel):
        """Represents an artifact or proof item supporting candidate skills."""
        evidence_type: EvidenceType = Field(
            ...,
            description="Type of evidence: project, github_repository, coding_platform, certification, assessment, coursework, or other",
        )
        title: str = Field(..., description="Short title describing this artifact")
        description: str = Field(..., description="Detailed description of what the artifact demonstrates")
        source: str = Field(..., description="Origin platform (e.g. GitHub, LeetCode, Coursera)")
        url: Optional[str] = Field(None, description="Optional reference URL")
        related_skills: List[str] = Field(default_factory=list, description="Canonical skills supported")
        evidence_strength: EvidenceStrength = Field(default=EvidenceStrength.WEAK, description="Strength: weak, moderate, strong")
        confidence: float = Field(default=0.5, ge=0.0, le=1.0, description="Confidence score between 0.0 and 1.0")
        metadata: Dict[str, Any] = Field(default_factory=dict, description="Platform-specific metadata")

    class SkillEvidenceMapping(BaseModel):
        """Links a skill to its supporting evidence: Skill -> Evidence -> Strength -> Confidence."""
        skill_name: str
        category: str
        is_claimed_in_resume: bool = True
        found_in: Optional[str] = None
        verification_status: VerificationStatus = VerificationStatus.UNVERIFIED
        has_evidence: bool = False
        overall_evidence_strength: str = "none"
        aggregate_confidence: float = 0.0
        evidence_count: int = 0
        evidence: List[EvidenceItem] = Field(default_factory=list)
        notes: Optional[str] = None

    class EvidenceAssociationResponse(BaseModel):
        """Envelope returned when associating candidate evidence with skills."""
        total_skills: int
        verified_count: int
        partially_verified_count: int
        unverified_count: int
        skills_evidence_map: List[SkillEvidenceMapping]
        verification_summary: str

    class EvidenceExplanation(BaseModel):
        """Structured explanation for evidence constraints, caps, and evaluation policies."""
        skill: str = Field(..., description="Skill name to which this explanation applies")
        type: str = Field("certification_cap", description="Type of evidence explanation, e.g. 'certification_cap'")
        title: str = Field(..., description="Concise title explaining the policy or constraint")
        message: str = Field(..., description="Detailed, constructive explanation for the candidate/user")

else:

    class EvidenceItem:
        """Fallback representation when running in minimal environments without pydantic."""

        def __init__(
            self,
            evidence_type: Any,
            title: str,
            description: str,
            source: str,
            url: Optional[str] = None,
            related_skills: Optional[List[str]] = None,
            evidence_strength: Any = EvidenceStrength.WEAK,
            confidence: float = 0.5,
            metadata: Optional[Dict[str, Any]] = None,
            **kwargs,
        ):
            self.evidence_type = (
                EvidenceType(evidence_type)
                if isinstance(evidence_type, str) and evidence_type in EvidenceType._value2member_map_
                else evidence_type
            )
            self.title = title
            self.description = description
            self.source = source
            self.url = url
            self.related_skills = list(related_skills) if related_skills is not None else []
            self.evidence_strength = (
                EvidenceStrength(evidence_strength)
                if isinstance(evidence_strength, str) and evidence_strength in EvidenceStrength._value2member_map_
                else evidence_strength
            )
            self.confidence = float(confidence)
            self.metadata = dict(metadata) if metadata is not None else {}

        def model_dump(self) -> dict:
            return {
                "evidence_type": getattr(self.evidence_type, "value", self.evidence_type),
                "title": self.title,
                "description": self.description,
                "source": self.source,
                "url": self.url,
                "related_skills": self.related_skills,
                "evidence_strength": getattr(self.evidence_strength, "value", self.evidence_strength),
                "confidence": self.confidence,
                "metadata": self.metadata,
            }

        def __repr__(self) -> str:
            return f"EvidenceItem(title='{self.title}', type='{self.evidence_type}', strength='{self.evidence_strength}')"

    class SkillEvidenceMapping:
        """Fallback representation for SkillEvidenceMapping."""

        def __init__(
            self,
            skill_name: str,
            category: str,
            is_claimed_in_resume: bool = True,
            found_in: Optional[str] = None,
            verification_status: Any = VerificationStatus.UNVERIFIED,
            has_evidence: bool = False,
            overall_evidence_strength: str = "none",
            aggregate_confidence: float = 0.0,
            evidence_count: int = 0,
            evidence: Optional[List[EvidenceItem]] = None,
            notes: Optional[str] = None,
            **kwargs,
        ):
            self.skill_name = skill_name
            self.category = category
            self.is_claimed_in_resume = is_claimed_in_resume
            self.found_in = found_in
            self.verification_status = (
                VerificationStatus(verification_status)
                if isinstance(verification_status, str) and verification_status in VerificationStatus._value2member_map_
                else verification_status
            )
            self.has_evidence = has_evidence
            self.overall_evidence_strength = overall_evidence_strength
            self.aggregate_confidence = float(aggregate_confidence)
            self.evidence_count = evidence_count
            self.evidence = list(evidence) if evidence is not None else []
            self.notes = notes

        def model_dump(self) -> dict:
            return {
                "skill_name": self.skill_name,
                "category": self.category,
                "is_claimed_in_resume": self.is_claimed_in_resume,
                "found_in": self.found_in,
                "verification_status": getattr(self.verification_status, "value", self.verification_status),
                "has_evidence": self.has_evidence,
                "overall_evidence_strength": self.overall_evidence_strength,
                "aggregate_confidence": self.aggregate_confidence,
                "evidence_count": self.evidence_count,
                "evidence": [e.model_dump() if hasattr(e, "model_dump") else e for e in self.evidence],
                "notes": self.notes,
            }

        def __repr__(self) -> str:
            return f"SkillEvidenceMapping(skill='{self.skill_name}', status='{self.verification_status}')"

    class EvidenceAssociationResponse:
        """Fallback representation for EvidenceAssociationResponse."""

        def __init__(
            self,
            total_skills: int,
            verified_count: int,
            partially_verified_count: int,
            unverified_count: int,
            skills_evidence_map: List[SkillEvidenceMapping],
            verification_summary: str,
            **kwargs,
        ):
            self.total_skills = total_skills
            self.verified_count = verified_count
            self.partially_verified_count = partially_verified_count
            self.unverified_count = unverified_count
            self.skills_evidence_map = list(skills_evidence_map)
            self.verification_summary = verification_summary

        def model_dump(self) -> dict:
            return {
                "total_skills": self.total_skills,
                "verified_count": self.verified_count,
                "partially_verified_count": self.partially_verified_count,
                "unverified_count": self.unverified_count,
                "skills_evidence_map": [
                    m.model_dump() if hasattr(m, "model_dump") else m
                    for m in self.skills_evidence_map
                ],
                "verification_summary": self.verification_summary,
            }

    class EvidenceExplanation:
        """Fallback representation for EvidenceExplanation."""

        def __init__(
            self,
            skill: str,
            type: str = "certification_cap",
            title: str = "",
            message: str = "",
            **kwargs,
        ):
            self.skill = skill
            self.type = type
            self.title = title
            self.message = message

        def model_dump(self) -> dict:
            return {
                "skill": self.skill,
                "type": self.type,
                "title": self.title,
                "message": self.message,
            }

        def __repr__(self) -> str:
            return f"EvidenceExplanation(skill='{self.skill}', type='{self.type}')"

