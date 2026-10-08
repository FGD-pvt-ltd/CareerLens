"""
Backend Compatibility Router

Exposes POST /api/analyze compatible with the existing Node.js/Express backend contract.
"""

from fastapi import APIRouter, HTTPException, status
from models.compatibility import BackendAnalyzeRequest, BackendAnalyzeResponse
from services.compatibility_service import adapt_backend_analysis

router = APIRouter()


@router.post(
    "/analyze",
    response_model=BackendAnalyzeResponse,
    summary="Legacy backend compatibility analysis endpoint",
    description=(
        "Receives a candidate profile from the existing Node.js backend, "
        "adapts it into ProfiQ EvidenceItems, runs deterministic readiness analysis, "
        "and returns a response matching the backend's expected contract."
    ),
)
def analyze_candidate_compatibility(payload: BackendAnalyzeRequest):
    try:
        response = adapt_backend_analysis(payload)
        return response
    except HTTPException:
        raise
    except ValueError as val_err:
        err_msg = str(val_err)
        if "not recognized" in err_msg.lower() or "supported roles" in err_msg.lower():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=err_msg,
            )
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=err_msg,
        )
    except Exception:
        # Never expose internal exceptions, secrets, API keys, or stack traces
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An internal error occurred during candidate profile analysis.",
        )
