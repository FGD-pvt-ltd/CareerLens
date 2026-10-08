from fastapi import APIRouter, File, HTTPException, UploadFile, status

from services.resume_service import extract_text_from_pdf

router = APIRouter()


@router.post(
    "/extract-text",
    summary="Extract text from PDF resume",
    description="Accepts a PDF resume file, validates it, and extracts clean, readable text.",
)
async def extract_resume_text(
    file: UploadFile = File(..., description="PDF resume file to extract text from")
):
    # 1. Validate file format by filename extension
    filename = file.filename or ""
    if not filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file format. Only PDF files (.pdf) are supported.",
        )

    # 2. Read file contents into memory
    try:
        file_bytes = await file.read()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to read uploaded file: {str(e)}",
        )

    # 3. Check for empty file
    if len(file_bytes) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty.",
        )

    # 4. Extract text using the modular resume service
    try:
        extraction_result = extract_text_from_pdf(file_bytes)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e),
        )
    except RuntimeError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred while parsing the resume: {str(e)}",
        )

    # 5. Build response payload
    response_data = {
        "success": True,
        "filename": filename,
        "page_count": extraction_result["page_count"],
        "character_count": extraction_result["character_count"],
        "has_text": extraction_result["has_text"],
        "text": extraction_result["text"],
    }

    if not extraction_result["has_text"]:
        response_data["warning"] = (
            "No extractable text found in this PDF. The document may be scanned or image-based."
        )

    return response_data
