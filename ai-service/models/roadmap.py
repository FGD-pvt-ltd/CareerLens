"""
Roadmap Data Models

Data models for representing personalized learning and evidence-building roadmaps,
translating role skill gaps into prioritized, actionable milestones.
"""

from typing import Any, Dict, List, Optional

try:
    from pydantic import BaseModel, Field
    HAS_PYDANTIC = True
except ImportError:
    HAS_PYDANTIC = False


if HAS_PYDANTIC:

    class RoadmapItem(BaseModel):
        """Actionable improvement milestone for an individual role skill gap."""
        skill_name: str
        category: str
        priority: int = Field(
            ...,
            ge=1,
            description="Priority ranking order (1 = highest priority)",
            examples=[1, 2, 3],
        )
        importance: str = Field(
            ...,
            description="Role priority level: high, medium, or low",
            examples=["high", "medium", "low"],
        )
        current_confidence: float = Field(
            ...,
            ge=0.0,
            le=0.95,
            description="Current evidence confidence score for this skill",
        )
        current_evidence_status: str = Field(
            ...,
            description="Current evidence status: insufficient_evidence, partially_supported, etc.",
        )
        gap_severity: str = Field(
            ...,
            description="Severity tier of the gap: high, medium, or low",
            examples=["high", "medium", "low"],
        )
        goal: str = Field(
            ...,
            description="Demonstrable capability goal for this skill",
        )
        recommended_actions: List[str] = Field(
            default_factory=list,
            description="Step-by-step practical actions to develop the skill",
        )
        suggested_project: str = Field(
            ...,
            description="A realistic, student-friendly project suggestion",
        )
        suggested_evidence: List[str] = Field(
            default_factory=list,
            description="Observable evidence artifacts the candidate can produce",
        )
        estimated_effort: str = Field(
            ...,
            description="Estimated effort duration: 1–2 weeks, 2–4 weeks, or 1–2 months",
            examples=["1–2 weeks", "2–4 weeks", "1–2 months"],
        )
        reason: str = Field(
            ...,
            description="Justification explaining why this roadmap milestone is needed",
        )

    class RoadmapRequest(BaseModel):
        """Request payload for roadmap generation."""
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

    class RoadmapResponse(BaseModel):
        """Structured personalized improvement roadmap."""
        role: str
        matched_role: str
        total_roadmap_items: int
        high_priority_items: int
        medium_priority_items: int
        low_priority_items: int
        roadmap_items: List[RoadmapItem] = Field(
            default_factory=list,
            description="Prioritized list of actionable skill improvement milestones",
        )

else:

    class RoadmapItem:
        def __init__(
            self,
            skill_name: str,
            category: str,
            priority: int,
            importance: str,
            current_confidence: float,
            current_evidence_status: str,
            gap_severity: str,
            goal: str,
            recommended_actions: Optional[List[str]] = None,
            suggested_project: str = "",
            suggested_evidence: Optional[List[str]] = None,
            estimated_effort: str = "2–4 weeks",
            reason: str = "",
            **kwargs,
        ):
            self.skill_name = skill_name
            self.category = category
            self.priority = int(priority)
            self.importance = importance
            self.current_confidence = float(current_confidence)
            self.current_evidence_status = current_evidence_status
            self.gap_severity = gap_severity
            self.goal = goal
            self.recommended_actions = list(recommended_actions) if recommended_actions is not None else []
            self.suggested_project = suggested_project
            self.suggested_evidence = list(suggested_evidence) if suggested_evidence is not None else []
            self.estimated_effort = estimated_effort
            self.reason = reason

        def model_dump(self) -> dict:
            return {
                "skill_name": self.skill_name,
                "category": self.category,
                "priority": self.priority,
                "importance": self.importance,
                "current_confidence": self.current_confidence,
                "current_evidence_status": self.current_evidence_status,
                "gap_severity": self.gap_severity,
                "goal": self.goal,
                "recommended_actions": self.recommended_actions,
                "suggested_project": self.suggested_project,
                "suggested_evidence": self.suggested_evidence,
                "estimated_effort": self.estimated_effort,
                "reason": self.reason,
            }

    class RoadmapRequest:
        def __init__(self, role: str, candidate_skills: Optional[List[Any]] = None, **kwargs):
            self.role = role
            self.candidate_skills = list(candidate_skills) if candidate_skills is not None else []

    class RoadmapResponse:
        def __init__(
            self,
            role: str,
            matched_role: str,
            total_roadmap_items: int,
            high_priority_items: int,
            medium_priority_items: int,
            low_priority_items: int,
            roadmap_items: List[RoadmapItem],
            **kwargs,
        ):
            self.role = role
            self.matched_role = matched_role
            self.total_roadmap_items = int(total_roadmap_items)
            self.high_priority_items = int(high_priority_items)
            self.medium_priority_items = int(medium_priority_items)
            self.low_priority_items = int(low_priority_items)
            self.roadmap_items = list(roadmap_items)

        def model_dump(self) -> dict:
            return {
                "role": self.role,
                "matched_role": self.matched_role,
                "total_roadmap_items": self.total_roadmap_items,
                "high_priority_items": self.high_priority_items,
                "medium_priority_items": self.medium_priority_items,
                "low_priority_items": self.low_priority_items,
                "roadmap_items": [
                    item.model_dump() if hasattr(item, "model_dump") else item
                    for item in self.roadmap_items
                ],
            }
