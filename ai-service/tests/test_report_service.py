"""
Unit Tests for Candidate Readiness Report Service and Endpoints

Verifies synthesis of CandidateReport, executive summary formulation, preservation
of deterministic readiness scores and role targets, evidence-backed strengths,
skill gaps, evidence counts, roadmap preservation, next steps derivation,
safe handling of LLM explanations, and API endpoints.
"""

import copy
import json
import os
import sys
import unittest

# Ensure ai-service root is in Python module search path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from models.llm import LLMExplanationResponse
from models.report import CandidateReport
from services.report_service import generate_candidate_report

try:
    from fastapi.testclient import TestClient
    from main import app
    HAS_TEST_CLIENT = True
except ImportError:
    HAS_TEST_CLIENT = False


class TestReportService(unittest.TestCase):
    """Test suite covering the 20+ required scenarios for candidate readiness reports."""

    def setUp(self):
        """Standard mock candidate analysis payload."""
        # Ensure tests in this suite run hermetically against fallback LLM
        self._orig_api_key = os.environ.get("GEMINI_API_KEY")
        os.environ["GEMINI_API_KEY"] = ""

        self.sample_analysis = {
            "target_role": "AI Engineer",
            "readiness_score": 68,
            "readiness_label": "Moderately Ready",
            "claimed_skills": [
                "Python", "Git", "Docker", "Machine Learning", "Data Structures & Algorithms"
            ],
            "skill_matches": [
                {
                    "skill_name": "Python",
                    "match_status": "strong_match",
                    "candidate_confidence": 0.85,
                    "candidate_evidence_status": "strongly_supported",
                    "candidate_evidence_strength": "strong",
                    "importance": "high",
                },
                {
                    "skill_name": "Git",
                    "match_status": "strong_match",
                    "candidate_confidence": 0.80,
                    "candidate_evidence_status": "strongly_supported",
                    "candidate_evidence_strength": "strong",
                    "importance": "medium",
                },
                {
                    "skill_name": "Docker",
                    "match_status": "partial_match",
                    "candidate_confidence": 0.60,
                    "candidate_evidence_status": "partially_supported",
                    "candidate_evidence_strength": "moderate",
                    "importance": "medium",
                },
            ],
            "skill_gaps": [
                {
                    "skill_name": "Machine Learning",
                    "importance": "high",
                    "candidate_confidence": 0.0,
                    "gap_severity": "high",
                    "evidence_status": "insufficient_evidence",
                    "explanation": "No available evidence currently provides sufficient support for the Machine Learning claim.",
                },
                {
                    "skill_name": "Data Structures & Algorithms",
                    "importance": "medium",
                    "candidate_confidence": 0.55,
                    "gap_severity": "medium",
                    "evidence_status": "partially_supported",
                    "explanation": "DSA has partial evidence but needs additional competitive coding validation.",
                },
            ],
            "roadmap": [
                {
                    "skill_name": "Machine Learning",
                    "priority": 1,
                    "importance": "high",
                    "current_confidence": 0.0,
                    "goal": "Build an end-to-end ML classification pipeline.",
                    "recommended_actions": ["Study scikit-learn", "Train baseline models"],
                    "suggested_project": "Build a predictive ML pipeline with scikit-learn",
                    "suggested_evidence": ["Public GitHub repository with model metrics"],
                    "estimated_effort": "4–6 weeks",
                },
                {
                    "skill_name": "Data Structures & Algorithms",
                    "priority": 2,
                    "importance": "medium",
                    "current_confidence": 0.55,
                    "goal": "Strengthen algorithmic problem solving.",
                    "recommended_actions": ["Practice LeetCode medium questions"],
                    "suggested_project": "Build an interactive algorithm visualizer",
                    "suggested_evidence": ["LeetCode profile with 50+ solved problems"],
                    "estimated_effort": "2–4 weeks",
                },
            ],
            "evidence_items": [
                {"title": "Repo 1", "evidence_type": "github_repository"},
                {"title": "Repo 2", "evidence_type": "github_repository"},
            ],
        }

    def tearDown(self):
        """Restore original environment variable."""
        if self._orig_api_key is not None:
            os.environ["GEMINI_API_KEY"] = self._orig_api_key
        elif "GEMINI_API_KEY" in os.environ:
            del os.environ["GEMINI_API_KEY"]

    def test_1_report_generation(self):
        """1. Candidate report generates successfully with all expected top-level fields."""
        report = generate_candidate_report(self.sample_analysis)
        self.assertIsInstance(report, CandidateReport)
        self.assertEqual(report.target_role, "AI Engineer")
        self.assertEqual(report.readiness_score, 68)
        self.assertEqual(report.readiness_label, "Moderately Ready")
        self.assertTrue(len(report.executive_summary) > 20)
        self.assertTrue(len(report.strengths) >= 2)
        self.assertTrue(len(report.skill_gaps) >= 2)
        self.assertIsNotNone(report.evidence_summary)
        self.assertTrue(len(report.roadmap) >= 2)
        self.assertTrue(len(report.next_steps) >= 3)
        self.assertTrue(len(report.disclaimer) > 20)

    def test_2_executive_summary_format(self):
        """2. Executive summary contains role, score, label, and deterministic skill mentions."""
        report = generate_candidate_report(self.sample_analysis)
        self.assertIn("AI Engineer", report.executive_summary)
        self.assertIn("68/100", report.executive_summary)
        self.assertIn("Moderately Ready", report.executive_summary)
        self.assertIn("Python", report.executive_summary)

    def test_3_readiness_score_preservation(self):
        """3. Readiness score is strictly preserved from deterministic analysis."""
        report = generate_candidate_report(self.sample_analysis)
        self.assertEqual(report.readiness_score, 68)

    def test_4_target_role_preservation(self):
        """4. Target role title is strictly preserved from deterministic analysis."""
        report = generate_candidate_report(self.sample_analysis)
        self.assertEqual(report.target_role, "AI Engineer")

    def test_5_strengths_threshold_and_status(self):
        """5. Strengths only include skills with confidence >= 0.70 and label 'strongly supported'."""
        report = generate_candidate_report(self.sample_analysis)
        for s in report.strengths:
            self.assertGreaterEqual(s.confidence, 0.70)
            self.assertEqual(s.evidence_status, "strongly_supported")
            self.assertIn(s.evidence_strength, ["strong", "moderate"])
            self.assertIn("strongly supported", s.explanation.lower())

    def test_6_skill_gaps_preservation(self):
        """6. Skill gaps preserve original gap severity, importance, and include roadmap actions."""
        report = generate_candidate_report(self.sample_analysis)
        gaps_by_name = {g.skill_name: g for g in report.skill_gaps}
        self.assertIn("Machine Learning", gaps_by_name)
        ml_gap = gaps_by_name["Machine Learning"]
        self.assertEqual(ml_gap.importance, "high")
        self.assertEqual(ml_gap.gap_severity, "high")
        self.assertEqual(ml_gap.current_confidence, 0.0)
        self.assertTrue(len(ml_gap.recommended_action) > 10)

    def test_7_evidence_counts(self):
        """7. Evidence summary includes exact counts calculated from the actual analysis."""
        report = generate_candidate_report(self.sample_analysis)
        ev = report.evidence_summary
        self.assertEqual(ev.total_claimed_skills, 5)
        self.assertEqual(ev.strongly_supported_skills, 2)  # Python, Git
        self.assertEqual(ev.partially_supported_skills, 1)  # Docker
        self.assertEqual(ev.insufficient_evidence_skills, 2)  # ML, DSA
        self.assertEqual(ev.total_evidence_items, 2)

    def test_8_insufficient_evidence_wording(self):
        """8. Evidence summary explanation clarifies that insufficient evidence is not a lack of ability."""
        report = generate_candidate_report(self.sample_analysis)
        explanation = report.evidence_summary.explanation
        self.assertIn("insufficient evidence means the available evidence does not currently provide enough support for the claim", explanation.lower())
        self.assertIn("rather than a lack of ability", explanation.lower())
        self.assertNotIn("does not know the skill", explanation.lower())

    def test_9_roadmap_preservation(self):
        """9. Roadmap milestones preserve priority, effort, goals, and suggested projects."""
        report = generate_candidate_report(self.sample_analysis)
        self.assertEqual(len(report.roadmap), 2)
        item1 = report.roadmap[0]
        self.assertEqual(item1.skill_name, "Machine Learning")
        self.assertEqual(item1.priority, 1)
        self.assertEqual(item1.importance, "high")
        self.assertIn("predictive ML pipeline", item1.suggested_project)
        self.assertEqual(item1.estimated_effort, "4–6 weeks")

    def test_10_next_steps_derived_from_roadmap(self):
        """10. 3–5 immediate next steps are derived directly from high-priority roadmap milestones."""
        report = generate_candidate_report(self.sample_analysis)
        self.assertGreaterEqual(len(report.next_steps), 3)
        self.assertLessEqual(len(report.next_steps), 5)
        combined_steps = " ".join(report.next_steps)
        self.assertIn("Machine Learning", combined_steps)
        self.assertIn("Data Structures & Algorithms", combined_steps)

    def test_11_gemini_explanation_integration(self):
        """11. Valid LLM explanation integrates smoothly into report executive summary."""
        mock_llm_response = LLMExplanationResponse(
            overview="The candidate achieves a readiness score of 68/100 for AI Engineer, placing them in the Moderately Ready tier.",
            strengths=["Python is strongly supported."],
            priority_gaps=["Machine Learning requires development."],
            recommendations=["Build an ML pipeline."],
            explanation="Detailed explanation narrative for AI Engineer.",
            disclaimer="Standard ProfiQ disclaimer text.",
            provider_used="gemini",
        )
        report = generate_candidate_report(self.sample_analysis, llm_explanation=mock_llm_response)
        self.assertEqual(report.readiness_score, 68)
        self.assertEqual(report.target_role, "AI Engineer")
        self.assertIn("68/100", report.executive_summary)

    def test_12_fallback_explanation_integration(self):
        """12. If no LLM explanation or empty dict is provided, fallback explanation is used automatically."""
        report = generate_candidate_report(self.sample_analysis, llm_explanation=None)
        self.assertIsInstance(report, CandidateReport)
        self.assertEqual(report.readiness_score, 68)
        self.assertIn("Moderately Ready", report.executive_summary)

    def test_13_empty_strengths_handled_gracefully(self):
        """13. Profile with zero strongly supported skills produces empty strengths list and clean summary."""
        analysis_no_strengths = copy.deepcopy(self.sample_analysis)
        analysis_no_strengths["skill_matches"] = []
        analysis_no_strengths["readiness_score"] = 15
        analysis_no_strengths["readiness_label"] = "Needs Significant Development"

        report = generate_candidate_report(analysis_no_strengths)
        self.assertEqual(report.strengths, [])
        self.assertEqual(report.readiness_score, 15)
        self.assertIn("No skills currently meet the strong evidence support threshold", report.executive_summary)

    def test_14_empty_gaps_handled_gracefully(self):
        """14. Profile with zero skill gaps produces empty gaps list and clean maintenance actions."""
        analysis_no_gaps = copy.deepcopy(self.sample_analysis)
        analysis_no_gaps["skill_gaps"] = []
        analysis_no_gaps["roadmap"] = []
        analysis_no_gaps["readiness_score"] = 92
        analysis_no_gaps["readiness_label"] = "Strongly Ready"

        report = generate_candidate_report(analysis_no_gaps)
        self.assertEqual(report.skill_gaps, [])
        self.assertEqual(report.roadmap, [])
        self.assertGreaterEqual(len(report.next_steps), 3)
        self.assertIn("Maintain active project repositories", report.next_steps[0])

    def test_15_deterministic_repeated_generation(self):
        """15. Repeated generation on identical inputs produces identical outputs."""
        report1 = generate_candidate_report(self.sample_analysis)
        report2 = generate_candidate_report(self.sample_analysis)

        self.assertEqual(report1.target_role, report2.target_role)
        self.assertEqual(report1.readiness_score, report2.readiness_score)
        self.assertEqual(report1.executive_summary, report2.executive_summary)
        self.assertEqual(len(report1.strengths), len(report2.strengths))
        self.assertEqual(len(report1.skill_gaps), len(report2.skill_gaps))
        self.assertEqual(report1.next_steps, report2.next_steps)

    def test_16_no_mastery_claims(self):
        """16. Report never uses forbidden mastery claims like 'mastered' or 'expert'."""
        report = generate_candidate_report(self.sample_analysis)
        combined_text = (
            f"{report.executive_summary} {' '.join(s.explanation for s in report.strengths)} "
            f"{' '.join(g.reason for g in report.skill_gaps)} {' '.join(report.next_steps)}"
        ).lower()

        forbidden_words = ["mastered", "mastery", "expert", "guaranteed to get hired", "100% ready"]
        for word in forbidden_words:
            self.assertNotIn(word, combined_text)

    def test_17_no_invented_evidence(self):
        """17. Report never introduces fabricated evidence or ungrounded artifacts."""
        report = generate_candidate_report(self.sample_analysis)
        for s in report.strengths:
            self.assertIn(s.skill_name, ["Python", "Git"])
        for g in report.skill_gaps:
            self.assertIn(g.skill_name, ["Machine Learning", "Data Structures & Algorithms"])

    def test_18_score_cannot_be_modified_by_llm(self):
        """18. Even if an LLM explanation passes an altered score, authoritative score is preserved."""
        tampered_llm = {
            "overview": "The candidate has achieved a readiness score of 99/100 for AI Engineer.",
            "explanation": "You scored 99/100 and have completed everything.",
            "disclaimer": "Standard disclaimer.",
        }
        report = generate_candidate_report(self.sample_analysis, llm_explanation=tampered_llm)
        self.assertEqual(report.readiness_score, 68)
        self.assertIn("68/100", report.executive_summary)
        self.assertNotIn("99/100", report.executive_summary)

    def test_19_unknown_or_missing_role_handling(self):
        """19. Missing or empty target role raises ValueError."""
        invalid_analysis = copy.deepcopy(self.sample_analysis)
        invalid_analysis["target_role"] = ""
        with self.assertRaises(ValueError):
            generate_candidate_report(invalid_analysis)

        invalid_analysis["target_role"] = None
        with self.assertRaises(ValueError):
            generate_candidate_report(invalid_analysis)

    def test_20_malformed_analysis_handling(self):
        """20. Missing or invalid readiness scores raise ValueError."""
        with self.assertRaises(ValueError):
            generate_candidate_report({})

        invalid_score = copy.deepcopy(self.sample_analysis)
        invalid_score["readiness_score"] = 150
        with self.assertRaises(ValueError):
            generate_candidate_report(invalid_score)

        invalid_score["readiness_score"] = -5
        with self.assertRaises(ValueError):
            generate_candidate_report(invalid_score)

    def test_21_report_generate_api_endpoint(self):
        """21. POST /report/generate and POST /api/report/generate endpoints return valid schema."""
        if not HAS_TEST_CLIENT:
            self.skipTest("fastapi.testclient.TestClient not available.")

        client = TestClient(app)
        for path in ["/report/generate", "/api/report/generate"]:
            resp = client.post(path, json={"analysis": self.sample_analysis})
            self.assertEqual(resp.status_code, 200, f"Endpoint {path} failed: {resp.text}")
            data = resp.json()
            validated = CandidateReport(**data)
            self.assertEqual(validated.target_role, "AI Engineer")
            self.assertEqual(validated.readiness_score, 68)
            self.assertTrue(len(validated.strengths) >= 2)
            self.assertTrue(len(validated.next_steps) >= 3)

    def test_22_combined_candidate_report_api_endpoint(self):
        """22. Combined end-to-end endpoint POST /api/candidate-report generates full CandidateReport."""
        if not HAS_TEST_CLIENT:
            self.skipTest("fastapi.testclient.TestClient not available.")

        client = TestClient(app)
        payload = {
            "resume_text": "John Doe\nAI Engineer\nSkills: Python, Machine Learning, Git, Docker, SQL\nProjects: AI Classifier",
            "target_role": "AI Engineer",
            "evidence_items": [],
        }
        resp = client.post("/api/candidate-report", json=payload)
        self.assertEqual(resp.status_code, 200, f"Endpoint /api/candidate-report failed: {resp.text}")
        data = resp.json()
        validated = CandidateReport(**data)
        self.assertEqual(validated.target_role, "AI Engineer")
        self.assertGreaterEqual(validated.readiness_score, 0)
        self.assertLessEqual(validated.readiness_score, 100)
        self.assertTrue(len(validated.executive_summary) > 10)
        self.assertTrue(len(validated.next_steps) >= 3)

    def test_23_one_evidence_item_count_one(self):
        """23. One evidence item produces total_evidence_items == 1."""
        analysis = copy.deepcopy(self.sample_analysis)
        analysis["evidence_items"] = [
            {"title": "Repo 1", "source": "github", "evidence_type": "github_repository"}
        ]
        report = generate_candidate_report(analysis)
        self.assertEqual(report.evidence_summary.total_evidence_items, 1)

    def test_24_multiple_unique_evidence_items_correct_count(self):
        """24. Multiple unique evidence items produce exact count."""
        analysis = copy.deepcopy(self.sample_analysis)
        analysis["evidence_items"] = [
            {"title": "Repo 1", "source": "github", "evidence_type": "github_repository"},
            {"title": "Repo 2", "source": "github", "evidence_type": "github_repository"},
            {"title": "LeetCode Profile", "source": "leetcode", "evidence_type": "coding_platform"},
        ]
        report = generate_candidate_report(analysis)
        self.assertEqual(report.evidence_summary.total_evidence_items, 3)

    def test_25_duplicate_evidence_deduplicated_count(self):
        """25. Duplicate evidence entries are deduplicated to actual unique count."""
        analysis = copy.deepcopy(self.sample_analysis)
        analysis["evidence_items"] = [
            {"title": "Repo A", "source": "github", "url": "https://github.com/user/repo-a", "evidence_type": "github_repository", "confidence": 0.7},
            {"title": "Repo A Duplicate", "source": "github", "url": "https://github.com/user/repo-a", "evidence_type": "github_repository", "confidence": 0.8},
            {"title": "Repo B", "source": "github", "url": "https://github.com/user/repo-b", "evidence_type": "github_repository", "confidence": 0.6},
        ]
        report = generate_candidate_report(analysis)
        # Repo A and duplicate map to same URL -> 2 unique artifacts
        self.assertEqual(report.evidence_summary.total_evidence_items, 2)

    def test_26_github_evidence_appears_in_final_report_count(self):
        """26. External GitHub evidence supplied to combined pipeline is counted in final report."""
        if not HAS_TEST_CLIENT:
            self.skipTest("fastapi.testclient.TestClient not available.")

        client = TestClient(app)
        payload = {
            "resume_text": "Alex Dev\nAI Engineer\nSkills: Python, Machine Learning, Git",
            "target_role": "AI Engineer",
            "evidence_items": [
                {
                    "evidence_type": "github_repository",
                    "title": "ai-classifier",
                    "description": "Image classification model in Python",
                    "source": "github",
                    "url": "https://github.com/alex/ai-classifier",
                    "related_skills": ["Python", "Machine Learning"],
                    "evidence_strength": "strong",
                    "confidence": 0.85,
                }
            ],
        }
        resp = client.post("/api/candidate-report", json=payload)
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["evidence_summary"]["total_evidence_items"], 1)

    def test_27_no_evidence_count_zero(self):
        """27. Candidate with no evidence items results in total_evidence_items == 0."""
        analysis = copy.deepcopy(self.sample_analysis)
        analysis["evidence_items"] = []
        report = generate_candidate_report(analysis)
        self.assertEqual(report.evidence_summary.total_evidence_items, 0)

    def test_28_evidence_supporting_skill_status_correct(self):
        """28. Evidence supporting a skill correctly preserves strong evidence status."""
        report = generate_candidate_report(self.sample_analysis)
        strength_names = [s.skill_name for s in report.strengths]
        self.assertIn("Python", strength_names)
        self.assertIn("Git", strength_names)

    def test_29_missing_evidence_does_not_mean_missing_skill(self):
        """29. Explanations clarify that missing evidence is lack of artifacts, not lack of ability."""
        report = generate_candidate_report(self.sample_analysis)
        self.assertIn("rather than a lack of ability", report.evidence_summary.explanation.lower())
        self.assertIn("does not provide hiring guarantees or assess unobservable capabilities", report.disclaimer.lower())

    def test_30_roadmap_wording_does_not_claim_lack_of_skill(self):
        """30. Roadmap reasons do not claim lack of skill, but insufficient supporting evidence."""
        report = generate_candidate_report(self.sample_analysis)
        for it in report.roadmap:
            reason_text = it.goal.lower()
            self.assertNotIn("you don't know", reason_text)
            self.assertNotIn("lacks skill", reason_text)

    def test_31_report_counts_match_final_analysis_state(self):
        """31. Evidence summary counts are internally consistent with total claimed skills."""
        report = generate_candidate_report(self.sample_analysis)
        ev = report.evidence_summary
        self.assertEqual(
            ev.strongly_supported_skills + ev.partially_supported_skills + ev.insufficient_evidence_skills,
            ev.total_claimed_skills,
        )

    def test_32_combined_candidate_report_preserves_supplied_github_evidence(self):
        """32. Live combined endpoint elevates skill confidence and accurately counts GitHub evidence."""
        if not HAS_TEST_CLIENT:
            self.skipTest("fastapi.testclient.TestClient not available.")

        client = TestClient(app)
        payload = {
            "resume_text": "Jordan Lee\nAI Engineer\nSkills: Python, Machine Learning, Git, Docker\nProjects: Built neural net",
            "target_role": "AI Engineer",
            "evidence_items": [
                {
                    "evidence_type": "github_repository",
                    "title": "neural-net-core",
                    "description": "Deep learning project in Python",
                    "source": "github",
                    "url": "https://github.com/jordan/neural-net-core",
                    "related_skills": ["Python", "Machine Learning"],
                    "evidence_strength": "strong",
                    "confidence": 0.85,
                }
            ],
        }
        resp = client.post("/api/candidate-report", json=payload)
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["evidence_summary"]["total_evidence_items"], 1)
        strength_names = [s["skill_name"] for s in data["strengths"]]
        self.assertIn("Python", strength_names)
        self.assertIn("Machine Learning", strength_names)


if __name__ == "__main__":
    unittest.main()
