"""
Roadmap Router

API endpoints for generating personalized improvement roadmaps translating role
skill gaps into prioritized learning and evidence-building milestones.
"""

from fastapi import APIRouter, HTTPException, status
from models.roadmap import RoadmapRequest, RoadmapResponse
from services.roadmap_service import generate_personalized_roadmap

router = APIRouter()


@router.post(
    "/generate",
    response_model=RoadmapResponse,
    summary="Generate personalized improvement roadmap for a target role",
    description=(
        "Converts identified role skill gaps into deterministic, prioritized learning and "
        "evidence-building milestones complete with recommended actions, student projects, "
        "and suggested verifiable evidence."
    ),
)
def generate_roadmap(payload: RoadmapRequest):
    try:
        response = generate_personalized_roadmap(
            role_input=payload.role,
            candidate_skills=payload.candidate_skills,
        )
        return response
    except ValueError as val_err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(val_err),
        )
    except Exception as err:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating personalized roadmap: {str(err)}",
        )
