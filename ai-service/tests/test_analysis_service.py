"""
Unit Tests for Candidate Analysis Orchestrator Service

Verifies end-to-end orchestration across resume skill extraction, evidence aggregation,
role requirements resolution, role skill matching, readiness scoring, skill gap detection,
personalized roadmap generation, and explainable summary synthesis.
"""

import os
import sys
import unittest

# Ensure ai-service root is in Python module search path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from models.evidence import EvidenceItem, EvidenceStrength, EvidenceType
from services.analysis_service import analyze_candidate
from services.evidence_aggregator import aggregate_evidence_for_skills
from services.readiness_service import analyze_job_readiness
from services.roadmap_service import generate_personalized_roadmap
from services.role_matcher import match_candidate_to_role
from services.role_service import resolve_role_requirements
from services.skill_extractor import extract_skills_from_text


class TestCandidateAnalysisOrchestrator(unittest.TestCase):
    """Test suite covering the 17 required scenarios for the unified analysis orchestrator."""

    def setUp(self):
        """Reusable resume texts and evidence items."""
        self.sample_resume = """
        John Doe
        Software & AI Engineer

        SUMMARY
        Passionate developer with strong foundation in Python, Machine Learning, and SQL.
        Experienced with Git and Docker for development and containerization.

        SKILLS
        Languages: Python 3, SQL
        ML & Data: Machine Learning
        Tools: Git, Docker

        PROJECTS
        AI Image Classifier:
        Built a deep learning classification pipeline using Python and Machine Learning.
        Used Git for version control and Docker for deployment.
        """

        self.python_evidence = EvidenceItem(
            evidence_type=EvidenceType.GITHUB_REPOSITORY,
            title="image-classifier-pipeline",
            description="End-to-end image classifier in Python with high test coverage.",
            source="GitHub",
            url="https://github.com/johndoe/image-classifier",
            related_skills=["Python", "Machine Learning"],
            evidence_strength=EvidenceStrength.STRONG,
            confidence=0.85,
        )

        self.docker_evidence = EvidenceItem(
            evidence_type=EvidenceType.GITHUB_REPOSITORY,
            title="docker-deployment",
            description="Containerized Docker deployment configuration.",
            source="GitHub",
            url="https://github.com/johndoe/docker-deployment",
            related_skills=["Docker"],
            evidence_strength=EvidenceStrength.WEAK,
            confidence=0.45,
        )

    def test_1_complete_candidate_analysis(self):
        """1. Complete candidate analysis runs smoothly through all pipeline steps."""
        res = analyze_candidate(
            resume_text=self.sample_resume,
            target_role="AI Engineer",
            evidence_items=[self.python_evidence, self.docker_evidence],
        )

        self.assertEqual(res.target_role, "AI Engineer")
        self.assertTrue(len(res.claimed_skills) >= 4)
        self.assertTrue(len(res.aggregated_skills) >= 4)
        self.assertEqual(res.role_requirements.matched_role, "AI Engineer")
        self.assertEqual(len(res.skill_matches), 7)
        self.assertTrue(0 <= res.readiness_score <= 100)
        self.assertIsInstance(res.readiness_label, str)
        self.assertTrue(len(res.skill_gaps) > 0)
        self.assertTrue(res.roadmap.total_roadmap_items > 0)
        self.assertTrue(len(res.summary) > 50)

    def test_2_empty_resume(self):
        """2. Empty resume text or whitespace-only raises ValueError."""
        with self.assertRaises(ValueError):
            analyze_candidate("", "AI Engineer")

        with self.assertRaises(ValueError):
            analyze_candidate("   \n\t  ", "AI Engineer")

    def test_3_unknown_role(self):
        """3. Unknown target role raises ValueError listing supported roles."""
        with self.assertRaises(ValueError) as ctx:
            analyze_candidate(self.sample_resume, "Astronaut")
        self.assertIn("Supported roles", str(ctx.exception))

        with self.assertRaises(ValueError):
            analyze_candidate(self.sample_resume, "")

    def test_4_candidate_with_no_evidence(self):
        """4. Candidate with claims but no external evidence results in 0 score and insufficient evidence."""
        res = analyze_candidate(
            resume_text=self.sample_resume,
            target_role="AI Engineer",
            evidence_items=[],
        )

        self.assertEqual(res.readiness_score, 0)
        self.assertEqual(res.readiness_label, "Needs Significant Development")
        for match in res.skill_matches:
            self.assertEqual(match.candidate_confidence, 0.0)
            self.assertEqual(match.candidate_evidence_status, "insufficient_evidence")

    def test_5_candidate_with_strong_evidence(self):
        """5. Candidate with strong multi-skill evidence achieves strong match status."""
        ml_strong = EvidenceItem(
            evidence_type=EvidenceType.GITHUB_REPOSITORY,
            title="ml-predictive-system",
            description="Predictive ML modeling pipeline with high validation score.",
            source="GitHub",
            url="https://github.com/johndoe/ml-system",
            related_skills=["Machine Learning"],
            evidence_strength=EvidenceStrength.STRONG,
            confidence=0.85,
        )
        res = analyze_candidate(
            resume_text=self.sample_resume,
            target_role="AI Engineer",
            evidence_items=[self.python_evidence, ml_strong],
        )

        py_match = next(m for m in res.skill_matches if m.skill_name == "Python")
        ml_match = next(m for m in res.skill_matches if m.skill_name == "Machine Learning")

        self.assertEqual(py_match.match_status, "strong_match")
        self.assertEqual(ml_match.match_status, "strong_match")
        self.assertGreater(res.readiness_score, 30)

    def test_6_candidate_with_partial_evidence(self):
        """6. Candidate with moderate evidence yields partial match status."""
        sql_partial = EvidenceItem(
            evidence_type=EvidenceType.CERTIFICATION,
            title="SQL Specialist",
            description="Relational database certification.",
            source="Coursera",
            url="https://coursera.org/cert/sql123",
            related_skills=["SQL"],
            evidence_strength=EvidenceStrength.MODERATE,
            confidence=0.60,
        )
        res = analyze_candidate(
            resume_text=self.sample_resume,
            target_role="AI Engineer",
            evidence_items=[sql_partial],
        )

        sql_match = next(m for m in res.skill_matches if m.skill_name == "SQL")
        self.assertEqual(sql_match.match_status, "partial_match")
        self.assertEqual(sql_match.candidate_confidence, 0.60)

    def test_7_duplicate_skills(self):
        """7. Skills claimed multiple times across sections are deduplicated to single canonical entries."""
        redundant_resume = """
        SKILLS
        Python, Python 3, Python

        EXPERIENCE
        Worked with Python 3 extensively.

        PROJECTS
        Built a Python app in Python.
        """
        res = analyze_candidate(
            resume_text=redundant_resume,
            target_role="Software Engineer",
            evidence_items=[],
        )

        py_claims = [s for s in res.claimed_skills if s.get("name") == "Python"]
        self.assertEqual(len(py_claims), 1)

        py_agg = [a for a in res.aggregated_skills if a.skill_name == "Python"]
        self.assertEqual(len(py_agg), 1)

    def test_8_duplicate_evidence(self):
        """8. Duplicate evidence items with the same URL do not inflate confidence."""
        duplicate_items = [self.python_evidence, self.python_evidence]
        res = analyze_candidate(
            resume_text=self.sample_resume,
            target_role="AI Engineer",
            evidence_items=duplicate_items,
        )

        py_agg = next(a for a in res.aggregated_skills if a.skill_name == "Python")
        self.assertEqual(py_agg.confidence, 0.85)

    def test_9_multiple_evidence_sources(self):
        """9. Multiple distinct evidence sources contribute via diminishing returns."""
        coding_evidence = EvidenceItem(
            evidence_type=EvidenceType.CODING_PLATFORM,
            title="LeetCode Python Profile",
            description="Solved 150 Python algorithmic problems.",
            source="LeetCode",
            url="https://leetcode.com/johndoe",
            related_skills=["Python"],
            evidence_strength=EvidenceStrength.STRONG,
            confidence=0.75,
        )
        res = analyze_candidate(
            resume_text=self.sample_resume,
            target_role="AI Engineer",
            evidence_items=[self.python_evidence, coding_evidence],
        )

        py_agg = next(a for a in res.aggregated_skills if a.skill_name == "Python")
        # Base 0.85 + diminishing returns from 0.75
        self.assertGreater(py_agg.confidence, 0.85)
        self.assertLessEqual(py_agg.confidence, 0.95)
        self.assertEqual(py_agg.evidence_count, 2)

    def test_10_readiness_score_consistency(self):
        """10. Orchestrated readiness score exactly matches direct readiness service output."""
        res = analyze_candidate(
            resume_text=self.sample_resume,
            target_role="AI Engineer",
            evidence_items=[self.python_evidence, self.docker_evidence],
        )

        direct_readiness = analyze_job_readiness("AI Engineer", res.aggregated_skills)
        self.assertEqual(res.readiness_score, direct_readiness.readiness_score)
        self.assertEqual(res.readiness_label, direct_readiness.score_label)

    def test_11_roadmap_consistency(self):
        """11. Orchestrated roadmap exactly matches direct roadmap service output."""
        res = analyze_candidate(
            resume_text=self.sample_resume,
            target_role="AI Engineer",
            evidence_items=[self.python_evidence, self.docker_evidence],
        )

        direct_roadmap = generate_personalized_roadmap("AI Engineer", res.aggregated_skills)
        self.assertEqual(res.roadmap.total_roadmap_items, direct_roadmap.total_roadmap_items)
        orchestrated_skills = [it.skill_name for it in res.roadmap.roadmap_items]
        direct_skills = [it.skill_name for it in direct_roadmap.roadmap_items]
        self.assertEqual(orchestrated_skills, direct_skills)

    def test_12_summary_contains_target_role(self):
        """12. Summary explicitly contains the resolved canonical target role title."""
        res = analyze_candidate(
            resume_text=self.sample_resume,
            target_role="ai engineer",
            evidence_items=[self.python_evidence],
        )
        self.assertIn("AI Engineer", res.summary)

    def test_13_summary_reflects_actual_readiness(self):
        """13. Summary accurately reflects the numeric readiness score and label."""
        res = analyze_candidate(
            resume_text=self.sample_resume,
            target_role="AI Engineer",
            evidence_items=[self.python_evidence],
        )
        self.assertIn(f"{res.readiness_score}/100", res.summary)
        self.assertIn(res.readiness_label, res.summary)

    def test_14_missing_skills_remain_represented_as_insufficient_evidence(self):
        """14. Role requirements with no candidate claims/evidence remain as gaps with 0 confidence."""
        res = analyze_candidate(
            resume_text=self.sample_resume,
            target_role="AI Engineer",
            evidence_items=[self.python_evidence],
        )

        dsa_match = next(m for m in res.skill_matches if m.skill_name == "Data Structures & Algorithms")
        self.assertEqual(dsa_match.candidate_confidence, 0.0)
        self.assertEqual(dsa_match.candidate_evidence_status, "insufficient_evidence")
        self.assertEqual(dsa_match.match_status, "gap")

    def test_15_no_mastery_claims_in_summary(self):
        """15. Summary strictly avoids forbidden words claiming absolute mastery or guarantees."""
        res = analyze_candidate(
            resume_text=self.sample_resume,
            target_role="AI Engineer",
            evidence_items=[self.python_evidence, self.docker_evidence],
        )

        summary_lower = res.summary.lower()
        forbidden_terms = [
            "mastered",
            "mastery",
            "expert",
            "guaranteed",
            "proven",
            "definitely knows",
            "100% ready",
            "chance of getting hired",
        ]
        for term in forbidden_terms:
            self.assertNotIn(term, summary_lower)

    def test_16_deterministic_repeated_execution(self):
        """16. Repeated calls with identical inputs produce identical outputs."""
        res1 = analyze_candidate(
            resume_text=self.sample_resume,
            target_role="AI Engineer",
            evidence_items=[self.python_evidence],
        )
        res2 = analyze_candidate(
            resume_text=self.sample_resume,
            target_role="AI Engineer",
            evidence_items=[self.python_evidence],
        )

        self.assertEqual(res1.readiness_score, res2.readiness_score)
        self.assertEqual(res1.readiness_label, res2.readiness_label)
        self.assertEqual(res1.summary, res2.summary)
        self.assertEqual(
            [m.weighted_match_contribution for m in res1.skill_matches],
            [m.weighted_match_contribution for m in res2.skill_matches],
        )

    def test_17_existing_endpoints_still_work(self):
        """17. Existing standalone services and underlying functions continue functioning cleanly."""
        skills_res = extract_skills_from_text("Python, Docker, SQL")
        self.assertTrue(skills_res["total_detected_skills"] >= 3)

        role_res = resolve_role_requirements("SDE")
        self.assertEqual(role_res.matched_role, "Software Engineer")

        agg_res = aggregate_evidence_for_skills(["Python"], [self.python_evidence])
        self.assertTrue(len(agg_res.skills) >= 1)

        match_res = match_candidate_to_role("Software Engineer", agg_res.skills)
        self.assertTrue(len(match_res.skill_matches) >= 6)


if __name__ == "__main__":
    unittest.main()
