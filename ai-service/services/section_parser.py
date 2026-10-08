"""
Resume Section Parser

Splits cleaned resume text into distinct logical sections
(skills, projects, experience, education, certifications, other)
to track where skills are mentioned.
"""

import re

# Standard section header patterns mapped to canonical section labels
SECTION_PATTERNS = [
    (
        "skills section",
        re.compile(
            r"^\s*(?:[\#\*\-]+\s*)?(?:technical\s+|key\s+|core\s+)?(?:skills|competencies|technologies|tech\s+stack|expertise|skills\s*(?:&|and)\s*tools)(?:\s*[\:\-\#\*]*)\s*$",
            re.IGNORECASE,
        ),
    ),
    (
        "projects section",
        re.compile(
            r"^\s*(?:[\#\*\-]+\s*)?(?:key\s+|personal\s+|academic\s+|selected\s+)?projects(?:\s*work)?(?:\s*[\:\-\#\*]*)\s*$",
            re.IGNORECASE,
        ),
    ),
    (
        "experience section",
        re.compile(
            r"^\s*(?:[\#\*\-]+\s*)?(?:work\s+|professional\s+|employment\s+)?(?:experience|history|internships|employment)(?:\s*[\:\-\#\*]*)\s*$",
            re.IGNORECASE,
        ),
    ),
    (
        "education section",
        re.compile(
            r"^\s*(?:[\#\*\-]+\s*)?(?:education|academic\s+background|academics|qualifications)(?:\s*[\:\-\#\*]*)\s*$",
            re.IGNORECASE,
        ),
    ),
    (
        "certifications section",
        re.compile(
            r"^\s*(?:[\#\*\-]+\s*)?(?:certifications|certificates|licenses(?:\s*(?:&|and)\s*certifications)?)(?:\s*[\:\-\#\*]*)\s*$",
            re.IGNORECASE,
        ),
    ),
]


def identify_section_header(line: str) -> str | None:
    """Checks if a single line matches any known resume section header."""
    stripped = line.strip()
    # Section headers are almost always concise (< 50 chars)
    if not stripped or len(stripped) > 50:
        return None

    for section_name, pattern in SECTION_PATTERNS:
        if pattern.match(stripped):
            return section_name
    return None


def parse_resume_sections(text: str) -> list[dict]:
    """
    Splits resume text into labeled sections.
    
    Returns a list of dictionaries:
        [
            {"section": "other", "text": "Header contact info..."},
            {"section": "skills section", "text": "Python, React..."},
            {"section": "experience section", "text": "Built apps..."},
            {"section": "projects section", "text": "Created ML model..."},
        ]
    """
    if not text:
        return []

    lines = text.split("\n")
    sections: list[dict] = []

    current_section = "other"
    current_lines: list[str] = []

    for line in lines:
        detected_header = identify_section_header(line)
        if detected_header:
            # Save accumulated content of previous section
            if current_lines:
                section_text = "\n".join(current_lines).strip()
                if section_text:
                    sections.append({
                        "section": current_section,
                        "text": section_text,
                    })
                current_lines = []
            current_section = detected_header
        else:
            current_lines.append(line)

    # Append trailing section
    if current_lines:
        section_text = "\n".join(current_lines).strip()
        if section_text:
            sections.append({
                "section": current_section,
                "text": section_text,
            })

    # Fallback if no specific section was detected at all
    if not sections and text.strip():
        sections.append({"section": "other", "text": text.strip()})

    return sections
