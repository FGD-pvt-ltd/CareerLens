"""
Unit Tests for Personalized Improvement Roadmap Engine

Verifies deterministic roadmap generation, milestone prioritization, effort estimation,
curated learning actions, realistic student projects, evidence recommendations,
and graceful fallback handling.
"""

import os
import sys
import unittest

# Ensure ai-service root is in Python module search path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from config.roadmap_actions import get_skill_roadmap_actions
from services.roadmap_service import (
    estimate_roadmap_effort,
    generate_personalized_roadmap,
    generate_roadmap_reason,
)


class TestPersonalizedRoadmap(unittest.TestCase):
    """Test suite covering the 15 required scenarios for personalized roadmaps."""

    def test_1_missing_high_priority_skill_generates_roadmap_item(self):
        """1. Missing high-priority skill (e.g. ML for AI Engineer) generates a top roadmap item."""
        candidate = [
            {"skill_name": "Python", "confidence": 0.85, "evidence_status": "strongly_supported"},
        ]
        res = generate_personalized_roadmap("AI Engineer", candidate)

        ml_item = next((item for item in res.roadmap_items if item.skill_name == "Machine Learning"), None)
        self.assertIsNotNone(ml_item)
        self.assertEqual(ml_item.importance, "high")
        self.assertEqual(ml_item.gap_severity, "high")
        self.assertEqual(ml_item.priority, 1)  # High imp, 0.0 conf -> top priority
        self.assertIn("machine learning", ml_item.goal.lower())
        self.assertTrue(len(ml_item.recommended_actions) >= 3)
        self.assertTrue(len(ml_item.suggested_evidence) >= 2)
        self.assertTrue(len(ml_item.suggested_project) > 10)

    def test_2_medium_gap_generates_roadmap_item(self):
        """2. Medium importance gap (e.g. SQL or Docker) generates a roadmap item."""
        candidate = [
            {"skill_name": "Python", "confidence": 0.85, "evidence_status": "strongly_supported"},
            {"skill_name": "Docker", "confidence": 0.45, "evidence_status": "partially_supported"},
        ]
        res = generate_personalized_roadmap("AI Engineer", candidate)

        docker_item = next((item for item in res.roadmap_items if item.skill_name == "Docker"), None)
        self.assertIsNotNone(docker_item)
        self.assertEqual(docker_item.skill_name, "Docker")
        self.assertEqual(docker_item.current_confidence, 0.45)
        self.assertIn("Dockerfile", " ".join(docker_item.suggested_evidence))
        self.assertIn("Docker", docker_item.suggested_project)

    def test_3_low_gap_generates_roadmap_item(self):
        """3. Low importance gap (e.g. FastAPI for AI Engineer) generates a roadmap item."""
        candidate = [
            {"skill_name": "Python", "confidence": 0.85, "evidence_status": "strongly_supported"},
        ]
        res = generate_personalized_roadmap("AI Engineer", candidate)

        fastapi_item = next((item for item in res.roadmap_items if item.skill_name == "FastAPI"), None)
        self.assertIsNotNone(fastapi_item)
        self.assertEqual(fastapi_item.importance, "low")
        self.assertEqual(fastapi_item.gap_severity, "medium")  # low imp + 0.0 conf = medium severity
        self.assertTrue(len(fastapi_item.recommended_actions) > 0)
        self.assertIn("FastAPI", fastapi_item.goal)

    def test_4_strongly_supported_skill_does_not_generate_gap_roadmap_item(self):
        """4. Strongly supported skills (confidence >= 0.70) are excluded from the roadmap."""
        candidate = [
            {"skill_name": "Python", "confidence": 0.85, "evidence_status": "strongly_supported"},
            {"skill_name": "Machine Learning", "confidence": 0.80, "evidence_status": "strongly_supported"},
        ]
        res = generate_personalized_roadmap("AI Engineer", candidate)

        roadmap_skill_names = [item.skill_name for item in res.roadmap_items]
        self.assertNotIn("Python", roadmap_skill_names)
        self.assertNotIn("Machine Learning", roadmap_skill_names)

        # Candidate with all role skills strongly supported receives an empty roadmap
        all_strong = [
            {"skill_name": "Python", "confidence": 0.85},
            {"skill_name": "Machine Learning", "confidence": 0.85},
            {"skill_name": "Data Structures & Algorithms", "confidence": 0.85},
            {"skill_name": "SQL", "confidence": 0.85},
            {"skill_name": "Git", "confidence": 0.85},
            {"skill_name": "Docker", "confidence": 0.85},
            {"skill_name": "FastAPI", "confidence": 0.85},
        ]
        res_empty = generate_personalized_roadmap("AI Engineer", all_strong)
        self.assertEqual(res_empty.total_roadmap_items, 0)
        self.assertEqual(len(res_empty.roadmap_items), 0)

    def test_5_roadmap_ordering_is_correct(self):
        """5. Roadmap items are sorted by severity (high > med > low), weight desc, and confidence asc."""
        candidate = [
            {"skill_name": "Python", "confidence": 0.55},     # high imp (1.0), conf 0.55 -> severity "medium"
            {"skill_name": "FastAPI", "confidence": 0.55},    # low imp (0.3), conf 0.55 -> severity "low"
            # Machine Learning is missing: high imp (1.0), conf 0.0 -> severity "high"
            # DSA is missing: medium imp (0.6), conf 0.0 -> severity "high"
        ]
        res = generate_personalized_roadmap("AI Engineer", candidate)

        severities = [item.gap_severity for item in res.roadmap_items]
        high_indices = [i for i, s in enumerate(severities) if s == "high"]
        med_indices = [i for i, s in enumerate(severities) if s == "medium"]
        low_indices = [i for i, s in enumerate(severities) if s == "low"]

        # All high-severity items precede medium-severity items
        self.assertTrue(max(high_indices) < min(med_indices))
        # All medium-severity items precede low-severity items
        self.assertTrue(max(med_indices) < min(low_indices))

        # First item is Machine Learning (high severity, weight 1.0)
        self.assertEqual(res.roadmap_items[0].skill_name, "Machine Learning")

    def test_6_priority_numbering_is_correct(self):
        """6. Priorities are numbered sequentially starting from 1 (1 = highest priority)."""
        res = generate_personalized_roadmap("AI Engineer", [])
        expected_priorities = list(range(1, len(res.roadmap_items) + 1))
        actual_priorities = [item.priority for item in res.roadmap_items]
        self.assertEqual(actual_priorities, expected_priorities)

    def test_7_correct_effort_category(self):
        """7. Estimated effort strictly maps to deterministic gap severity and importance rules."""
        # High severity + high importance -> 1–2 months
        self.assertEqual(estimate_roadmap_effort("high", "high"), "1–2 months")

        # High severity + medium/low importance -> 2–4 weeks
        self.assertEqual(estimate_roadmap_effort("high", "medium"), "2–4 weeks")
        self.assertEqual(estimate_roadmap_effort("high", "low"), "2–4 weeks")

        # Medium severity + high/medium importance -> 2–4 weeks
        self.assertEqual(estimate_roadmap_effort("medium", "high"), "2–4 weeks")
        self.assertEqual(estimate_roadmap_effort("medium", "medium"), "2–4 weeks")

        # Medium severity + low importance -> 1–2 weeks
        self.assertEqual(estimate_roadmap_effort("medium", "low"), "1–2 weeks")

        # Low severity -> 1–2 weeks
        self.assertEqual(estimate_roadmap_effort("low", "high"), "1–2 weeks")
        self.assertEqual(estimate_roadmap_effort("low", "medium"), "1–2 weeks")
        self.assertEqual(estimate_roadmap_effort("low", "low"), "1–2 weeks")

    def test_8_actions_exist(self):
        """8. Every roadmap item includes non-empty, actionable recommended steps."""
        res = generate_personalized_roadmap("AI Engineer", [])
        for item in res.roadmap_items:
            self.assertIsInstance(item.recommended_actions, list)
            self.assertTrue(len(item.recommended_actions) >= 3)
            for action in item.recommended_actions:
                self.assertTrue(len(action.strip()) > 5)

    def test_9_project_suggestion_exists(self):
        """9. Every roadmap item includes a concrete student-friendly project suggestion."""
        res = generate_personalized_roadmap("AI Engineer", [])
        for item in res.roadmap_items:
            self.assertIsInstance(item.suggested_project, str)
            self.assertTrue(len(item.suggested_project.strip()) > 10)

    def test_10_suggested_evidence_exists(self):
        """10. Every roadmap item includes observable evidence artifacts to create."""
        res = generate_personalized_roadmap("AI Engineer", [])
        for item in res.roadmap_items:
            self.assertIsInstance(item.suggested_evidence, list)
            self.assertTrue(len(item.suggested_evidence) >= 2)
            for ev in item.suggested_evidence:
                self.assertTrue(len(ev.strip()) > 3)

    def test_11_every_roadmap_item_has_a_goal(self):
        """11. Every roadmap item has a clearly articulated demonstrable capability goal."""
        res = generate_personalized_roadmap("AI Engineer", [])
        for item in res.roadmap_items:
            self.assertIsInstance(item.goal, str)
            self.assertTrue(len(item.goal.strip()) > 10)

    def test_12_unknown_skill_uses_generic_fallback(self):
        """12. Unlisted or niche skills receive a structured, useful generic fallback."""
        guidance = get_skill_roadmap_actions("Quantum Cryptography")
        self.assertIn("Quantum Cryptography", guidance["goal"])
        self.assertTrue(len(guidance["recommended_actions"]) >= 4)
        self.assertIn("Quantum Cryptography", guidance["suggested_project"])
        self.assertTrue(len(guidance["suggested_evidence"]) >= 2)

    def test_13_unknown_role_is_handled_correctly(self):
        """13. Unknown role queries raise ValueError listing supported roles."""
        with self.assertRaises(ValueError) as ctx:
            generate_personalized_roadmap("Game Designer", [])
        self.assertIn("Supported roles", str(ctx.exception))

    def test_14_no_duplicate_roadmap_items(self):
        """14. Duplicate candidate skill inputs do not result in duplicated roadmap items."""
        duplicate_skills = [
            {"skill_name": "Docker", "confidence": 0.20},
            {"skill_name": "Docker", "confidence": 0.45},
        ]
        res = generate_personalized_roadmap("AI Engineer", duplicate_skills)
        docker_items = [it for it in res.roadmap_items if it.skill_name == "Docker"]
        self.assertEqual(len(docker_items), 1)

    def test_15_roadmap_generation_is_deterministic(self):
        """15. Repeated roadmap generation calls yield identical priorities, actions, and projects."""
        res1 = generate_personalized_roadmap("Software Engineer", [])
        res2 = generate_personalized_roadmap("Software Engineer", [])

        self.assertEqual(res1.total_roadmap_items, res2.total_roadmap_items)
        self.assertEqual(res1.high_priority_items, res2.high_priority_items)
        for it1, it2 in zip(res1.roadmap_items, res2.roadmap_items):
            self.assertEqual(it1.skill_name, it2.skill_name)
            self.assertEqual(it1.priority, it2.priority)
            self.assertEqual(it1.goal, it2.goal)
            self.assertEqual(it1.suggested_project, it2.suggested_project)
            self.assertEqual(it1.estimated_effort, it2.estimated_effort)
            self.assertEqual(it1.recommended_actions, it2.recommended_actions)
            self.assertEqual(it1.suggested_evidence, it2.suggested_evidence)


if __name__ == "__main__":
    unittest.main()
