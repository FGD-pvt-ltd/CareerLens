"""
Skill Extraction Service

Extracts canonical skills from resume text using normalized matching,
section tracking, and variation resolution.
"""

import re
from config.skills_dictionary import SKILL_DEFINITIONS
from services.section_parser import parse_resume_sections


def _build_regex_for_alias(alias: str) -> re.Pattern:
    """
    Builds a boundary-safe compiled regex for a given alias string.
    Accounts for symbols (+, #, ., /) that standard \\b does not handle cleanly.
    """
    # Normalize internal spaces to allow arbitrary whitespace in multi-word aliases
    words = alias.strip().split()
    escaped_words = [re.escape(w) for w in words]
    pattern_core = r"\s+".join(escaped_words)

    # Use boundary assertions that don't depend solely on \\w
    # Preceded by non-alphanumeric or start of string
    # Followed by non-alphanumeric or end of string (with special handling for +, #)
    first_char = alias[0]
    last_char = alias[-1]

    # Prefix boundary
    if first_char.isalnum():
        prefix = r"(?<![a-zA-Z0-9])"
    else:
        prefix = r"(?<!\S)"

    # Suffix boundary
    if last_char == "+":
        suffix = r"(?![a-zA-Z0-9\+])"
    elif last_char == "#":
        suffix = r"(?![a-zA-Z0-9\#])"
    elif last_char.isalnum():
        suffix = r"(?![a-zA-Z0-9\+#/])"
    else:
        suffix = r"(?!\S)"

    # Single-character uppercase aliases (e.g. 'C') require case-sensitive matching
    # to avoid false positives on standalone lowercase letters (e.g. 'section c', 'option c')
    flags = 0 if (len(alias) == 1 and alias.isupper()) else re.IGNORECASE
    full_pattern = f"{prefix}{pattern_core}{suffix}"
    return re.compile(full_pattern, flags)


# Precompile all skill alias patterns once at module load
_COMPILED_SKILLS: list[dict] = []
for skill in SKILL_DEFINITIONS:
    canonical_name = skill["name"]
    category = skill["category"]
    # Sort aliases longest-first to prioritize specific phrases (e.g. "python 3" before "python")
    sorted_aliases = sorted(skill["aliases"], key=len, reverse=True)
    compiled_aliases = [
        (alias, _build_regex_for_alias(alias)) for alias in sorted_aliases
    ]
    _COMPILED_SKILLS.append({
        "name": canonical_name,
        "category": category,
        "aliases": compiled_aliases,
    })


# ---------------------------------------------------------------------------
# Deterministic Negation & Intent Filtering
# ---------------------------------------------------------------------------

_CLAUSE_BOUNDARY = re.compile(
    r"[\n\r.!?;\u2022\-]|\b(?:but|however|although|though|yet|except|whereas|while|nevertheless)\b",
    re.IGNORECASE,
)

_PREFIX_NEGATION_PATTERNS = [
    # Direct "no" + experience/knowledge/background/exposure/skills
    re.compile(
        r"\bno\s+(?:(?:prior|previous|formal|practical|hands[- ]on|real[- ]world|direct)\s+)?"
        r"(?:experience|knowledge|background|exposure|training|skills?)\s+(?:in|with|using|to|of)\s*$",
        re.IGNORECASE,
    ),
    # Coordinated "no experience in X, Y or Z"
    re.compile(
        r"\bno\s+(?:(?:prior|previous|formal|practical|hands[- ]on|real[- ]world|direct)\s+)?"
        r"(?:experience|knowledge|background|exposure|training|skills?)\s+(?:in|with|using|to|of)\s+"
        r"[^.!?;\n\r]+?(?:,|or|nor|and)\s*$",
        re.IGNORECASE,
    ),
    # Immediate "no <skill>"
    re.compile(r"\bno\s*$", re.IGNORECASE),
    # "have/has/had not learned/worked with/used/etc."
    re.compile(
        r"\b(?:have|has|had|do|does|did)\s+not\s+(?:yet\s+)?"
        r"(?:learned|learnt|studied|used|worked\s+with|touched|coded\s+in|programmed\s+in|built\s+with|acquired|mastered|known|had\s+(?:any\s+)?experience\s+(?:in|with))\s*$",
        re.IGNORECASE,
    ),
    # Contraction forms: "haven't / hasn't / hadn't / didn't / don't / doesn't"
    re.compile(
        r"\b(?:haven't|hasn't|hadn't|don't|doesn't|didn't)\s+(?:yet\s+)?"
        r"(?:learned|learnt|studied|used|worked\s+with|touched|coded\s+in|programmed\s+in|built\s+with|acquired|mastered|known|had\s+(?:any\s+)?experience\s+(?:in|with))\s*$",
        re.IGNORECASE,
    ),
    # Coordinated negative verb phrases: "haven't learned X or Y"
    re.compile(
        r"\b(?:haven't|hasn't|hadn't|have\s+not|has\s+not|had\s+not)\s+(?:yet\s+)?"
        r"(?:learned|learnt|studied|used|worked\s+with|touched)\s+[^.!?;\n\r]+?(?:,|or|nor|and)\s*$",
        re.IGNORECASE,
    ),
    # "never used / worked with / learned / etc."
    re.compile(
        r"\bnever\s+(?:used|worked\s+with|learned|learnt|studied|touched|coded\s+in|programmed\s+in|built\s+(?:with|any)?|had\s+(?:any\s+)?(?:experience|projects?|background)\s+(?:in|with))\s*$",
        re.IGNORECASE,
    ),
    # Coordinated never: "never used X or Y"
    re.compile(
        r"\bnever\s+(?:used|worked\s+with|learned|learnt|touched)\s+[^.!?;\n\r]+?(?:,|or|nor|and)\s*$",
        re.IGNORECASE,
    ),
    # "0 / zero experience/projects in"
    re.compile(
        r"\b(?:0|zero)\s+(?:years?\s+of\s+)?(?:experience|projects?|knowledge|background)\s+(?:in|with|using|of)\s*$",
        re.IGNORECASE,
    ),
    # "without experience in/with"
    re.compile(
        r"\bwithout\s+(?:(?:any|prior|previous)\s+)?(?:experience|knowledge|background|training)\s+(?:in|with|using|of)\s*$",
        re.IGNORECASE,
    ),
    # Immediate "without"
    re.compile(r"\bwithout\s+(?:any\s+)?$", re.IGNORECASE),
    # "lack of experience / lacking knowledge"
    re.compile(
        r"\b(?:lack|lacks|lacking)\s+(?:of\s+)?(?:(?:prior|previous|hands[- ]on)\s+)?(?:experience|knowledge|skills?)\s+(?:in|with|of)\s*$",
        re.IGNORECASE,
    ),
    # "not experienced in / not familiar with"
    re.compile(
        r"\bnot\s+(?:experienced|skilled|proficient|versed|familiar)\s+(?:in|with)\s*$",
        re.IGNORECASE,
    ),
    re.compile(
        r"\bnot\s+(?:having\s+)?(?:any\s+)?(?:experience|knowledge)\s+(?:in|with|of)\s*$",
        re.IGNORECASE,
    ),
    # "little to no / minimal to no"
    re.compile(
        r"\b(?:little\s+to\s+no|minimal\s+to\s+no|almost\s+no)\s+(?:experience\s+(?:in|with)\s+)?$",
        re.IGNORECASE,
    ),
    # Intent / aspirational non-claims: "want to become a/an", "aspire to become"
    re.compile(
        r"\b(?:want|wants|hoping|hope|hopes|aiming|aim|aims|aspiring|aspire|aspires|seeking|seek|seeks|looking|planning|plan|plans|wish|wishes)\s+to\s+(?:become|be|work\s+as)\s+(?:a|an|the)?\s*$",
        re.IGNORECASE,
    ),
    # "want to learn / hoping to learn"
    re.compile(
        r"\b(?:want|wants|hoping|hope|hopes|aiming|aim|aims|aspiring|aspire|aspires|seeking|seek|seeks|looking|planning|plan|plans|wish|wishes)\s+to\s+(?:learn|study|master)\s*$",
        re.IGNORECASE,
    ),
    # "interested in learning / eager to learn / yet to learn"
    re.compile(
        r"\b(?:interested\s+in|eager\s+to|planning\s+to|looking\s+to|yet\s+to|need\s+to)\s+(?:learn|study|master)\s*$",
        re.IGNORECASE,
    ),
    # Career objective / target role
    re.compile(
        r"\b(?:target\s+role|target\s+position|career\s+objective|career\s+goal|job\s+target)\s*:\s*(?:become\s+(?:a|an)?\s*)?$",
        re.IGNORECASE,
    ),
]

_SANDWICH_PRE_PATTERNS = [
    re.compile(r"\b(?:have|has|had)\s+no\s*$", re.IGNORECASE),
    re.compile(r"\bno\s*$", re.IGNORECASE),
    re.compile(r"\b(?:0|zero)\s*$", re.IGNORECASE),
    re.compile(r"\bwithout\s+(?:any\s+)?$", re.IGNORECASE),
    re.compile(r"\bnever\s+(?:built|done|had|developed|created|worked\s+on)\s+(?:any\s+)?$", re.IGNORECASE),
    re.compile(r"\b(?:haven't|have\s+not|hadn't|had\s+not)\s+(?:done|built|worked\s+on|completed)\s+(?:any\s+)?$", re.IGNORECASE),
    re.compile(r"\blittle\s+to\s+no\s*$", re.IGNORECASE),
]

_SANDWICH_POST_PATTERN = re.compile(
    r"^\s*(?:projects?|problems?|questions?|experience|background|skills?|knowledge|exposure|work|repos?|repositories)\b",
    re.IGNORECASE,
)

_SUFFIX_NEGATION_PATTERNS = [
    re.compile(r"^\s*(?::\s*|\s+is\s+)?(?:none|zero|0|nil|n/a|no\s+experience)\b", re.IGNORECASE),
    re.compile(r"^\s*experience\s*(?::\s*|\s+is\s+)(?:none|zero|0|nil|n/a)\b", re.IGNORECASE),
]


def is_negated_mention(text: str, match_start: int, match_end: int) -> bool:
    """
    Deterministic check to detect if a skill mention in text is negated
    or expresses target-role / aspirational intent rather than a positive claim.
    
    Checks:
    1. Prefix negation patterns within the current clause (e.g. 'no experience with <skill>').
    2. Sandwich negation patterns (e.g. 'no <skill> projects', '0 <skill> problems').
    3. Suffix negation patterns (e.g. '<skill>: none', '<skill> experience: 0').
    4. Target role / learning intent (e.g. 'want to become an <role>', 'want to learn <skill>').
    """
    pre_window = text[max(0, match_start - 150):match_start]
    boundaries = [m.end() for m in _CLAUSE_BOUNDARY.finditer(pre_window)]
    clause_pre = pre_window[boundaries[-1]:] if boundaries else pre_window

    post_window = text[match_end:min(len(text), match_end + 100)]
    next_bound = _CLAUSE_BOUNDARY.search(post_window)
    clause_post = post_window[:next_bound.start()] if next_bound else post_window

    # 1. Prefix negation & intent cues
    for pat in _PREFIX_NEGATION_PATTERNS:
        if pat.search(clause_pre):
            return True

    # 2. Sandwich negation (negation word before + noun after)
    if _SANDWICH_POST_PATTERN.search(clause_post):
        for pat in _SANDWICH_PRE_PATTERNS:
            if pat.search(clause_pre):
                return True

    # 3. Suffix negation (immediate zero/none indicator after)
    for pat in _SUFFIX_NEGATION_PATTERNS:
        if pat.search(clause_post):
            return True

    return False


def extract_skills_from_text(resume_text: str) -> dict:
    """
    Extracts and normalizes skills from cleaned resume text.
    
    Args:
        resume_text: String containing the plain text extracted from a resume.
        
    Returns:
        Structured dictionary distinguishing detected claims from verified evidence:
        {
            "total_detected_skills": int,
            "skills_detected_in_resume": [
                {
                    "name": "Python",
                    "category": "Programming Languages",
                    "found_in": "skills section, projects section",
                    "sections": ["skills section", "projects section"],
                    "detection_type": "claimed_in_resume",
                    "verification_status": "unverified",
                    "evidence_sources": [],
                    "matched_terms": ["Python 3", "Python"]
                }, ...
            ],
            "skills_verified_by_evidence": [],
            "categories_summary": { ... },
            "verification_note": "..."
        }
    """
    if not resume_text or not resume_text.strip():
        return {
            "total_detected_skills": 0,
            "skills_detected_in_resume": [],
            "skills_verified_by_evidence": [],
            "categories_summary": {},
            "verification_note": (
                "No text provided. Skills cannot be extracted from empty content."
            ),
        }

    # 1. Parse text into logical resume sections
    sections = parse_resume_sections(resume_text)

    # 2. Track detected skills (keyed by canonical name to eliminate duplicates)
    detected_map: dict[str, dict] = {}

    for section_info in sections:
        section_name = section_info["section"]
        section_text = section_info["text"]

        for skill in _COMPILED_SKILLS:
            canonical_name = skill["name"]
            category = skill["category"]

            matched_in_section = False
            for alias_text, pattern in skill["aliases"]:
                for match in pattern.finditer(section_text):
                    if not is_negated_mention(section_text, match.start(), match.end()):
                        matched_slice = match.group(0).strip()

                        if canonical_name not in detected_map:
                            detected_map[canonical_name] = {
                                "name": canonical_name,
                                "category": category,
                                "sections": [section_name],
                                "matched_terms": [matched_slice],
                            }
                        else:
                            existing = detected_map[canonical_name]
                            if section_name not in existing["sections"]:
                                existing["sections"].append(section_name)
                            if matched_slice not in existing["matched_terms"]:
                                existing["matched_terms"].append(matched_slice)

                        matched_in_section = True
                        break
                if matched_in_section:
                    break

    # 3. Format detected skills according to specification
    skills_detected: list[dict] = []
    categories_summary: dict[str, int] = {}

    # Sort deterministically by category then name
    sorted_skills = sorted(
        detected_map.values(),
        key=lambda item: (item["category"], item["name"]),
    )

    for item in sorted_skills:
        cat = item["category"]
        categories_summary[cat] = categories_summary.get(cat, 0) + 1

        skills_detected.append({
            "name": item["name"],
            "category": item["category"],
            "found_in": ", ".join(item["sections"]),
            "sections": item["sections"],
            "detection_type": "claimed_in_resume",
            "verification_status": "unverified",
            "evidence_sources": [],
            "matched_terms": item["matched_terms"],
        })

    return {
        "total_detected_skills": len(skills_detected),
        "skills_detected_in_resume": skills_detected,
        "skills_verified_by_evidence": [],
        "categories_summary": categories_summary,
        "verification_note": (
            "Skills listed here are detected as claims made in the resume text only. "
            "Verification against external evidence (e.g. GitHub repositories, code artifacts, "
            "or assessments) has not been performed at this stage."
        ),
    }
