"""
Readiness Router

API endpoints for analyzing candidate job readiness and prioritizing skill gaps
against target job roles.
"""

from fastapi import APIRouter, HTTPException, status
from models.readiness import ReadinessAnalysisRequest, ReadinessAnalysisResponse
from services.readiness_service import analyze_job_readiness

router = APIRouter()


@router.post(
    "/analyze",
    response_model=ReadinessAnalysisResponse,
    summary="Analyze candidate job readiness and prioritize skill gaps for target role",
    description=(
        "Compares candidate evidence-confidence against role requirements to calculate "
        "an overall deterministic readiness score (0-100), descriptive readiness tier, "
        "and prioritized skill gaps without claiming absolute hiring guarantees."
    ),
)
def analyze_readiness(payload: ReadinessAnalysisRequest):
    try:
        response = analyze_job_readiness(
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
            detail=f"Error analyzing job readiness: {str(err)}",
        )
