"""
Candidate Readiness Report Models

Defines structured, evidence-aware, and explainable models for candidate readiness
reports combining deterministic analysis, skill strengths, gap diagnoses, roadmap milestones,
and natural-language LLM explanations.
"""

from typing import Any, Dict, List, Optional, Union
from models.evidence import EvidenceExplanation

try:
    from pydantic import BaseModel, Field
    HAS_PYDANTIC = True
except ImportError:
    HAS_PYDANTIC = False


if HAS_PYDANTIC:

    class ReportStrength(BaseModel):
        """A strongly supported candidate skill with verifiable evidence."""
        skill_name: str = Field(..., description="Canonical name of the skill")
        confidence: float = Field(..., ge=0.0, le=1.0, description="Evidence confidence score (>= 0.70)")
        evidence_status: str = Field(..., description="Status tier: strongly_supported")
        evidence_strength: str = Field(..., description="Evidence strength rating: strong or moderate")
        explanation: str = Field(..., description="Explainable description grounded in candidate evidence")

    class ReportSkillGap(BaseModel):
        """A role requirement requiring development or verifiable evidence."""
        skill_name: str = Field(..., description="Canonical name of the required skill")
        current_confidence: float = Field(..., ge=0.0, le=1.0, description="Current evidence confidence (0.0 to 0.69)")
        importance: str = Field(..., description="Role requirement importance: high, medium, or low")
        gap_severity: str = Field(..., description="Severity of the gap: high, medium, or low")
        evidence_status: str = Field(..., description="Current evidence status tier")
        reason: str = Field(..., description="Explainable justification for why this is a gap")
        recommended_action: str = Field(..., description="Actionable recommended development step from the roadmap")

    class EvidenceSummary(BaseModel):
        """High-level summary of candidate skill claims and verifiable evidence support."""
        total_claimed_skills: int = Field(..., ge=0, description="Total number of evaluated claimed skills")
        strongly_supported_skills: int = Field(..., ge=0, description="Number of skills with confidence >= 0.70")
        partially_supported_skills: int = Field(..., ge=0, description="Number of skills with confidence 0.50-0.69")
        insufficient_evidence_skills: int = Field(..., ge=0, description="Number of skills with confidence < 0.50")
        total_evidence_items: int = Field(..., ge=0, description="Total count of supporting evidence artifacts")
        explanation: str = Field(..., description="Narrative explaining the evidence distribution and clarification")

    class ReportRoadmapItem(BaseModel):
        """Actionable milestone from the personalized improvement roadmap."""
        skill_name: str = Field(..., description="Name of the skill to develop")
        priority: int = Field(..., ge=1, description="Sequential priority rank order (1 = highest)")
        importance: str = Field(..., description="Role importance level: high, medium, or low")
        current_confidence: float = Field(..., ge=0.0, le=1.0, description="Current candidate confidence")
        goal: str = Field(..., description="Demonstrable capability goal")
        recommended_actions: List[str] = Field(default_factory=list, description="Step-by-step practical actions")
        suggested_project: str = Field(..., description="Realistic practical project")
        suggested_evidence: List[str] = Field(default_factory=list, description="Verifiable evidence artifacts to collect")
        estimated_effort: str = Field(..., description="Realistic estimated effort category")

    class CandidateReport(BaseModel):
        """Structured candidate readiness report combining deterministic analysis with natural-language presentation."""
        target_role: str = Field(..., description="Target job role evaluated")
        readiness_score: int = Field(..., ge=0, le=100, description="Authoritative deterministic readiness score (0-100)")
        readiness_label: str = Field(..., description="Descriptive tier label (e.g. Strongly Ready, Moderately Ready)")
        executive_summary: str = Field(..., description="Concise executive summary grounded in deterministic analysis")
        strengths: List[ReportStrength] = Field(default_factory=list, description="Strongly supported skills (confidence >= 0.70)")
        skill_gaps: List[ReportSkillGap] = Field(default_factory=list, description="Skill requirements requiring development")
        evidence_summary: EvidenceSummary = Field(..., description="High-level counts and explanation of evidence distribution")
        roadmap: List[ReportRoadmapItem] = Field(default_factory=list, description="Personalized roadmap milestones")
        next_steps: List[str] = Field(default_factory=list, description="3-5 immediate concrete actions")
        disclaimer: str = Field(..., description="Standard ProfiQ evidence and non-guarantee disclaimer")
        evidence_explanations: List[EvidenceExplanation] = Field(
            default_factory=list,
            description="Structured explanations regarding evidence caps and policies",
        )

    class CandidateReportRequest(BaseModel):
        """Request payload for generating candidate report from structured analysis and optional LLM explanation."""
        analysis: Union[Dict[str, Any], Any] = Field(..., description="Authoritative deterministic analysis")
        llm_explanation: Optional[Union[Dict[str, Any], Any]] = Field(default=None, description="Optional LLM explanation output")

    class CombinedReportRequest(BaseModel):
        """Request payload for end-to-end report generation from resume text and target role."""
        resume_text: str = Field(..., description="Cleaned resume text", min_length=1)
        target_role: str = Field(..., description="Target job role title or alias", min_length=1)
        evidence_items: Optional[List[Any]] = Field(default_factory=list, description="Optional external evidence artifacts")

else:

    class ReportStrength:
        def __init__(self, skill_name: str, confidence: float, evidence_status: str, evidence_strength: str, explanation: str, **kwargs):
            self.skill_name = skill_name
            self.confidence = float(confidence)
            self.evidence_status = evidence_status
            self.evidence_strength = evidence_strength
            self.explanation = explanation

        def model_dump(self) -> dict:
            return {
                "skill_name": self.skill_name,
                "confidence": self.confidence,
                "evidence_status": self.evidence_status,
                "evidence_strength": self.evidence_strength,
                "explanation": self.explanation,
            }

    class ReportSkillGap:
        def __init__(self, skill_name: str, current_confidence: float, importance: str, gap_severity: str, evidence_status: str, reason: str, recommended_action: str, **kwargs):
            self.skill_name = skill_name
            self.current_confidence = float(current_confidence)
            self.importance = importance
            self.gap_severity = gap_severity
            self.evidence_status = evidence_status
            self.reason = reason
            self.recommended_action = recommended_action

        def model_dump(self) -> dict:
            return {
                "skill_name": self.skill_name,
                "current_confidence": self.current_confidence,
                "importance": self.importance,
                "gap_severity": self.gap_severity,
                "evidence_status": self.evidence_status,
                "reason": self.reason,
                "recommended_action": self.recommended_action,
            }

    class EvidenceSummary:
        def __init__(self, total_claimed_skills: int, strongly_supported_skills: int, partially_supported_skills: int, insufficient_evidence_skills: int, total_evidence_items: int, explanation: str, **kwargs):
            self.total_claimed_skills = int(total_claimed_skills)
            self.strongly_supported_skills = int(strongly_supported_skills)
            self.partially_supported_skills = int(partially_supported_skills)
            self.insufficient_evidence_skills = int(insufficient_evidence_skills)
            self.total_evidence_items = int(total_evidence_items)
            self.explanation = explanation

        def model_dump(self) -> dict:
            return {
                "total_claimed_skills": self.total_claimed_skills,
                "strongly_supported_skills": self.strongly_supported_skills,
                "partially_supported_skills": self.partially_supported_skills,
                "insufficient_evidence_skills": self.insufficient_evidence_skills,
                "total_evidence_items": self.total_evidence_items,
                "explanation": self.explanation,
            }

    class ReportRoadmapItem:
        def __init__(self, skill_name: str, priority: int, importance: str, current_confidence: float, goal: str, recommended_actions: Optional[List[str]] = None, suggested_project: str = "", suggested_evidence: Optional[List[str]] = None, estimated_effort: str = "", **kwargs):
            self.skill_name = skill_name
            self.priority = int(priority)
            self.importance = importance
            self.current_confidence = float(current_confidence)
            self.goal = goal
            self.recommended_actions = list(recommended_actions) if recommended_actions else []
            self.suggested_project = suggested_project
            self.suggested_evidence = list(suggested_evidence) if suggested_evidence else []
            self.estimated_effort = estimated_effort

        def model_dump(self) -> dict:
            return {
                "skill_name": self.skill_name,
                "priority": self.priority,
                "importance": self.importance,
                "current_confidence": self.current_confidence,
                "goal": self.goal,
                "recommended_actions": self.recommended_actions,
                "suggested_project": self.suggested_project,
                "suggested_evidence": self.suggested_evidence,
                "estimated_effort": self.estimated_effort,
            }

    class CandidateReport:
        def __init__(self, target_role: str, readiness_score: int, readiness_label: str, executive_summary: str, strengths: Optional[List[Any]] = None, skill_gaps: Optional[List[Any]] = None, evidence_summary: Optional[Any] = None, roadmap: Optional[List[Any]] = None, next_steps: Optional[List[str]] = None, disclaimer: str = "", evidence_explanations: Optional[List[Any]] = None, **kwargs):
            self.target_role = target_role
            self.readiness_score = int(readiness_score)
            self.readiness_label = readiness_label
            self.executive_summary = executive_summary
            self.strengths = list(strengths) if strengths else []
            self.skill_gaps = list(skill_gaps) if skill_gaps else []
            self.evidence_summary = evidence_summary
            self.roadmap = list(roadmap) if roadmap else []
            self.next_steps = list(next_steps) if next_steps else []
            self.disclaimer = disclaimer
            self.evidence_explanations = list(evidence_explanations) if evidence_explanations else []

        def model_dump(self) -> dict:
            return {
                "target_role": self.target_role,
                "readiness_score": self.readiness_score,
                "readiness_label": self.readiness_label,
                "executive_summary": self.executive_summary,
                "strengths": [s.model_dump() if hasattr(s, "model_dump") else s for s in self.strengths],
                "skill_gaps": [g.model_dump() if hasattr(g, "model_dump") else g for g in self.skill_gaps],
                "evidence_summary": self.evidence_summary.model_dump() if hasattr(self.evidence_summary, "model_dump") else self.evidence_summary,
                "roadmap": [r.model_dump() if hasattr(r, "model_dump") else r for r in self.roadmap],
                "next_steps": self.next_steps,
                "disclaimer": self.disclaimer,
                "evidence_explanations": [x.model_dump() if hasattr(x, "model_dump") else x for x in self.evidence_explanations],
            }

    class CandidateReportRequest:
        def __init__(self, analysis: Any, llm_explanation: Optional[Any] = None, **kwargs):
            self.analysis = analysis
            self.llm_explanation = llm_explanation

    class CombinedReportRequest:
        def __init__(self, resume_text: str, target_role: str, evidence_items: Optional[List[Any]] = None, **kwargs):
            self.resume_text = resume_text
            self.target_role = target_role
            self.evidence_items = evidence_items or []
