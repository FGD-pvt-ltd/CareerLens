"""
Unit Tests for Job Readiness Scoring and Skill Gap Engine

Verifies deterministic readiness score calculation, readiness tiers, boundary handling,
gap identification, gap severity categorization, prioritization, and explainability.
"""

import os
import sys
import unittest

# Ensure ai-service root is in Python module search path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from services.gap_service import (
    determine_gap_severity,
    generate_gap_explanation,
    identify_and_prioritize_gaps,
)
from services.readiness_service import (
    analyze_job_readiness,
    calculate_readiness_score,
    get_readiness_score_label,
)


class TestJobReadinessAndGaps(unittest.TestCase):
    """Test suite covering the 18 required scenarios for job readiness and skill gaps."""

    def test_1_all_skills_strongly_supported(self):
        """1. Candidate with all role skills strongly supported achieves high score and 0 gaps."""
        ai_skills = [
            {"skill_name": "Python", "confidence": 0.85, "evidence_status": "strongly_supported", "evidence_strength": "strong"},
            {"skill_name": "Machine Learning", "confidence": 0.85, "evidence_status": "strongly_supported", "evidence_strength": "strong"},
            {"skill_name": "Data Structures & Algorithms", "confidence": 0.85, "evidence_status": "strongly_supported", "evidence_strength": "strong"},
            {"skill_name": "SQL", "confidence": 0.85, "evidence_status": "strongly_supported", "evidence_strength": "strong"},
            {"skill_name": "Git", "confidence": 0.85, "evidence_status": "strongly_supported", "evidence_strength": "strong"},
            {"skill_name": "Docker", "confidence": 0.85, "evidence_status": "strongly_supported", "evidence_strength": "strong"},
            {"skill_name": "FastAPI", "confidence": 0.85, "evidence_status": "strongly_supported", "evidence_strength": "strong"},
        ]
        res = analyze_job_readiness("AI Engineer", ai_skills)

        self.assertEqual(res.strong_matches, 7)
        self.assertEqual(res.partial_matches, 0)
        self.assertEqual(res.gaps, 0)
        self.assertEqual(len(res.skill_gaps), 0)
        self.assertEqual(res.readiness_score, 85)
        self.assertEqual(res.score_label, "Strongly Ready")
        self.assertIn("readiness score of 85/100", res.explanation)

    def test_2_no_candidate_skills(self):
        """2. Candidate with no skills yields 0 readiness score, all skills as gaps."""
        res = analyze_job_readiness("AI Engineer", [])

        self.assertEqual(res.readiness_score, 0)
        self.assertEqual(res.score_label, "Needs Significant Development")
        self.assertEqual(res.weighted_score, 0.0)
        self.assertEqual(res.total_required_skills, 7)
        self.assertEqual(res.strong_matches, 0)
        self.assertEqual(res.partial_matches, 0)
        self.assertEqual(res.gaps, 7)
        self.assertEqual(len(res.skill_gaps), 7)
        self.assertIn("readiness score of 0/100", res.explanation)

    def test_3_no_evidence(self):
        """3. Candidate claims skills with 0.0 confidence results in insufficient evidence and 0 score."""
        claimed_unverified = [
            {"skill_name": "Python", "confidence": 0.0, "evidence_status": "insufficient_evidence"},
            {"skill_name": "Machine Learning", "confidence": 0.0, "evidence_status": "insufficient_evidence"},
        ]
        res = analyze_job_readiness("AI Engineer", claimed_unverified)

        self.assertEqual(res.readiness_score, 0)
        self.assertEqual(res.weighted_score, 0.0)
        for gap in res.skill_gaps:
            self.assertIn("no supporting evidence was available", gap.explanation.lower())

    def test_4_mixed_strong_partial_gap_skills(self):
        """4. Candidate with mixed support levels yields accurate category breakdown and gaps."""
        mixed_skills = [
            {"skill_name": "Python", "confidence": 0.85, "evidence_status": "strongly_supported", "evidence_strength": "strong"},
            {"skill_name": "Machine Learning", "confidence": 0.80, "evidence_status": "strongly_supported", "evidence_strength": "strong"},
            {"skill_name": "SQL", "confidence": 0.60, "evidence_status": "partially_supported", "evidence_strength": "moderate"},
            {"skill_name": "Docker", "confidence": 0.45, "evidence_status": "partially_supported", "evidence_strength": "weak"},
        ]
        res = analyze_job_readiness("AI Engineer", mixed_skills)

        self.assertEqual(res.strong_matches, 2)
        self.assertEqual(res.partial_matches, 1)  # SQL (0.60)
        self.assertEqual(res.gaps, 4)  # Docker (0.45) + DSA, Git, FastAPI (0.0)
        self.assertEqual(res.total_required_skills, 7)
        # All requirements with confidence < 0.70 must appear in skill_gaps
        self.assertEqual(len(res.skill_gaps), 5)

        gap_names = [g.skill_name for g in res.skill_gaps]
        self.assertIn("SQL", gap_names)
        self.assertIn("Docker", gap_names)
        self.assertIn("Data Structures & Algorithms", gap_names)
        self.assertNotIn("Python", gap_names)
        self.assertNotIn("Machine Learning", gap_names)

    def test_5_score_calculation(self):
        """5. Readiness score matches (sum of weighted contributions / sum of weights) * 100."""
        skills = [
            {"skill_name": "Python", "confidence": 0.85},
            {"skill_name": "Machine Learning", "confidence": 0.80},
            {"skill_name": "Docker", "confidence": 0.45},
        ]
        res = analyze_job_readiness("AI Engineer", skills)

        # Python: 0.85 * 1.0 = 0.85
        # ML: 0.80 * 1.0 = 0.80
        # Docker: 0.45 * 0.6 = 0.27
        # Total weighted score: 0.85 + 0.80 + 0.27 = 1.92
        # Max score: 1.0 + 1.0 + 0.6*4 + 0.3 = 4.7
        # Expected: round((1.92 / 4.7) * 100) = round(40.85) = 41
        self.assertEqual(res.weighted_score, 1.92)
        self.assertEqual(res.maximum_possible_score, 4.7)
        self.assertEqual(res.readiness_score, 41)
        self.assertEqual(res.score_label, "Developing")

    def test_6_score_never_exceeds_100(self):
        """6. Score never exceeds 100, even under boundary conditions."""
        self.assertEqual(calculate_readiness_score(150.0, 100.0), 100)
        self.assertEqual(calculate_readiness_score(999.0, 10.0), 100)

    def test_7_score_never_falls_below_0(self):
        """7. Score never falls below 0."""
        self.assertEqual(calculate_readiness_score(-10.0, 100.0), 0)
        self.assertEqual(calculate_readiness_score(0.0, 0.0), 0)

    def test_8_score_label_boundaries(self):
        """8. Descriptive score labels respect all defined numeric thresholds."""
        # 0–39: Needs Significant Development
        self.assertEqual(get_readiness_score_label(0), "Needs Significant Development")
        self.assertEqual(get_readiness_score_label(39), "Needs Significant Development")

        # 40–59: Developing
        self.assertEqual(get_readiness_score_label(40), "Developing")
        self.assertEqual(get_readiness_score_label(59), "Developing")

        # 60–74: Moderately Ready
        self.assertEqual(get_readiness_score_label(60), "Moderately Ready")
        self.assertEqual(get_readiness_score_label(74), "Moderately Ready")

        # 75–89: Strongly Ready
        self.assertEqual(get_readiness_score_label(75), "Strongly Ready")
        self.assertEqual(get_readiness_score_label(89), "Strongly Ready")

        # 90–100: Highly Ready
        self.assertEqual(get_readiness_score_label(90), "Highly Ready")
        self.assertEqual(get_readiness_score_label(95), "Highly Ready")
        self.assertEqual(get_readiness_score_label(100), "Highly Ready")

    def test_9_high_severity_gaps(self):
        """9. High and medium importance skills with confidence < 0.50 are categorized as 'high' severity."""
        self.assertEqual(determine_gap_severity("high", 0.0), "high")
        self.assertEqual(determine_gap_severity("high", 0.45), "high")
        self.assertEqual(determine_gap_severity("medium", 0.0), "high")
        self.assertEqual(determine_gap_severity("medium", 0.49), "high")

    def test_10_medium_severity_gaps(self):
        """10. High/medium with 0.50 <= conf < 0.70 and low with conf < 0.50 are 'medium' severity."""
        self.assertEqual(determine_gap_severity("high", 0.50), "medium")
        self.assertEqual(determine_gap_severity("high", 0.69), "medium")
        self.assertEqual(determine_gap_severity("medium", 0.50), "medium")
        self.assertEqual(determine_gap_severity("medium", 0.65), "medium")
        self.assertEqual(determine_gap_severity("low", 0.0), "medium")
        self.assertEqual(determine_gap_severity("low", 0.45), "medium")

    def test_11_low_severity_gaps(self):
        """11. Low importance skills with 0.50 <= conf < 0.70 are categorized as 'low' severity."""
        self.assertEqual(determine_gap_severity("low", 0.50), "low")
        self.assertEqual(determine_gap_severity("low", 0.60), "low")
        self.assertEqual(determine_gap_severity("low", 0.69), "low")

    def test_12_gap_prioritization(self):
        """12. Gaps are sorted by severity (high > medium > low), then weight desc, then confidence asc."""
        # Candidate missing ML (high imp, 0.0), SQL (medium imp, 0.0), Docker (medium imp, 0.45),
        # Python (high imp, 0.55), FastAPI (low imp, 0.55)
        candidate = [
            {"skill_name": "Python", "confidence": 0.55},     # high imp (1.0), conf 0.55 -> severity "medium"
            {"skill_name": "Docker", "confidence": 0.45},     # medium imp (0.6), conf 0.45 -> severity "high"
            {"skill_name": "FastAPI", "confidence": 0.55},    # low imp (0.3), conf 0.55 -> severity "low"
            # Machine Learning is missing: high imp (1.0), conf 0.0 -> severity "high"
            # DSA is missing: medium imp (0.6), conf 0.0 -> severity "high"
        ]
        res = analyze_job_readiness("AI Engineer", candidate)

        # High severity gaps:
        # Machine Learning: high imp (1.0), conf 0.0
        # DSA: medium imp (0.6), conf 0.0
        # Git: medium imp (0.6), conf 0.0
        # SQL: medium imp (0.6), conf 0.0
        # Docker: medium imp (0.6), conf 0.45
        # Medium severity gaps:
        # Python: high imp (1.0), conf 0.55
        # Low severity gaps:
        # FastAPI: low imp (0.3), conf 0.55

        gaps = res.skill_gaps
        first_gap = gaps[0]
        self.assertEqual(first_gap.skill_name, "Machine Learning")
        self.assertEqual(first_gap.gap_severity, "high")
        self.assertEqual(first_gap.importance_weight, 1.0)
        self.assertEqual(first_gap.candidate_confidence, 0.0)

        # Verify that all 'high' severity gaps precede 'medium', which precede 'low'
        seen_severities = [g.gap_severity for g in gaps]
        high_indices = [i for i, s in enumerate(seen_severities) if s == "high"]
        med_indices = [i for i, s in enumerate(seen_severities) if s == "medium"]
        low_indices = [i for i, s in enumerate(seen_severities) if s == "low"]

        self.assertTrue(max(high_indices) < min(med_indices))
        self.assertTrue(max(med_indices) < min(low_indices))

        # Verify Docker (conf 0.45) comes after DSA/SQL/Git (conf 0.0) within medium weight (0.6)
        docker_idx = next(i for i, g in enumerate(gaps) if g.skill_name == "Docker")
        dsa_idx = next(i for i, g in enumerate(gaps) if g.skill_name == "Data Structures & Algorithms")
        self.assertTrue(dsa_idx < docker_idx)

    def test_13_extra_candidate_skills_ignored(self):
        """13. Extra candidate skills outside the role requirements do not inflate or penalize readiness."""
        base_skills = [
            {"skill_name": "Python", "confidence": 0.85},
            {"skill_name": "Machine Learning", "confidence": 0.80},
        ]
        res_base = analyze_job_readiness("AI Engineer", base_skills)

        skills_with_extras = base_skills + [
            {"skill_name": "React", "confidence": 0.90},
            {"skill_name": "Photoshop", "confidence": 0.85},
            {"skill_name": "Vue.js", "confidence": 0.80},
        ]
        res_with_extras = analyze_job_readiness("AI Engineer", skills_with_extras)

        self.assertEqual(res_base.readiness_score, res_with_extras.readiness_score)
        self.assertEqual(res_base.weighted_score, res_with_extras.weighted_score)
        self.assertEqual(res_base.maximum_possible_score, res_with_extras.maximum_possible_score)
        self.assertEqual(res_base.gaps, res_with_extras.gaps)
        self.assertEqual(len(res_base.skill_gaps), len(res_with_extras.skill_gaps))

    def test_14_unknown_role_handling(self):
        """14. Unknown role inputs raise ValueError listing supported roles."""
        with self.assertRaises(ValueError) as ctx:
            analyze_job_readiness("NonExistentRole", [])
        self.assertIn("Supported roles", str(ctx.exception))

        with self.assertRaises(ValueError):
            analyze_job_readiness("", [])

    def test_15_duplicate_candidate_skills(self):
        """15. Duplicate candidate skills preserve the higher evidence confidence."""
        duplicate_skills = [
            {"skill_name": "Python", "confidence": 0.40},
            {"skill_name": "Python", "confidence": 0.85},
        ]
        res = analyze_job_readiness("AI Engineer", duplicate_skills)

        self.assertEqual(res.strong_matches, 1)  # Python at 0.85 is strong
        self.assertNotIn("Python", [g.skill_name for g in res.skill_gaps])

    def test_16_confidence_clamping(self):
        """16. Confidence values outside [0.0, 0.95] are safely clamped."""
        out_of_bounds = [
            {"skill_name": "Python", "confidence": 1.5},
            {"skill_name": "Machine Learning", "confidence": -0.5},
        ]
        res = analyze_job_readiness("AI Engineer", out_of_bounds)

        # Python should clamp to 0.95
        # ML should clamp to 0.0
        ml_gap = next(g for g in res.skill_gaps if g.skill_name == "Machine Learning")
        self.assertEqual(ml_gap.candidate_confidence, 0.0)

    def test_17_zero_confidence_candidate(self):
        """17. Candidate with 0.0 on all skills receives a readiness score of 0."""
        zero_skills = [
            {"skill_name": "Python", "confidence": 0.0},
            {"skill_name": "Machine Learning", "confidence": 0.0},
            {"skill_name": "Docker", "confidence": 0.0},
        ]
        res = analyze_job_readiness("AI Engineer", zero_skills)
        self.assertEqual(res.readiness_score, 0)
        self.assertEqual(res.score_label, "Needs Significant Development")

    def test_18_maximum_confidence_candidate(self):
        """18. Candidate with 0.95 on all role skills achieves 95 (not artificially 100)."""
        max_skills = [
            {"skill_name": "Python", "confidence": 0.95},
            {"skill_name": "Machine Learning", "confidence": 0.95},
            {"skill_name": "Data Structures & Algorithms", "confidence": 0.95},
            {"skill_name": "SQL", "confidence": 0.95},
            {"skill_name": "Git", "confidence": 0.95},
            {"skill_name": "Docker", "confidence": 0.95},
            {"skill_name": "FastAPI", "confidence": 0.95},
        ]
        res = analyze_job_readiness("AI Engineer", max_skills)

        self.assertEqual(res.readiness_score, 95)
        self.assertEqual(res.score_label, "Highly Ready")
        self.assertEqual(res.gaps, 0)
        self.assertEqual(len(res.skill_gaps), 0)


if __name__ == "__main__":
    unittest.main()
