import os
import sys
import unittest

# Ensure ai-service root is in Python module search path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from models.evidence import EvidenceItem, EvidenceStrength, EvidenceType
from services.evidence_aggregator import aggregate_evidence_for_skills


class TestEvidenceAggregator(unittest.TestCase):
    """
    Test suite for the Evidence Aggregation service verifying deterministic
    evidence confidence scoring, diminishing returns, and explainability.
    """

    def test_1_claimed_skill_with_no_evidence(self):
        """
        1. Claimed skill with no evidence:
        - confidence must be 0.0
        - status must be 'insufficient_evidence'
        - strength must be 'none'
        - explanation must clearly state skill is claimed but no evidence was available
        - skill must remain present in profile
        """
        claimed_skills = ["Data Structures & Algorithms"]
        evidence_items = []

        response = aggregate_evidence_for_skills(claimed_skills, evidence_items)

        self.assertEqual(response.skills_analyzed, 1)
        res = response.skills[0]

        self.assertEqual(res.skill_name, "Data Structures & Algorithms")
        self.assertTrue(res.claimed_in_resume)
        self.assertEqual(res.confidence, 0.0)
        self.assertEqual(res.evidence_status, "insufficient_evidence")
        self.assertEqual(res.evidence_strength, "none")
        self.assertEqual(res.evidence_count, 0)
        self.assertIn("claimed in the resume, but no supporting evidence was available", res.explanation)

    def test_2_one_weak_evidence_item(self):
        """
        2. One weak evidence item:
        - confidence around 0.40–0.50
        - status must be 'partially_supported'
        - strength must be 'weak'
        """
        claimed_skills = ["Go"]
        evidence_items = [
            EvidenceItem(
                evidence_type=EvidenceType.PROJECT,
                title="CLI Tool",
                description="Small terminal utility",
                source="Personal Project",
                related_skills=["Go"],
                evidence_strength=EvidenceStrength.WEAK,
                confidence=0.45,
            )
        ]

        response = aggregate_evidence_for_skills(claimed_skills, evidence_items)
        res = response.skills[0]

        self.assertGreaterEqual(res.confidence, 0.40)
        self.assertLessEqual(res.confidence, 0.50)
        self.assertEqual(res.evidence_status, "partially_supported")
        self.assertEqual(res.evidence_strength, "weak")

    def test_3_one_moderate_evidence_item(self):
        """
        3. One moderate evidence item:
        - confidence around 0.55–0.70
        - status must be 'partially_supported'
        - strength must be 'moderate'
        """
        claimed_skills = ["PostgreSQL"]
        evidence_items = [
            EvidenceItem(
                evidence_type=EvidenceType.COURSEWORK,
                title="Database Systems Lab",
                description="Academic project using PostgreSQL queries and schema design",
                source="University Coursework",
                related_skills=["PostgreSQL"],
                evidence_strength=EvidenceStrength.MODERATE,
                confidence=0.65,
            )
        ]

        response = aggregate_evidence_for_skills(claimed_skills, evidence_items)
        res = response.skills[0]

        self.assertGreaterEqual(res.confidence, 0.55)
        self.assertLessEqual(res.confidence, 0.70)
        self.assertEqual(res.evidence_status, "partially_supported")
        self.assertEqual(res.evidence_strength, "moderate")

    def test_4_one_strong_github_evidence_item(self):
        """
        4. One strong GitHub evidence item:
        - confidence around 0.75–0.85
        - status must be 'strongly_supported'
        - strength must be 'strong'
        """
        claimed_skills = ["FastAPI"]
        evidence_items = [
            EvidenceItem(
                evidence_type=EvidenceType.GITHUB_REPOSITORY,
                title="GitHub: profiq-backend",
                description="Production backend service using FastAPI",
                source="GitHub",
                url="https://github.com/alex/profiq-backend",
                related_skills=["FastAPI"],
                evidence_strength=EvidenceStrength.STRONG,
                confidence=0.80,
                metadata={"stars": 12, "forks": 3, "is_fork": False},
            )
        ]

        response = aggregate_evidence_for_skills(claimed_skills, evidence_items)
        res = response.skills[0]

        self.assertGreaterEqual(res.confidence, 0.75)
        self.assertLessEqual(res.confidence, 0.85)
        self.assertEqual(res.evidence_status, "strongly_supported")
        self.assertEqual(res.evidence_strength, "strong")
        self.assertIn("public github repository", res.explanation.lower())

    def test_5_certification_only_evidence(self):
        """
        5. Certification-only evidence:
        - cap confidence at 0.60
        - status must be 'partially_supported'
        - explanation should indicate certification supports claim but does not by itself
          demonstrate practical application
        """
        claimed_skills = ["Object-Oriented Programming"]
        evidence_items = [
            EvidenceItem(
                evidence_type=EvidenceType.CERTIFICATION,
                title="Java OOP Principles Certification",
                description="Certificate of completion in OOP concepts",
                source="Coursera",
                url="https://coursera.org/verify/OOP123",
                related_skills=["Object-Oriented Programming"],
                evidence_strength=EvidenceStrength.STRONG,
                confidence=0.85,  # High cert confidence must be capped
            )
        ]

        response = aggregate_evidence_for_skills(claimed_skills, evidence_items)
        res = response.skills[0]

        self.assertLessEqual(res.confidence, 0.60)
        self.assertEqual(res.evidence_status, "partially_supported")
        self.assertIn("certification", res.explanation.lower())
        self.assertIn("no practical implementation evidence was available", res.explanation)

    def test_6_multiple_independent_evidence_sources(self):
        """
        6. Multiple independent evidence sources:
        - confidence must be higher than a single source
        - confidence must be strictly below 0.95
        - status must be 'strongly_supported'
        """
        claimed_skills = ["Python"]
        evidence_items = [
            EvidenceItem(
                evidence_type=EvidenceType.GITHUB_REPOSITORY,
                title="GitHub: profiq-ai",
                description="Python service",
                source="GitHub",
                url="https://github.com/alex/profiq-ai",
                related_skills=["Python"],
                evidence_strength=EvidenceStrength.STRONG,
                confidence=0.80,
            ),
            EvidenceItem(
                evidence_type=EvidenceType.ASSESSMENT,
                title="HackerRank Python Gold Badge",
                description="Verified assessment scoring in top 5%",
                source="HackerRank",
                url="https://hackerrank.com/certificates/py123",
                related_skills=["Python"],
                evidence_strength=EvidenceStrength.STRONG,
                confidence=0.80,
            ),
        ]

        response = aggregate_evidence_for_skills(claimed_skills, evidence_items)
        res = response.skills[0]

        # Multiple independent strong sources must exceed single source confidence
        self.assertGreater(res.confidence, 0.80)
        self.assertLess(res.confidence, 0.95)
        self.assertEqual(res.evidence_status, "strongly_supported")
        self.assertEqual(res.evidence_strength, "strong")
        self.assertEqual(res.evidence_count, 2)
        self.assertIn("multiple independent evidence sources", res.explanation.lower())

    def test_7_duplicate_evidence_does_not_inflate_confidence(self):
        """
        7. Duplicate evidence from the same repository/source must not artificially
        increase confidence.
        """
        claimed_skills = ["React"]

        single_item = [
            EvidenceItem(
                evidence_type=EvidenceType.GITHUB_REPOSITORY,
                title="GitHub: react-app",
                description="Frontend dashboard",
                source="GitHub",
                url="https://github.com/alex/react-app",
                related_skills=["React"],
                evidence_strength=EvidenceStrength.STRONG,
                confidence=0.80,
            )
        ]
        resp_single = aggregate_evidence_for_skills(claimed_skills, single_item)
        single_conf = resp_single.skills[0].confidence

        # Duplicate item pointing to the exact same URL/artifact
        duplicate_items = [
            EvidenceItem(
                evidence_type=EvidenceType.GITHUB_REPOSITORY,
                title="GitHub: react-app",
                description="Frontend dashboard",
                source="GitHub",
                url="https://github.com/alex/react-app",
                related_skills=["React"],
                evidence_strength=EvidenceStrength.STRONG,
                confidence=0.80,
            ),
            EvidenceItem(
                evidence_type=EvidenceType.GITHUB_REPOSITORY,
                title="GitHub: react-app (duplicate reference)",
                description="Frontend dashboard copy",
                source="GitHub",
                url="https://github.com/alex/react-app",
                related_skills=["React"],
                evidence_strength=EvidenceStrength.STRONG,
                confidence=0.80,
            ),
        ]
        resp_dup = aggregate_evidence_for_skills(claimed_skills, duplicate_items)
        dup_conf = resp_dup.skills[0].confidence

        # Confidence must remain exactly identical, not inflated
        self.assertEqual(dup_conf, single_conf)

    def test_8_forked_github_evidence(self):
        """
        8. Forked GitHub repository evidence:
        - must remain weak (<= 0.50)
        - status must be 'partially_supported'
        """
        claimed_skills = ["Rust"]
        evidence_items = [
            EvidenceItem(
                evidence_type=EvidenceType.GITHUB_REPOSITORY,
                title="GitHub: forked-rust-engine",
                description="Fork of a rust repository",
                source="GitHub",
                url="https://github.com/alex/forked-rust-engine",
                related_skills=["Rust"],
                evidence_strength=EvidenceStrength.WEAK,
                confidence=0.45,
                metadata={"is_fork": True},
            )
        ]

        response = aggregate_evidence_for_skills(claimed_skills, evidence_items)
        res = response.skills[0]

        self.assertEqual(res.evidence_strength, "weak")
        self.assertEqual(res.evidence_status, "partially_supported")
        self.assertLessEqual(res.confidence, 0.50)
        self.assertIn("forked github repository", res.explanation.lower())

    def test_9_confidence_never_exceeds_095(self):
        """
        9. Confidence must never exceed 0.95 even with numerous strong independent sources.
        """
        claimed_skills = ["Docker"]
        # 6 independent strong artifacts from distinct URLs
        evidence_items = [
            EvidenceItem(
                evidence_type=EvidenceType.GITHUB_REPOSITORY,
                title=f"Docker Project {i}",
                description="Microservice deployment",
                source="GitHub",
                url=f"https://github.com/alex/docker-repo-{i}",
                related_skills=["Docker"],
                evidence_strength=EvidenceStrength.STRONG,
                confidence=0.90,
            )
            for i in range(6)
        ]

        response = aggregate_evidence_for_skills(claimed_skills, evidence_items)
        res = response.skills[0]

        self.assertLessEqual(res.confidence, 0.95)
        self.assertEqual(res.evidence_status, "strongly_supported")

    def test_10_every_result_contains_an_explanation(self):
        """
        10. Every result must contain a non-empty human-readable explanation.
        """
        claimed_skills = ["Python", "DSA", "Docker", "Java"]
        evidence_items = [
            EvidenceItem(
                evidence_type=EvidenceType.PROJECT,
                title="Student App",
                description="Capstone project in Python",
                source="Capstone",
                related_skills=["Python"],
                evidence_strength=EvidenceStrength.STRONG,
                confidence=0.80,
            ),
            EvidenceItem(
                evidence_type=EvidenceType.CERTIFICATION,
                title="Java Cert",
                description="Java completion certificate",
                source="Coursera",
                related_skills=["Java"],
                evidence_strength=EvidenceStrength.MODERATE,
                confidence=0.60,
            ),
        ]

        response = aggregate_evidence_for_skills(claimed_skills, evidence_items)

        self.assertEqual(len(response.skills), 4)
        for skill_result in response.skills:
            self.assertIsInstance(skill_result.explanation, str)
            self.assertGreater(len(skill_result.explanation.strip()), 10)

    def test_11_claimed_skill_remains_present_when_evidence_missing(self):
        """
        11. Claimed skill remains present in the profile even when evidence is missing.
        """
        claimed_skills = ["Python", "DSA", "Docker", "Machine Learning"]
        # Only Python has evidence
        evidence_items = [
            EvidenceItem(
                evidence_type=EvidenceType.GITHUB_REPOSITORY,
                title="Python ML Repo",
                description="Model training script",
                source="GitHub",
                related_skills=["Python"],
                evidence_strength=EvidenceStrength.STRONG,
                confidence=0.80,
            )
        ]

        response = aggregate_evidence_for_skills(claimed_skills, evidence_items)
        returned_names = {s.skill_name for s in response.skills}

        # All 4 skills must be present!
        self.assertIn("Python", returned_names)
        self.assertIn("Data Structures & Algorithms", returned_names)  # Canonical for DSA
        self.assertIn("Docker", returned_names)
        self.assertIn("Machine Learning", returned_names)
        self.assertEqual(response.skills_analyzed, 4)

        # Missing skills must be insufficient_evidence with confidence 0.0
        dsa_result = next(s for s in response.skills if s.skill_name == "Data Structures & Algorithms")
        self.assertTrue(dsa_result.claimed_in_resume)
        self.assertEqual(dsa_result.confidence, 0.0)
        self.assertEqual(dsa_result.evidence_status, "insufficient_evidence")


if __name__ == "__main__":
    unittest.main()
