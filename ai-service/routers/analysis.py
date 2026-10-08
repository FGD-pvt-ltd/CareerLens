"""
Analysis Router

API endpoints for running the unified, end-to-end ProfiQ candidate analysis orchestrator.
"""

from fastapi import APIRouter, HTTPException, status
from models.analysis import AnalysisRequest, AnalysisResponse
from services.analysis_service import analyze_candidate

router = APIRouter()


@router.post(
    "/analyze",
    response_model=AnalysisResponse,
    summary="Execute complete end-to-end candidate employability analysis",
    description=(
        "Orchestrates skill extraction from resume text, evidence aggregation, "
        "role requirements matching, job readiness scoring, skill gap detection, "
        "personalized improvement roadmap generation, and explainable summary synthesis."
    ),
)
def run_candidate_analysis(payload: AnalysisRequest):
    try:
        response = analyze_candidate(
            resume_text=payload.resume_text,
            target_role=payload.target_role,
            evidence_items=payload.evidence_items,
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
            detail=f"Error executing candidate analysis: {str(err)}",
        )
