import os
import sys
import unittest
import urllib.error
from unittest.mock import patch, MagicMock

# Ensure ai-service root is in Python module search path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from models.evidence import EvidenceType, EvidenceStrength
from services.github_service import (
    validate_github_username,
    fetch_github_user_repositories,
    analyze_github_repositories,
    fetch_and_analyze_github_profile,
)


class TestGitHubEvidenceService(unittest.TestCase):
    """
    Test suite for the GitHub evidence analysis service using mocked API responses.
    No live network calls are made.
    """

    def setUp(self):
        """Sample mock repository payloads resembling GitHub REST API v3 responses."""
        self.mock_repos = [
            {
                "name": "profiq-ai",
                "html_url": "https://github.com/alexdev/profiq-ai",
                "description": "AI-powered employability analyzer built with FastAPI and Docker",
                "language": "Python",
                "topics": ["fastapi", "machine-learning", "docker"],
                "stargazers_count": 14,
                "forks_count": 5,
                "updated_at": "2026-09-10T12:00:00Z",
                "fork": False,
            },
            {
                "name": "react-placement-portal",
                "html_url": "https://github.com/alexdev/react-placement-portal",
                "description": "Student placement dashboard created in React and TypeScript",
                "language": "TypeScript",
                "topics": ["react", "tailwindcss"],
                "stargazers_count": 3,
                "forks_count": 1,
                "updated_at": "2026-08-25T15:30:00Z",
                "fork": False,
            },
        ]

    def test_1_valid_user_with_repositories(self):
        """
        Verify that observable repository information is parsed, EvidenceItems
        are produced, and skills are extracted cleanly from languages/topics/descriptions.
        """
        with patch("services.github_service.fetch_github_user_repositories", return_value=self.mock_repos):
            result = fetch_and_analyze_github_profile("alexdev")

        self.assertEqual(result.username, "alexdev")
        self.assertEqual(result.repositories_analyzed, 2)
        self.assertEqual(len(result.observed_repositories), 2)
        self.assertEqual(len(result.generated_evidence_items), 2)

        # Check observed facts for first repo
        repo1 = result.observed_repositories[0]
        self.assertEqual(repo1.name, "profiq-ai")
        self.assertEqual(repo1.primary_language, "Python")
        self.assertEqual(repo1.stars, 14)
        self.assertEqual(repo1.forks, 5)
        self.assertFalse(repo1.is_fork)

        # Check generated EvidenceItem
        ev1 = result.generated_evidence_items[0]
        self.assertEqual(ev1.evidence_type, EvidenceType.GITHUB_REPOSITORY)
        self.assertEqual(ev1.source, "GitHub")
        self.assertIn("Python", ev1.related_skills)
        self.assertIn("FastAPI", ev1.related_skills)
        self.assertIn("Docker", ev1.related_skills)
        self.assertIn("Machine Learning", ev1.related_skills)

        # Invariant: Stars and forks yield strong evidence, but confidence < 1.0
        self.assertEqual(ev1.evidence_strength, EvidenceStrength.STRONG)
        self.assertGreaterEqual(ev1.confidence, 0.80)
        self.assertLess(ev1.confidence, 1.0)

        # Check supported skills summary
        supported_names = {s.skill_name for s in result.skills_supported_by_github}
        self.assertIn("Python", supported_names)
        self.assertIn("FastAPI", supported_names)
        self.assertIn("React", supported_names)
        self.assertIn("TypeScript", supported_names)

    def test_2_invalid_username_handling(self):
        """
        Verify that invalid usernames fail validation before making any API request.
        """
        invalid_usernames = ["", "   ", "-starts-with-hyphen", "ends-with-hyphen-", "user name with spaces", "a" * 40]
        for uname in invalid_usernames:
            self.assertFalse(validate_github_username(uname))
            with self.assertRaises(ValueError):
                fetch_github_user_repositories(uname)

    @patch("urllib.request.urlopen")
    def test_3_user_not_found_404(self, mock_urlopen):
        """
        Verify that a 404 response from GitHub is caught and raised as a clean ValueError.
        """
        http_error = urllib.error.HTTPError(
            url="https://api.github.com/users/nonexistentuser/repos",
            code=404,
            msg="Not Found",
            hdrs={},
            fp=None,
        )
        mock_urlopen.side_effect = http_error

        with self.assertRaises(ValueError) as ctx:
            fetch_github_user_repositories("nonexistentuser")

        self.assertIn("not found", str(ctx.exception).lower())

    @patch("urllib.request.urlopen")
    def test_4_rate_limit_exceeded_403(self, mock_urlopen):
        """
        Verify that a rate limit HTTP 403 is caught and reported informatively.
        """
        mock_fp = MagicMock()
        mock_fp.read.return_value = b'{"message": "API rate limit exceeded for IP"}'

        http_error = urllib.error.HTTPError(
            url="https://api.github.com/users/octocat/repos",
            code=403,
            msg="Forbidden",
            hdrs={"X-RateLimit-Remaining": "0"},
            fp=mock_fp,
        )
        mock_urlopen.side_effect = http_error

        with self.assertRaises(RuntimeError) as ctx:
            fetch_github_user_repositories("octocat")

        self.assertIn("rate limit", str(ctx.exception).lower())

    def test_5_empty_repository_list(self):
        """
        Verify that a user with 0 public repositories returns a clean empty response.
        """
        result = analyze_github_repositories("emptyuser", [])

        self.assertEqual(result.username, "emptyuser")
        self.assertEqual(result.repositories_analyzed, 0)
        self.assertEqual(result.observed_repositories, [])
        self.assertEqual(result.generated_evidence_items, [])
        self.assertEqual(result.skills_supported_by_github, [])
        self.assertIn("does not prove", result.evidence_disclaimer.lower())

    def test_6_forked_repository_handling(self):
        """
        Verify that forked repositories receive weaker evidence strength and lower confidence
        because they do not demonstrate sole original authorship.
        """
        forked_repo = [
            {
                "name": "forked-repo",
                "html_url": "https://github.com/alexdev/forked-repo",
                "description": "A fork of a Go project",
                "language": "Go",
                "topics": [],
                "stargazers_count": 0,
                "forks_count": 0,
                "updated_at": "2026-09-01T10:00:00Z",
                "fork": True,  # Forked
            }
        ]
        result = analyze_github_repositories("alexdev", forked_repo)
        ev = result.generated_evidence_items[0]

        self.assertTrue(ev.metadata["is_fork"])
        self.assertEqual(ev.evidence_strength, EvidenceStrength.WEAK)
        self.assertLessEqual(ev.confidence, 0.50)

    def test_7_no_mastery_claim_and_disclaimer(self):
        """
        Verify that the output never claims 100% mastery and includes an explicit disclaimer.
        """
        result = analyze_github_repositories("alexdev", self.mock_repos)

        for ev in result.generated_evidence_items:
            # Confidence must never be 1.0 (no absolute mastery claim)
            self.assertLess(ev.confidence, 1.0)

        # Disclaimer must state evidence supports claims but does not prove mastery
        self.assertIn("does not prove", result.evidence_disclaimer.lower())


if __name__ == "__main__":
    unittest.main()
