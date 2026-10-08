"""
Roles Router

API endpoints for querying canonical role requirements and matching candidate skills
against target role requirements.
"""

from fastapi import APIRouter, HTTPException, status
from models.matching import RoleMatchRequest, RoleMatchResponse
from models.role import RoleRequirementsRequest, RoleRequirementsResponse
from services.role_matcher import match_candidate_to_role
from services.role_service import resolve_role_requirements

router = APIRouter()


@router.post(
    "/requirements",
    response_model=RoleRequirementsResponse,
    summary="Get required skills and importance tiers for a target job role",
    description=(
        "Resolves an input job role or alias (e.g. 'AI Engineer', 'SDE', 'Data Scientist') "
        "to its canonical role definition, returning required skills, categories, "
        "importance levels (high, medium, low), and weights."
    ),
)
def get_role_requirements(payload: RoleRequirementsRequest):
    try:
        response = resolve_role_requirements(payload.role)
        return response
    except ValueError as val_err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(val_err),
        )
    except Exception as err:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error resolving role requirements: {str(err)}",
        )


@router.post(
    "/match",
    response_model=RoleMatchResponse,
    summary="Match candidate aggregated skills against target role requirements",
    description=(
        "Compares candidate evidence-confidence against role requirements, categorizing "
        "each required skill into strong_match, partial_match, or gap, and calculating "
        "deterministic weighted match contributions without claiming overall job readiness."
    ),
)
def match_role_skills(payload: RoleMatchRequest):
    try:
        response = match_candidate_to_role(
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
            detail=f"Error matching candidate skills to role: {str(err)}",
        )
