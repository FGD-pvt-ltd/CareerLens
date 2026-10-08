from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

from services.skill_extractor import extract_skills_from_text

router = APIRouter()


class SkillExtractionRequest(BaseModel):
    text: str = Field(
        ...,
        description="Cleaned resume text to extract skills from",
        min_length=1,
        examples=[
            "TECHNICAL SKILLS\nPython 3, React.js, Node.js, Docker, MongoDB\n\n"
            "PROJECTS\nCareerLens: Built with FastAPI and Machine Learning algorithms."
        ],
    )


@router.post(
    "/extract",
    summary="Extract skills from resume text",
    description=(
        "Accepts cleaned resume text, identifies claimed skills across categories "
        "using normalized dictionary matching, tracks where each skill was mentioned, "
        "and marks them as unverified claims."
    ),
)
def extract_skills(payload: SkillExtractionRequest):
    cleaned_input = payload.text.strip()
    if not cleaned_input:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Resume text cannot be empty or contain only whitespace.",
        )

    try:
        result = extract_skills_from_text(cleaned_input)
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred during skill extraction: {str(e)}",
        )
