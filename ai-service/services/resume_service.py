import io
import re

try:
    from pypdf import PdfReader
    from pypdf.errors import PdfReadError
except ImportError:
    PdfReader = None
    PdfReadError = Exception


def clean_text(raw_text: str) -> str:
    """
    Cleans raw extracted text from a PDF.
    - Standardizes line breaks
    - Removes non-printable control characters
    - Collapses multiple blank lines
    - Trims leading and trailing whitespace
    """
    if not raw_text:
        return ""

    # Standardize newline characters
    text = raw_text.replace("\r\n", "\n").replace("\r", "\n")

    # Remove non-printable control characters (except newline and tab)
    text = re.sub(r"[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]", "", text)

    # Collapse 3 or more consecutive newlines into 2
    text = re.sub(r"\n{3,}", "\n\n", text)

    return text.strip()


def extract_text_from_pdf(file_bytes: bytes) -> dict:
    """
    Extracts readable plain text from PDF file bytes.
    
    Returns a dictionary containing:
        - text: Cleaned extracted text string
        - page_count: Number of pages in the PDF
        - character_count: Total characters in the cleaned text
        - has_text: Boolean indicating whether readable text was found
    
    Raises:
        ValueError: If file is empty, not a valid PDF, or unreadable.
    """
    if not file_bytes:
        raise ValueError("The provided PDF file is empty.")

    # Validate PDF signature (PDF files begin with %PDF)
    if not file_bytes.startswith(b"%PDF"):
        raise ValueError("The provided file does not appear to be a valid PDF document.")

    if PdfReader is None:
        raise RuntimeError(
            "The 'pypdf' package is not installed. "
            "Please install it using: pip install pypdf"
        )

    try:
        pdf_stream = io.BytesIO(file_bytes)
        reader = PdfReader(pdf_stream)

        # Check for encrypted or password-protected PDFs
        if reader.is_encrypted:
            try:
                # Attempt empty password decrypt (common for viewable protected PDFs)
                reader.decrypt("")
            except Exception:
                raise ValueError("The PDF is password protected or encrypted and cannot be read.")

        page_count = len(reader.pages)
        if page_count == 0:
            raise ValueError("The PDF document contains no pages.")

        extracted_pages = []
        for index, page in enumerate(reader.pages):
            page_text = page.extract_text() or ""
            extracted_pages.append(page_text)

        raw_combined = "\n\n".join(extracted_pages)
        cleaned = clean_text(raw_combined)

        return {
            "text": cleaned,
            "page_count": page_count,
            "character_count": len(cleaned),
            "has_text": len(cleaned) > 0,
        }

    except PdfReadError as e:
        raise ValueError(f"Unable to parse corrupted or invalid PDF: {str(e)}")
    except Exception as e:
        if isinstance(e, ValueError):
            raise
        raise ValueError(f"Error while processing PDF file: {str(e)}")
