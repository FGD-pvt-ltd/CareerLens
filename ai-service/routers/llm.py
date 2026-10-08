"""
LLM Explanation Router

API endpoints for generating natural-language explanations from structured candidate analyses.
"""

from fastapi import APIRouter, HTTPException, status
from models.llm import LLMExplanationRequest, LLMExplanationResponse
from services.llm_service import generate_candidate_explanation

router = APIRouter()


@router.post(
    "/explain",
    response_model=LLMExplanationResponse,
    summary="Generate natural-language explanation from structured candidate analysis",
    description=(
        "Translates structured analysis (readiness score, matches, gaps, roadmap) "
        "into clear, constructive natural-language explanations without claiming mastery."
    ),
)
def explain_candidate_analysis(payload: LLMExplanationRequest):
    if not payload.analysis:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Analysis payload cannot be empty.",
        )

    try:
        response = generate_candidate_explanation(
            analysis=payload.analysis,
            candidate_context=payload.candidate_context,
            tone=payload.tone,
        )
        return response
    except Exception as err:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating explanation: {str(err)}",
        )
