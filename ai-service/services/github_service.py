"""
GitHub Evidence Service

Fetches public repository data from the official GitHub REST API,
analyzes observable repository metadata (language, topics, description),
and produces standardized EvidenceItem objects without claiming mastery.
"""

import json
import os
import re
import urllib.error
import urllib.request
from typing import Any, Dict, List, Optional, Tuple

from config.skills_dictionary import SKILL_DEFINITIONS
from models.evidence import EvidenceItem, EvidenceStrength, EvidenceType
from models.github import (
    GitHubAnalysisResponse,
    ObservedRepository,
    SupportedSkillSummary,
)
from services.evidence_service import _resolve_canonical_skill

GITHUB_API_BASE = "https://api.github.com"
GITHUB_USER_AGENT = "ProfiQ-AI-Service/1.0"

# Standard GitHub username validation pattern:
# - Alphanumeric with single hyphens
# - Cannot start or end with a hyphen
# - 1 to 39 characters
USERNAME_REGEX = re.compile(r"^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$")

# Precompile skill alias patterns for description scanning
_COMPILED_SKILL_PATTERNS: List[Tuple[str, str, re.Pattern]] = []
for skill in SKILL_DEFINITIONS:
    canonical = skill["name"]
    category = skill["category"]
    for alias in skill["aliases"]:
        words = alias.strip().split()
        core = r"\s+".join(re.escape(w) for w in words)
        first_char = alias[0]
        last_char = alias[-1]
        prefix = r"(?<![a-zA-Z0-9])" if first_char.isalnum() else r"(?<!\S)"
        if last_char == "+":
            suffix = r"(?![a-zA-Z0-9\+])"
        elif last_char == "#":
            suffix = r"(?![a-zA-Z0-9\#])"
        elif last_char.isalnum():
            suffix = r"(?![a-zA-Z0-9\+#/])"
        else:
            suffix = r"(?!\S)"
        flags = 0 if (len(alias) == 1 and alias.isupper()) else re.IGNORECASE
        pattern = re.compile(f"{prefix}{core}{suffix}", flags)
        _COMPILED_SKILL_PATTERNS.append((canonical, category, pattern))


def validate_github_username(username: str) -> bool:
    """Validates that a string conforms to GitHub username syntax rules."""
    if not username or not isinstance(username, str):
        return False
    return bool(USERNAME_REGEX.match(username.strip()))


def fetch_github_user_repositories(
    username: str, token: Optional[str] = None
) -> List[Dict[str, Any]]:
    """
    Fetches public repositories for a given GitHub username.
    
    Args:
        username: GitHub handle to query.
        token: Optional GitHub Personal Access Token for higher rate limits.
        
    Returns:
        List of repository dictionaries returned by the GitHub API.
        
    Raises:
        ValueError: If username is invalid or user not found (404).
        RuntimeError: If rate limited (403) or API/network error occurs.
    """
    cleaned_user = username.strip()
    if not validate_github_username(cleaned_user):
        raise ValueError(
            f"Invalid GitHub username '{cleaned_user}'. Usernames must be 1-39 alphanumeric characters."
        )

    url = f"{GITHUB_API_BASE}/users/{cleaned_user}/repos?per_page=30&sort=updated"
    headers = {
        "User-Agent": GITHUB_USER_AGENT,
        "Accept": "application/vnd.github.v3+json",
    }

    # Use token if provided or present in environment
    active_token = token or os.getenv("GITHUB_TOKEN")
    if active_token:
        headers["Authorization"] = f"Bearer {active_token}"

    req = urllib.request.Request(url, headers=headers, method="GET")

    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            data = response.read().decode("utf-8")
            return json.loads(data)
    except urllib.error.HTTPError as err:
        if err.code == 404:
            raise ValueError(f"GitHub user '{cleaned_user}' not found.")
        elif err.code == 403:
            # Check rate limit headers or body
            error_body = ""
            try:
                error_body = err.read().decode("utf-8")
            except Exception:
                pass
            if "rate limit" in error_body.lower() or err.headers.get("X-RateLimit-Remaining") == "0":
                raise RuntimeError(
                    "GitHub API rate limit exceeded. Please configure GITHUB_TOKEN or try again later."
                )
            raise RuntimeError(f"GitHub API access forbidden (HTTP 403): {err.reason}")
        else:
            raise RuntimeError(f"GitHub API returned HTTP {err.code}: {err.reason}")
    except urllib.error.URLError as err:
        raise RuntimeError(f"Network error connecting to GitHub API: {str(err.reason)}")
    except Exception as err:
        raise RuntimeError(f"Unexpected error communicating with GitHub: {str(err)}")


def extract_skills_from_repository(repo: Dict[str, Any]) -> List[Tuple[str, str]]:
    """
    Analyzes observable repository data to identify supported skills:
    1. Primary language
    2. Repository topics
    3. Description keyword matches
    
    Returns a deduplicated list of (canonical_skill_name, category) tuples.
    """
    found_skills: Dict[str, str] = {}  # canonical_name -> category

    # 1. Primary language
    lang = repo.get("language")
    if lang:
        canonical_lang, category = _resolve_canonical_skill(lang)
        found_skills[canonical_lang] = category

    # 2. Repository topics
    topics = repo.get("topics") or []
    for topic in topics:
        normalized_topic = topic.replace("-", " ").strip()
        canonical_topic, category = _resolve_canonical_skill(normalized_topic)
        # Check if topic matched a known canonical skill (not just fallback)
        if category != "General Technical Skills" or normalized_topic.lower() in [s["name"].lower() for s in SKILL_DEFINITIONS]:
            found_skills[canonical_topic] = category

    # 3. Description keywords
    description = repo.get("description") or ""
    if description.strip():
        for canonical, category, pattern in _COMPILED_SKILL_PATTERNS:
            if canonical not in found_skills and pattern.search(description):
                found_skills[canonical] = category

    return [(k, v) for k, v in found_skills.items()]


def determine_repo_evidence_metrics(repo: Dict[str, Any], skill_count: int) -> Tuple[EvidenceStrength, float]:
    """
    Determines evidence strength and confidence for a repository.
    
    Rules enforced:
    - Never assigns 1.0 (a repo supports evidence, but does not prove mastery).
    - Original repos with stars or active usage receive higher confidence.
    - Forked repositories receive lower confidence (weak proof of individual authorship).
    """
    is_fork = bool(repo.get("fork", False))
    stars = int(repo.get("stargazers_count") or 0)
    forks = int(repo.get("forks_count") or 0)
    has_language = bool(repo.get("language"))

    if is_fork:
        # Forked repos provide weak authorship proof
        return EvidenceStrength.WEAK, 0.50

    # Original repository evaluation
    if (stars >= 10 or forks >= 5) and has_language:
        # Popular / validated project
        return EvidenceStrength.STRONG, 0.85
    elif (stars >= 2 or forks >= 1) and has_language:
        return EvidenceStrength.STRONG, 0.80
    elif has_language:
        # Standard personal public repo
        return EvidenceStrength.MODERATE, 0.70
    elif skill_count > 0:
        # Detected only via description or topics without confirmed primary language
        return EvidenceStrength.WEAK, 0.55
    else:
        return EvidenceStrength.WEAK, 0.40


def analyze_github_repositories(
    username: str, repos: List[Dict[str, Any]]
) -> GitHubAnalysisResponse:
    """
    Analyzes a list of repository dictionaries and generates standardized
    EvidenceItem objects and skill support summaries.
    """
    observed_repos: List[ObservedRepository] = []
    generated_evidence: List[EvidenceItem] = []
    skill_support_map: Dict[str, Dict[str, Any]] = {}

    for repo in repos:
        name = repo.get("name") or "unnamed-repo"
        url = repo.get("html_url") or f"https://github.com/{username}/{name}"
        desc = repo.get("description")
        lang = repo.get("language")
        topics = repo.get("topics") or []
        stars = int(repo.get("stargazers_count") or 0)
        forks = int(repo.get("forks_count") or 0)
        updated_at = repo.get("updated_at")
        is_fork = bool(repo.get("fork", False))

        observed = ObservedRepository(
            name=name,
            url=url,
            description=desc,
            primary_language=lang,
            topics=topics,
            stars=stars,
            forks=forks,
            updated_at=updated_at,
            is_fork=is_fork,
        )
        observed_repos.append(observed)

        # Identify skills supported by this repository
        skills_found = extract_skills_from_repository(repo)
        if not skills_found:
            continue

        skill_names = [s[0] for s in skills_found]
        strength, confidence = determine_repo_evidence_metrics(repo, len(skill_names))

        # Generate EvidenceItem
        lang_text = f"written primarily in {lang}" if lang else "code artifact"
        topics_str = f" Topics: {', '.join(topics)}." if topics else ""
        desc_text = f" Description: '{desc}'." if desc else ""
        evidence_description = (
            f"Public GitHub repository '{name}' {lang_text}.{topics_str}{desc_text}"
        )

        item = EvidenceItem(
            evidence_type=EvidenceType.GITHUB_REPOSITORY,
            title=f"GitHub: {name}",
            description=evidence_description,
            source="GitHub",
            url=url,
            related_skills=skill_names,
            evidence_strength=strength,
            confidence=confidence,
            metadata={
                "stars": stars,
                "forks": forks,
                "primary_language": lang,
                "topics": topics,
                "is_fork": is_fork,
                "updated_at": updated_at,
                "evidence_role": "supporting_evidence",
            },
        )
        generated_evidence.append(item)

        # Track skill support aggregation
        for canonical, category in skills_found:
            if canonical not in skill_support_map:
                skill_support_map[canonical] = {
                    "skill_name": canonical,
                    "category": category,
                    "evidence_count": 0,
                    "highest_strength": strength.value,
                    "highest_confidence": confidence,
                    "supporting_repositories": [],
                }

            entry = skill_support_map[canonical]
            entry["evidence_count"] += 1
            if name not in entry["supporting_repositories"]:
                entry["supporting_repositories"].append(name)
            if confidence > entry["highest_confidence"]:
                entry["highest_confidence"] = confidence
                entry["highest_strength"] = strength.value

    # Format supported skills list
    sorted_skills = sorted(
        skill_support_map.values(),
        key=lambda s: (s["category"], s["skill_name"]),
    )
    supported_summaries = [SupportedSkillSummary(**s) for s in sorted_skills]

    disclaimer = (
        "GitHub repository analysis provides observable artifact proof supporting a candidate's "
        "claimed skills. It demonstrates hands-on implementation and active code creation, but "
        "does not prove theoretical mastery or exhaustiveness."
    )

    return GitHubAnalysisResponse(
        username=username,
        repositories_analyzed=len(observed_repos),
        observed_repositories=observed_repos,
        generated_evidence_items=generated_evidence,
        skills_supported_by_github=supported_summaries,
        evidence_disclaimer=disclaimer,
    )


def fetch_and_analyze_github_profile(
    username: str, token: Optional[str] = None
) -> GitHubAnalysisResponse:
    """
    End-to-end workflow: queries public GitHub repositories and analyzes skill evidence.
    """
    repos = fetch_github_user_repositories(username, token=token)
    return analyze_github_repositories(username, repos)
