from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

from models.evidence import EvidenceItem, EvidenceAssociationResponse
from models.github import GitHubAnalysisRequest, GitHubAnalysisResponse
from models.aggregation import EvidenceAggregationRequest, EvidenceAggregationResponse
from services.evidence_service import associate_evidence_with_skills
from services.evidence_aggregator import aggregate_evidence_for_skills
from services.github_service import fetch_and_analyze_github_profile
from services.skill_extractor import extract_skills_from_text

router = APIRouter()


class EvidenceAssociationRequest(BaseModel):
    resume_text: Optional[str] = Field(
        None,
        description="Optional raw or cleaned resume text to extract skills from automatically",
    )
    skills: Optional[List[Dict[str, Any]]] = Field(
        None,
        description="Optional pre-extracted skills list (e.g. from /skills/extract)",
    )
    evidence_items: List[EvidenceItem] = Field(
        default_factory=list,
        description="List of candidate evidence artifacts supporting skills",
    )


@router.post(
    "/associate",
    response_model=EvidenceAssociationResponse,
    summary="Associate evidence artifacts with candidate skills",
    description=(
        "Maps evidence items (projects, repos, coding profiles, certs) to claimed skills. "
        "Enforces verification rules (e.g. certificate dampening, multi-source aggregation) "
        "and produces structured Skill -> Evidence -> Strength -> Confidence representations."
    ),
)
def associate_evidence(payload: EvidenceAssociationRequest):
    skills_to_use = payload.skills or []

    # If raw resume text is passed instead of pre-extracted skills, extract them now
    if payload.resume_text and not skills_to_use:
        try:
            extraction_result = extract_skills_from_text(payload.resume_text)
            skills_to_use = extraction_result.get("skills_detected_in_resume", [])
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to extract skills from provided resume text: {str(e)}",
            )

    try:
        response = associate_evidence_with_skills(
            detected_skills=skills_to_use,
            evidence_items=payload.evidence_items,
        )
        return response
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error associating evidence with skills: {str(e)}",
        )


@router.post(
    "/github",
    response_model=GitHubAnalysisResponse,
    summary="Analyze public GitHub repositories for candidate skill evidence",
    description=(
        "Fetches public repositories for a GitHub handle, identifies observable "
        "artifacts (primary language, topics, stars, forks), and generates EvidenceItem "
        "records supporting candidate skills without falsely claiming skill mastery."
    ),
)
def analyze_github_evidence(payload: GitHubAnalysisRequest):
    username = payload.username.strip()
    try:
        result = fetch_and_analyze_github_profile(username)
        return result
    except ValueError as val_err:
        err_msg = str(val_err)
        if "not found" in err_msg.lower():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=err_msg,
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=err_msg,
        )
    except RuntimeError as run_err:
        err_msg = str(run_err)
        if "rate limit" in err_msg.lower():
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=err_msg,
            )
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=err_msg,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Unexpected error analyzing GitHub repositories: {str(e)}",
        )


@router.post(
    "/aggregate",
    response_model=EvidenceAggregationResponse,
    summary="Aggregate claimed resume skills with all evidence artifacts",
    description=(
        "Combines candidate claimed skills with all provided EvidenceItem artifacts, "
        "computes deterministic, explainable confidence ratings using diminishing returns, "
        "and enforces certification dampening without claiming mastery."
    ),
)
def aggregate_evidence(payload: EvidenceAggregationRequest):
    try:
        response = aggregate_evidence_for_skills(
            claimed_skills=payload.claimed_skills,
            evidence_items=payload.evidence_items,
        )
        return response
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error aggregating skill evidence: {str(e)}",
        )
