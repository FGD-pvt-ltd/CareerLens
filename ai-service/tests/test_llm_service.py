"""
Unit Tests for LLM Explanation Layer

Verifies provider abstraction, deterministic fallback generation, safe terminology,
graceful error handling, immutability of candidate analysis, and boundary scenarios.
"""

import copy
import os
import sys
import unittest

# Ensure ai-service root is in Python module search path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from models.llm import LLMExplanationResponse
from services.fallback_llm import DeterministicFallbackLLM
from services.llm_provider import LLMProvider
from services.llm_service import generate_candidate_explanation


class TestLLMExplanationService(unittest.TestCase):
    """Test suite covering the 16 required scenarios for the LLM explanation service."""

    def setUp(self):
        """Standard mock candidate analysis payload."""
        self._orig_api_key = os.environ.get("GEMINI_API_KEY")
        # Ensure test suite runs hermetically against fallback provider
        os.environ["GEMINI_API_KEY"] = ""
        self.sample_analysis = {
            "target_role": "AI Engineer",
            "readiness_score": 68,
            "readiness_label": "Moderately Ready",
            "skill_matches": [
                {
                    "skill_name": "Python",
                    "match_status": "strong_match",
                    "candidate_confidence": 0.85,
                    "candidate_evidence_status": "strongly_supported",
                },
                {
                    "skill_name": "Git",
                    "match_status": "strong_match",
                    "candidate_confidence": 0.80,
                    "candidate_evidence_status": "strongly_supported",
                },
                {
                    "skill_name": "Docker",
                    "match_status": "partial_match",
                    "candidate_confidence": 0.60,
                    "candidate_evidence_status": "partially_supported",
                },
            ],
            "skill_gaps": [
                {
                    "skill_name": "Machine Learning",
                    "importance": "high",
                    "candidate_confidence": 0.0,
                    "gap_severity": "high",
                    "match_status": "gap",
                },
                {
                    "skill_name": "Data Structures & Algorithms",
                    "importance": "medium",
                    "candidate_confidence": 0.55,
                    "gap_severity": "medium",
                    "match_status": "partial_match",
                },
            ],
            "roadmap": [
                {
                    "skill_name": "Machine Learning",
                    "suggested_project": "Build a predictive machine learning pipeline",
                    "goal": "Develop end-to-end ML modeling skills.",
                },
                {
                    "skill_name": "Data Structures & Algorithms",
                    "suggested_project": "Build an algorithm visualizer",
                    "goal": "Strengthen algorithmic problem solving.",
                },
            ],
        }

    def tearDown(self):
        if self._orig_api_key is not None:
            os.environ["GEMINI_API_KEY"] = self._orig_api_key
        elif "GEMINI_API_KEY" in os.environ:
            del os.environ["GEMINI_API_KEY"]

    def test_1_fallback_provider_works(self):
        """1. Deterministic fallback provider generates a structured response."""
        res = generate_candidate_explanation(self.sample_analysis)
        self.assertIsInstance(res, LLMExplanationResponse)
        self.assertTrue(len(res.overview) > 10)
        self.assertTrue(len(res.strengths) >= 2)
        self.assertTrue(len(res.priority_gaps) >= 2)
        self.assertTrue(len(res.recommendations) >= 2)
        self.assertTrue(len(res.explanation) > 30)
        self.assertTrue(len(res.disclaimer) > 20)

    def test_2_overview_contains_target_role(self):
        """2. Overview explicitly includes the target role title."""
        res = generate_candidate_explanation(self.sample_analysis)
        self.assertIn("AI Engineer", res.overview)

    def test_3_overview_contains_readiness_score(self):
        """3. Overview includes the numeric readiness score and descriptive tier."""
        res = generate_candidate_explanation(self.sample_analysis)
        self.assertIn("68/100", res.overview)
        self.assertIn("moderately ready", res.overview.lower())

    def test_4_strengths_are_derived_from_analysis(self):
        """4. Strengths reflect skills identified with strong or partial evidence."""
        res = generate_candidate_explanation(self.sample_analysis)
        strengths_text = " ".join(res.strengths)
        self.assertIn("Python", strengths_text)
        self.assertIn("Git", strengths_text)

    def test_5_gaps_are_derived_from_analysis(self):
        """5. Priority gaps reflect skills requiring development."""
        res = generate_candidate_explanation(self.sample_analysis)
        gaps_text = " ".join(res.priority_gaps)
        self.assertIn("Machine Learning", gaps_text)
        self.assertIn("Data Structures & Algorithms", gaps_text)

    def test_6_recommendations_are_derived_from_roadmap(self):
        """6. Recommendations reflect projects and milestones in the roadmap."""
        res = generate_candidate_explanation(self.sample_analysis)
        recs_text = " ".join(res.recommendations)
        self.assertIn("Machine Learning", recs_text)
        self.assertIn("predictive machine learning pipeline", recs_text)

    def test_7_no_mastery_claims(self):
        """7. Output strictly avoids claims of proven capability or mastery."""
        res = generate_candidate_explanation(self.sample_analysis)
        full_text = f"{res.overview} {res.explanation} {' '.join(res.strengths)}".lower()

        forbidden_words = [
            "mastered",
            "mastery",
            "expert",
            "guaranteed",
            "proven",
            "definitely know",
            "definitely knows",
            "proves you know",
            "guaranteed to get",
        ]
        for term in forbidden_words:
            self.assertNotIn(term, full_text)

    def test_8_no_unsupported_claims(self):
        """8. Generated points refer only to skills in the input analysis."""
        res = generate_candidate_explanation(self.sample_analysis)
        strengths_text = " ".join(res.strengths)
        # Skills not in sample_analysis must not appear
        self.assertNotIn("Rust", strengths_text)
        self.assertNotIn("Photoshop", strengths_text)

    def test_9_provider_interface_works(self):
        """9. Custom provider conforming to LLMProvider interface executes successfully."""
        class MockCustomProvider(LLMProvider):
            def generate_explanation(self, analysis, candidate_context=None, tone=None):
                return LLMExplanationResponse(
                    overview="Custom mock overview.",
                    strengths=["Custom strength."],
                    priority_gaps=["Custom gap."],
                    recommendations=["Custom rec."],
                    explanation="Custom explanation.",
                    disclaimer="Custom disclaimer.",
                )

        custom_provider = MockCustomProvider()
        res = generate_candidate_explanation(self.sample_analysis, provider=custom_provider)
        self.assertEqual(res.overview, "Custom mock overview.")
        self.assertEqual(res.strengths, ["Custom strength."])

    def test_10_provider_failure_triggers_fallback(self):
        """10. Provider errors (e.g. network failure) safely trigger fallback without crashing."""
        class FailingProvider(LLMProvider):
            def generate_explanation(self, analysis, candidate_context=None, tone=None):
                raise RuntimeError("External network connection timeout.")

        failing_provider = FailingProvider()
        res = generate_candidate_explanation(self.sample_analysis, provider=failing_provider)

        # Fallback executed cleanly
        self.assertIsInstance(res, LLMExplanationResponse)
        self.assertIn("AI Engineer", res.overview)
        self.assertIn("68/100", res.overview)

    def test_11_original_analysis_remains_unchanged(self):
        """11. Service ensures the caller's original analysis object is never mutated."""
        class MutatingProvider(LLMProvider):
            def generate_explanation(self, analysis, candidate_context=None, tone=None):
                # Maliciously attempt mutation
                analysis["readiness_score"] = 999
                analysis["skill_matches"].clear()
                raise RuntimeError("Simulate failure after mutation.")

        original_copy = copy.deepcopy(self.sample_analysis)
        generate_candidate_explanation(self.sample_analysis, provider=MutatingProvider())

        self.assertEqual(self.sample_analysis["readiness_score"], original_copy["readiness_score"])
        self.assertEqual(len(self.sample_analysis["skill_matches"]), len(original_copy["skill_matches"]))

    def test_12_deterministic_repeated_execution(self):
        """12. Repeated calls with identical inputs produce identical responses."""
        res1 = generate_candidate_explanation(self.sample_analysis)
        res2 = generate_candidate_explanation(self.sample_analysis)

        self.assertEqual(res1.overview, res2.overview)
        self.assertEqual(res1.strengths, res2.strengths)
        self.assertEqual(res1.priority_gaps, res2.priority_gaps)
        self.assertEqual(res1.recommendations, res2.recommendations)
        self.assertEqual(res1.explanation, res2.explanation)

    def test_13_empty_strengths_handled(self):
        """13. Analysis with no strong matches produces a constructive fallback message."""
        no_strengths_analysis = {
            "target_role": "AI Engineer",
            "readiness_score": 0,
            "readiness_label": "Needs Significant Development",
            "skill_matches": [],
            "skill_gaps": [],
            "roadmap": [],
        }
        res = generate_candidate_explanation(no_strengths_analysis)
        self.assertTrue(len(res.strengths) > 0)
        self.assertIn("No skills currently meet the strong evidence support threshold", res.strengths[0])

    def test_14_empty_gaps_handled(self):
        """14. Analysis with no gaps (all skills strongly supported) produces a clean message."""
        no_gaps_analysis = {
            "target_role": "AI Engineer",
            "readiness_score": 85,
            "readiness_label": "Strongly Ready",
            "skill_matches": [
                {"skill_name": "Python", "match_status": "strong_match", "candidate_confidence": 0.85}
            ],
            "skill_gaps": [],
            "roadmap": [],
        }
        res = generate_candidate_explanation(no_gaps_analysis)
        self.assertTrue(len(res.priority_gaps) > 0)
        self.assertIn("No critical skill gaps identified", res.priority_gaps[0])

    def test_15_empty_roadmap_handled(self):
        """15. Analysis with an empty roadmap produces an appropriate maintenance action."""
        no_roadmap_analysis = {
            "target_role": "AI Engineer",
            "readiness_score": 85,
            "readiness_label": "Strongly Ready",
            "skill_matches": [],
            "skill_gaps": [],
            "roadmap": [],
        }
        res = generate_candidate_explanation(no_roadmap_analysis)
        self.assertTrue(len(res.recommendations) > 0)
        self.assertIn("Maintain active project repositories", res.recommendations[0])

    def test_16_disclaimer_exists(self):
        """16. Standard disclaimer is included and clarifies evidence basis."""
        res = generate_candidate_explanation(self.sample_analysis)
        self.assertIsInstance(res.disclaimer, str)
        self.assertIn("evidence-based employability readiness", res.disclaimer)
        self.assertIn("does not provide hiring guarantees", res.disclaimer)


if __name__ == "__main__":
    unittest.main()
