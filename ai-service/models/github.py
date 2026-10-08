"""
GitHub Evidence Models

Data models for representing observed GitHub repository data,
inferred skill support, and API request/response structures.
"""

from typing import Any, Dict, List, Optional
from models.evidence import EvidenceItem

try:
    from pydantic import BaseModel, Field
    HAS_PYDANTIC = True
except ImportError:
    HAS_PYDANTIC = False


if HAS_PYDANTIC:

    class GitHubAnalysisRequest(BaseModel):
        """Request payload containing the GitHub username to analyze."""
        username: str = Field(
            ...,
            description="Public GitHub username",
            examples=["torvalds", "octocat"],
            min_length=1,
            max_length=39,
        )

    class ObservedRepository(BaseModel):
        """Observed public repository facts directly from GitHub API."""
        name: str
        url: str
        description: Optional[str] = None
        primary_language: Optional[str] = None
        topics: List[str] = Field(default_factory=list)
        stars: int = 0
        forks: int = 0
        updated_at: Optional[str] = None
        is_fork: bool = False

    class SupportedSkillSummary(BaseModel):
        """Summary of a skill supported by GitHub repository artifacts."""
        skill_name: str
        category: str
        evidence_count: int
        highest_strength: str
        highest_confidence: float
        supporting_repositories: List[str] = Field(default_factory=list)

    class GitHubAnalysisResponse(BaseModel):
        """Structured response returned by the GitHub evidence analyzer."""
        username: str
        repositories_analyzed: int
        observed_repositories: List[ObservedRepository]
        generated_evidence_items: List[EvidenceItem]
        skills_supported_by_github: List[SupportedSkillSummary]
        evidence_disclaimer: str

else:

    class GitHubAnalysisRequest:
        def __init__(self, username: str, **kwargs):
            self.username = username

    class ObservedRepository:
        def __init__(
            self,
            name: str,
            url: str,
            description: Optional[str] = None,
            primary_language: Optional[str] = None,
            topics: Optional[List[str]] = None,
            stars: int = 0,
            forks: int = 0,
            updated_at: Optional[str] = None,
            is_fork: bool = False,
            **kwargs,
        ):
            self.name = name
            self.url = url
            self.description = description
            self.primary_language = primary_language
            self.topics = list(topics) if topics is not None else []
            self.stars = stars
            self.forks = forks
            self.updated_at = updated_at
            self.is_fork = is_fork

        def model_dump(self) -> dict:
            return {
                "name": self.name,
                "url": self.url,
                "description": self.description,
                "primary_language": self.primary_language,
                "topics": self.topics,
                "stars": self.stars,
                "forks": self.forks,
                "updated_at": self.updated_at,
                "is_fork": self.is_fork,
            }

    class SupportedSkillSummary:
        def __init__(
            self,
            skill_name: str,
            category: str,
            evidence_count: int,
            highest_strength: str,
            highest_confidence: float,
            supporting_repositories: Optional[List[str]] = None,
            **kwargs,
        ):
            self.skill_name = skill_name
            self.category = category
            self.evidence_count = evidence_count
            self.highest_strength = highest_strength
            self.highest_confidence = float(highest_confidence)
            self.supporting_repositories = list(supporting_repositories) if supporting_repositories is not None else []

        def model_dump(self) -> dict:
            return {
                "skill_name": self.skill_name,
                "category": self.category,
                "evidence_count": self.evidence_count,
                "highest_strength": self.highest_strength,
                "highest_confidence": self.highest_confidence,
                "supporting_repositories": self.supporting_repositories,
            }

    class GitHubAnalysisResponse:
        def __init__(
            self,
            username: str,
            repositories_analyzed: int,
            observed_repositories: List[ObservedRepository],
            generated_evidence_items: List[EvidenceItem],
            skills_supported_by_github: List[SupportedSkillSummary],
            evidence_disclaimer: str,
            **kwargs,
        ):
            self.username = username
            self.repositories_analyzed = repositories_analyzed
            self.observed_repositories = list(observed_repositories)
            self.generated_evidence_items = list(generated_evidence_items)
            self.skills_supported_by_github = list(skills_supported_by_github)
            self.evidence_disclaimer = evidence_disclaimer

        def model_dump(self) -> dict:
            return {
                "username": self.username,
                "repositories_analyzed": self.repositories_analyzed,
                "observed_repositories": [
                    r.model_dump() if hasattr(r, "model_dump") else r
                    for r in self.observed_repositories
                ],
                "generated_evidence_items": [
                    e.model_dump() if hasattr(e, "model_dump") else e
                    for e in self.generated_evidence_items
                ],
                "skills_supported_by_github": [
                    s.model_dump() if hasattr(s, "model_dump") else s
                    for s in self.skills_supported_by_github
                ],
                "evidence_disclaimer": self.evidence_disclaimer,
            }
