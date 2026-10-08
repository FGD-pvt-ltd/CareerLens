import os
import sys
import unittest

# Ensure ai-service root is in Python module search path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from models.evidence import (
    EvidenceItem,
    EvidenceType,
    EvidenceStrength,
    VerificationStatus,
)
from services.evidence_service import associate_evidence_with_skills


class TestEvidenceModel(unittest.TestCase):
    """
    Test suite for the evidence verification and skill association service.
    """

    def test_1_one_skill_with_no_evidence(self):
        """
        Test Case 1: One skill with no evidence.
        - Must remain in the profile.
        - Status must be UNVERIFIED.
        - Confidence must be 0.0 and strength 'none'.
        """
        detected_skills = [
            {"name": "TypeScript", "category": "Programming Languages", "found_in": "skills section"}
        ]
        evidence_items = []

        response = associate_evidence_with_skills(detected_skills, evidence_items)

        self.assertEqual(response.total_skills, 1)
        self.assertEqual(response.verified_count, 0)
        self.assertEqual(response.unverified_count, 1)

        mapping = response.skills_evidence_map[0]
        self.assertEqual(mapping.skill_name, "TypeScript")
        self.assertFalse(mapping.has_evidence)
        self.assertEqual(mapping.evidence_count, 0)
        self.assertEqual(mapping.evidence, [])
        self.assertEqual(mapping.overall_evidence_strength, "none")
        self.assertEqual(mapping.aggregate_confidence, 0.0)
        self.assertEqual(mapping.verification_status, VerificationStatus.UNVERIFIED)

    def test_2_dsa_supported_by_coding_platform(self):
        """
        Test Case 2: DSA supported by a coding-platform evidence item.
        - Practical evaluation artifact should establish strong verification.
        """
        detected_skills = [
            {"name": "Data Structures & Algorithms", "category": "Computer Science Fundamentals", "found_in": "skills section"}
        ]
        evidence_items = [
            EvidenceItem(
                evidence_type=EvidenceType.CODING_PLATFORM,
                title="LeetCode Profile - 350+ Solved",
                description="Solved 350+ algorithmic problems across trees, graphs, and dynamic programming.",
                source="LeetCode",
                url="https://leetcode.com/candidate",
                related_skills=["Data Structures & Algorithms"],
                evidence_strength=EvidenceStrength.STRONG,
                confidence=0.85,
                metadata={"problems_solved": 350, "contest_rating": 1820},
            )
        ]

        response = associate_evidence_with_skills(detected_skills, evidence_items)

        self.assertEqual(response.total_skills, 1)
        self.assertEqual(response.verified_count, 1)
        self.assertEqual(response.unverified_count, 0)

        mapping = response.skills_evidence_map[0]
        self.assertEqual(mapping.skill_name, "Data Structures & Algorithms")
        self.assertTrue(mapping.has_evidence)
        self.assertEqual(mapping.evidence_count, 1)
        self.assertEqual(mapping.evidence[0].evidence_type, EvidenceType.CODING_PLATFORM)
        self.assertEqual(mapping.overall_evidence_strength, "strong")
        self.assertGreaterEqual(mapping.aggregate_confidence, 0.80)
        self.assertEqual(mapping.verification_status, VerificationStatus.VERIFIED)

    def test_3_oop_supported_by_certification(self):
        """
        Test Case 3: OOP supported by a certification.
        - Rule: A certificate alone should NOT automatically mean the skill is strongly verified.
        - Overall strength must be capped at 'moderate', confidence capped at 0.60,
          and status marked as PARTIALLY_VERIFIED (awaiting practical code artifacts).
        """
        detected_skills = [
            {"name": "Object-Oriented Programming", "category": "Computer Science Fundamentals", "found_in": "skills section"}
        ]
        evidence_items = [
            EvidenceItem(
                evidence_type=EvidenceType.CERTIFICATION,
                title="Java OOP Principles & Design Patterns",
                description="Certificate of completion covering encapsulation, inheritance, polymorphism, and SOLID.",
                source="Coursera",
                url="https://coursera.org/verify/SAMPLE123",
                related_skills=["Object-Oriented Programming"],
                evidence_strength=EvidenceStrength.STRONG,  # Intentionally tagged strong by provider
                confidence=0.80,
                metadata={"credential_id": "CERT-9988"},
            )
        ]

        response = associate_evidence_with_skills(detected_skills, evidence_items)

        mapping = response.skills_evidence_map[0]
        self.assertEqual(mapping.skill_name, "Object-Oriented Programming")
        self.assertTrue(mapping.has_evidence)

        # Invariant: Certificate alone must NOT be 'strong'
        self.assertNotEqual(mapping.overall_evidence_strength, "strong")
        self.assertEqual(mapping.overall_evidence_strength, "moderate")

        # Invariant: Confidence for cert alone is dampened (<= 0.60)
        self.assertLessEqual(mapping.aggregate_confidence, 0.60)

        # Invariant: Cannot be fully VERIFIED on certification alone
        self.assertEqual(mapping.verification_status, VerificationStatus.PARTIALLY_VERIFIED)

    def test_4_skill_supported_by_multiple_evidence_sources(self):
        """
        Test Case 4: A skill supported by multiple evidence sources.
        - Multiple independent sources (e.g. GitHub repo + project) must both be linked.
        - Confidence is reinforced.
        """
        detected_skills = [
            {"name": "Python", "category": "Programming Languages", "found_in": "skills section, projects section"}
        ]
        evidence_items = [
            EvidenceItem(
                evidence_type=EvidenceType.GITHUB_REPOSITORY,
                title="ProfiQ AI Service",
                description="Production FastAPI microservice for resume extraction and analysis.",
                source="GitHub",
                url="https://github.com/candidate/profiq-ai",
                related_skills=["Python"],
                evidence_strength=EvidenceStrength.STRONG,
                confidence=0.85,
                metadata={"commits": 45, "primary_language": "Python"},
            ),
            EvidenceItem(
                evidence_type=EvidenceType.PROJECT,
                title="Student Analytics Platform",
                description="Full stack analytics tool with data pipelines written in Python.",
                source="Capstone Project",
                related_skills=["Python"],
                evidence_strength=EvidenceStrength.MODERATE,
                confidence=0.70,
                metadata={"team_size": 3},
            ),
        ]

        response = associate_evidence_with_skills(detected_skills, evidence_items)

        mapping = response.skills_evidence_map[0]
        self.assertEqual(mapping.skill_name, "Python")
        self.assertEqual(mapping.evidence_count, 2)
        self.assertEqual(len(mapping.evidence), 2)

        # Both evidence types present
        evidence_types = {e.evidence_type for e in mapping.evidence}
        self.assertIn(EvidenceType.GITHUB_REPOSITORY, evidence_types)
        self.assertIn(EvidenceType.PROJECT, evidence_types)

        # Overall strength is strong
        self.assertEqual(mapping.overall_evidence_strength, "strong")

        # Confidence boosted beyond highest individual source (0.85 + multi-source boost)
        self.assertGreater(mapping.aggregate_confidence, 0.85)
        self.assertEqual(mapping.verification_status, VerificationStatus.VERIFIED)

    def test_5_skill_with_missing_evidence(self):
        """
        Test Case 5: A skill with missing evidence.
        - Rule: Missing evidence must NOT mean the skill is absent.
        - Skills with no evidence must be preserved alongside verified skills.
        """
        detected_skills = [
            {"name": "Python", "category": "Programming Languages", "found_in": "skills section"},
            {"name": "Docker", "category": "DevOps", "found_in": "skills section"},
            {"name": "PostgreSQL", "category": "Databases", "found_in": "skills section"},
        ]
        # Evidence only provided for Python
        evidence_items = [
            EvidenceItem(
                evidence_type=EvidenceType.PROJECT,
                title="Personal Web App",
                description="Python application deployed on VPS.",
                source="Personal Project",
                related_skills=["Python"],
                evidence_strength=EvidenceStrength.MODERATE,
                confidence=0.70,
            )
        ]

        response = associate_evidence_with_skills(detected_skills, evidence_items)

        # All 3 skills must still be present!
        self.assertEqual(response.total_skills, 3)

        skill_map = {m.skill_name: m for m in response.skills_evidence_map}
        self.assertIn("Python", skill_map)
        self.assertIn("Docker", skill_map)
        self.assertIn("PostgreSQL", skill_map)

        # Python is partially verified
        self.assertTrue(skill_map["Python"].has_evidence)
        self.assertEqual(skill_map["Python"].evidence_count, 1)

        # Docker has missing evidence, but is NOT absent
        self.assertFalse(skill_map["Docker"].has_evidence)
        self.assertEqual(skill_map["Docker"].evidence_count, 0)
        self.assertEqual(skill_map["Docker"].overall_evidence_strength, "none")
        self.assertEqual(skill_map["Docker"].aggregate_confidence, 0.0)
        self.assertEqual(skill_map["Docker"].verification_status, VerificationStatus.UNVERIFIED)

        # PostgreSQL has missing evidence, but is NOT absent
        self.assertFalse(skill_map["PostgreSQL"].has_evidence)
        self.assertEqual(skill_map["PostgreSQL"].evidence_count, 0)
        self.assertEqual(skill_map["PostgreSQL"].verification_status, VerificationStatus.UNVERIFIED)


if __name__ == "__main__":
    unittest.main()
