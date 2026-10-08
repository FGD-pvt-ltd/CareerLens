"""
Backend Compatibility Adapter Models

Pydantic models conforming to the existing Node.js/Express backend contract
for POST /api/analyze requests and responses.
"""

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
try:
    from pydantic import BaseModel, Field, field_validator
    HAS_PYDANTIC = True
except ImportError:
    HAS_PYDANTIC = False


if HAS_PYDANTIC:

    class TargetRolePayload(BaseModel):
        """Target job role payload sent by the Node.js backend."""
        roleId: Optional[str] = Field(None, description="Optional role ID identifier")
        roleName: str = Field(..., description="Target role title, e.g. 'AI Engineer'")

        @field_validator("roleName")
        @classmethod
        def validate_role_name(cls, v: Any) -> str:
            if v is None:
                raise ValueError("targetRole.roleName is required.")
            val_str = str(v).strip()
            if not val_str:
                raise ValueError("targetRole.roleName cannot be empty or whitespace.")
            return val_str

    class BackendAnalyzeRequest(BaseModel):
        """Request payload structure expected by POST /api/analyze from the Node backend."""
        candidateId: str = Field(..., description="Unique MongoDB or applicant candidate ID")
        targetRole: TargetRolePayload = Field(..., description="Target role specification")
        profile: Optional[Dict[str, Any]] = Field(
            default_factory=dict,
            description="Unified candidate profile object containing portfolio, github, experience, etc.",
        )

        @field_validator("candidateId")
        @classmethod
        def validate_candidate_id(cls, v: Any) -> str:
            if v is None:
                raise ValueError("candidateId is required.")
            val_str = str(v).strip()
            if not val_str:
                raise ValueError("candidateId cannot be empty or whitespace.")
            return val_str

        @field_validator("profile")
        @classmethod
        def validate_profile(cls, v: Any) -> Dict[str, Any]:
            if v is None:
                return {}
            if not isinstance(v, dict):
                raise ValueError("profile must be an object/dictionary.")
            return v

    class CompatibilityAnalysisData(BaseModel):
        """Inner data object required by the existing Node backend contract."""
        candidateId: str = Field(..., description="Exact candidateId received in the request")
        readinessScore: int = Field(..., ge=0, le=100, description="Overall deterministic readiness score")
        scoreBreakdown: Dict[str, Any] = Field(default_factory=dict, description="Multi-aspect category scores")
        skills: List[Any] = Field(default_factory=list, description="Claimed/detected canonical skills")
        strengths: List[str] = Field(default_factory=list, description="Human-readable verified strength summaries")
        gaps: List[Any] = Field(default_factory=list, description="Human-readable, evidence-aware skill gaps")
        roadmap: List[Any] = Field(default_factory=list, description="Actionable personalized improvement steps")
        evidence_explanations: List[Dict[str, Any]] = Field(
            default_factory=list,
            description="Structured explanations regarding evidence caps and policies",
        )
        evidenceExplanations: Optional[List[Dict[str, Any]]] = Field(
            default=None,
            description="CamelCase alias for evidence_explanations",
        )

    class CompatibilityMetadata(BaseModel):
        """Service metadata payload expected by the Node backend normalizer."""
        serviceVersion: str = Field("1.0.0", description="Service deployment version")
        model: str = Field("profiq-ai-fastapi", description="AI evaluation pipeline/model identity")
        analyzedAt: str = Field(
            default_factory=lambda: datetime.now(timezone.utc).isoformat(),
            description="UTC timestamp of analysis",
        )
        evidence_explanations: List[Dict[str, Any]] = Field(
            default_factory=list,
            description="Structured explanations regarding evidence caps and policies",
        )

    class BackendAnalyzeResponse(BaseModel):
        """Outer response wrapper strictly adhering to backend contract."""
        success: bool = Field(True, description="Success status flag")
        data: CompatibilityAnalysisData = Field(..., description="Normalized evaluation data")
        metadata: CompatibilityMetadata = Field(..., description="Service evaluation metadata")
        evidence_explanations: List[Dict[str, Any]] = Field(
            default_factory=list,
            description="Top-level structured explanations regarding evidence caps and policies",
        )

else:

    class TargetRolePayload:
        def __init__(self, roleName: str, roleId: Optional[str] = None):
            if not roleName or not str(roleName).strip():
                raise ValueError("targetRole.roleName cannot be empty or whitespace.")
            self.roleName = str(roleName).strip()
            self.roleId = str(roleId).strip() if roleId else None

    class BackendAnalyzeRequest:
        def __init__(self, candidateId: str, targetRole: Any, profile: Optional[Dict[str, Any]] = None):
            if not candidateId or not str(candidateId).strip():
                raise ValueError("candidateId cannot be empty or whitespace.")
            self.candidateId = str(candidateId).strip()
            self.targetRole = targetRole if isinstance(targetRole, TargetRolePayload) else TargetRolePayload(**targetRole)
            self.profile = profile or {}

    class CompatibilityAnalysisData:
        def __init__(self, candidateId: str, readinessScore: int, scoreBreakdown: Dict[str, Any],
                     skills: List[Any], strengths: List[str], gaps: List[Any], roadmap: List[Any],
                     evidence_explanations: Optional[List[Dict[str, Any]]] = None,
                     evidenceExplanations: Optional[List[Dict[str, Any]]] = None):
            self.candidateId = candidateId
            self.readinessScore = readinessScore
            self.scoreBreakdown = scoreBreakdown
            self.skills = skills
            self.strengths = strengths
            self.gaps = gaps
            self.roadmap = roadmap
            self.evidence_explanations = list(evidence_explanations) if evidence_explanations else []
            self.evidenceExplanations = list(evidenceExplanations) if evidenceExplanations else self.evidence_explanations

        def model_dump(self) -> dict:
            return {
                "candidateId": self.candidateId,
                "readinessScore": self.readinessScore,
                "scoreBreakdown": self.scoreBreakdown,
                "skills": self.skills,
                "strengths": self.strengths,
                "gaps": self.gaps,
                "roadmap": self.roadmap,
                "evidence_explanations": self.evidence_explanations,
                "evidenceExplanations": self.evidenceExplanations,
            }

    class CompatibilityMetadata:
        def __init__(self, serviceVersion: str = "1.0.0", model: str = "profiq-ai-fastapi", analyzedAt: Optional[str] = None,
                     evidence_explanations: Optional[List[Dict[str, Any]]] = None):
            self.serviceVersion = serviceVersion
            self.model = model
            self.analyzedAt = analyzedAt or datetime.now(timezone.utc).isoformat()
            self.evidence_explanations = list(evidence_explanations) if evidence_explanations else []

        def model_dump(self) -> dict:
            return {
                "serviceVersion": self.serviceVersion,
                "model": self.model,
                "analyzedAt": self.analyzedAt,
                "evidence_explanations": self.evidence_explanations,
            }

    class BackendAnalyzeResponse:
        def __init__(self, data: CompatibilityAnalysisData, metadata: CompatibilityMetadata, success: bool = True,
                     evidence_explanations: Optional[List[Dict[str, Any]]] = None):
            self.success = success
            self.data = data
            self.metadata = metadata
            self.evidence_explanations = list(evidence_explanations) if evidence_explanations else getattr(data, "evidence_explanations", [])

        def model_dump(self) -> dict:
            return {
                "success": self.success,
                "data": self.data.model_dump() if hasattr(self.data, "model_dump") else self.data,
                "metadata": self.metadata.model_dump() if hasattr(self.metadata, "model_dump") else self.metadata,
                "evidence_explanations": self.evidence_explanations,
            }
