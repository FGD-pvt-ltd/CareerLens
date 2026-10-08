"""
Candidate Readiness Report Router

API endpoints for generating evidence-aware, explainable candidate readiness reports.
"""

from fastapi import APIRouter, HTTPException, status
from models.report import CandidateReport, CandidateReportRequest, CombinedReportRequest
from services.analysis_service import analyze_candidate
from services.llm_service import generate_candidate_explanation
from services.report_service import generate_candidate_report

router = APIRouter()


@router.post(
    "/generate",
    response_model=CandidateReport,
    summary="Generate candidate readiness report from structured analysis",
    description="Synthesizes deterministic analysis and LLM explanation into a structured, evidence-aware report.",
)
def create_candidate_report(payload: CandidateReportRequest):
    if not payload.analysis:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Candidate analysis payload cannot be empty.",
        )

    try:
        report = generate_candidate_report(
            analysis=payload.analysis,
            llm_explanation=payload.llm_explanation,
        )
        return report
    except ValueError as val_err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(val_err),
        )
    except Exception as err:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating candidate report: {str(err)}",
        )


@router.post(
    "/candidate-report",
    response_model=CandidateReport,
    summary="Generate end-to-end candidate readiness report from resume text",
    description="Orchestrates full analysis, LLM explanation, and synthesizes final CandidateReport.",
)
def create_full_candidate_report(payload: CombinedReportRequest):
    if not payload.resume_text or not payload.resume_text.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Resume text cannot be empty or contain only whitespace.",
        )

    if not payload.target_role or not payload.target_role.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Target role cannot be empty or contain only whitespace.",
        )

    try:
        # 1. Deterministic analysis orchestrator
        analysis = analyze_candidate(
            resume_text=payload.resume_text,
            target_role=payload.target_role,
            evidence_items=payload.evidence_items or [],
        )

        # 2. LLM explanation synthesis
        llm_exp = generate_candidate_explanation(analysis)

        # 3. Report synthesis
        report = generate_candidate_report(
            analysis=analysis,
            llm_explanation=llm_exp,
        )
        return report
    except ValueError as val_err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(val_err),
        )
    except Exception as err:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error orchestrating candidate report: {str(err)}",
        )
