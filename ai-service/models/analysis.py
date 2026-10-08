"""
Candidate Analysis Orchestrator Models

Data models for orchestrating the complete end-to-end ProfiQ candidate analysis pipeline,
including claimed skills, aggregated evidence, role matching, readiness scoring,
prioritized gaps, and personalized improvement roadmap.
"""

from typing import Any, Dict, List, Optional
from models.aggregation import AggregatedSkillResult
from models.evidence import EvidenceItem, EvidenceExplanation
from models.gap import SkillGap
from models.matching import RoleSkillMatch
from models.roadmap import RoadmapResponse
from models.role import RoleRequirementsResponse

try:
    from pydantic import BaseModel, Field
    HAS_PYDANTIC = True
except ImportError:
    HAS_PYDANTIC = False


if HAS_PYDANTIC:

    class AnalysisRequest(BaseModel):
        """Request payload for complete candidate analysis."""
        resume_text: str = Field(
            ...,
            description="Cleaned, readable text extracted from candidate resume",
            min_length=1,
        )
        target_role: str = Field(
            ...,
            description="Target job role title or alias (e.g. 'AI Engineer', 'SDE', 'Data Scientist')",
            min_length=1,
            examples=["AI Engineer", "Software Developer"],
        )
        evidence_items: Optional[List[Any]] = Field(
            default_factory=list,
            description="Optional list of external EvidenceItem artifacts supporting candidate skills",
        )

    class AnalysisResponse(BaseModel):
        """Complete unified candidate analysis response."""
        target_role: str = Field(
            ...,
            description="Target job role evaluated for this candidate",
        )
        claimed_skills: List[Any] = Field(
            default_factory=list,
            description="Skills detected as claims directly extracted from resume text",
        )
        aggregated_skills: List[AggregatedSkillResult] = Field(
            default_factory=list,
            description="Skills evaluated and combined with supporting evidence artifacts",
        )
        role_requirements: RoleRequirementsResponse = Field(
            ...,
            description="Canonical role skill requirements and priority weights",
        )
        skill_matches: List[RoleSkillMatch] = Field(
            default_factory=list,
            description="Detailed comparison between candidate evidence and role requirements",
        )
        readiness_score: int = Field(
            ...,
            ge=0,
            le=100,
            description="Deterministic overall evidence-based readiness score from 0 to 100",
        )
        readiness_label: str = Field(
            ...,
            description="Descriptive tier label for the readiness score",
        )
        skill_gaps: List[SkillGap] = Field(
            default_factory=list,
            description="Prioritized list of skill requirements needing development (< 0.70 confidence)",
        )
        roadmap: RoadmapResponse = Field(
            ...,
            description="Actionable, personalized improvement roadmap with realistic projects and evidence targets",
        )
        summary: str = Field(
            ...,
            description="Human-readable, evidence-grounded summary of the candidate's standing and next steps",
        )
        evidence_items: Optional[List[Any]] = Field(
            default_factory=list,
            description="Canonical evidence artifacts analyzed for the candidate",
        )
        evidence_explanations: List[EvidenceExplanation] = Field(
            default_factory=list,
            description="Structured explanations regarding evidence caps and policies",
        )

else:

    class AnalysisRequest:
        def __init__(
            self,
            resume_text: str,
            target_role: str,
            evidence_items: Optional[List[Any]] = None,
            **kwargs,
        ):
            self.resume_text = resume_text
            self.target_role = target_role
            self.evidence_items = list(evidence_items) if evidence_items is not None else []

    class AnalysisResponse:
        def __init__(
            self,
            target_role: str,
            claimed_skills: List[Any],
            aggregated_skills: List[AggregatedSkillResult],
            role_requirements: Any,
            skill_matches: List[RoleSkillMatch],
            readiness_score: int,
            readiness_label: str,
            skill_gaps: List[SkillGap],
            roadmap: Any,
            summary: str,
            evidence_items: Optional[List[Any]] = None,
            evidence_explanations: Optional[List[Any]] = None,
            **kwargs,
        ):
            self.target_role = target_role
            self.claimed_skills = list(claimed_skills)
            self.aggregated_skills = list(aggregated_skills)
            self.role_requirements = role_requirements
            self.skill_matches = list(skill_matches)
            self.readiness_score = int(readiness_score)
            self.readiness_label = readiness_label
            self.skill_gaps = list(skill_gaps)
            self.roadmap = roadmap
            self.summary = summary
            self.evidence_items = list(evidence_items) if evidence_items is not None else []
            self.evidence_explanations = list(evidence_explanations) if evidence_explanations is not None else []

        def model_dump(self) -> dict:
            return {
                "target_role": self.target_role,
                "claimed_skills": [
                    s.model_dump() if hasattr(s, "model_dump") else s
                    for s in self.claimed_skills
                ],
                "aggregated_skills": [
                    a.model_dump() if hasattr(a, "model_dump") else a
                    for a in self.aggregated_skills
                ],
                "role_requirements": (
                    self.role_requirements.model_dump()
                    if hasattr(self.role_requirements, "model_dump")
                    else self.role_requirements
                ),
                "skill_matches": [
                    m.model_dump() if hasattr(m, "model_dump") else m
                    for m in self.skill_matches
                ],
                "readiness_score": self.readiness_score,
                "readiness_label": self.readiness_label,
                "skill_gaps": [
                    g.model_dump() if hasattr(g, "model_dump") else g
                    for g in self.skill_gaps
                ],
                "roadmap": (
                    self.roadmap.model_dump()
                    if hasattr(self.roadmap, "model_dump")
                    else self.roadmap
                ),
                "summary": self.summary,
                "evidence_items": [
                    e.model_dump() if hasattr(e, "model_dump") else e
                    for e in self.evidence_items
                ],
                "evidence_explanations": [
                    x.model_dump() if hasattr(x, "model_dump") else x
                    for x in self.evidence_explanations
                ],
            }
