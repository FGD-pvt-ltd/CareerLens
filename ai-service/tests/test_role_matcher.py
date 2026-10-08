import os
import sys
import unittest

# Ensure ai-service root is in Python module search path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from services.role_matcher import match_candidate_to_role


class TestRoleMatcher(unittest.TestCase):
    """
    Test suite for the Skill-to-Role Matching layer verifying deterministic
    matching, threshold rules, importance weights, and gap handling.
    """

    def setUp(self):
        """Sample candidate skill dataset."""
        self.candidate_skills = [
            {
                "skill_name": "Python",
                "category": "Programming Languages",
                "confidence": 0.85,
                "evidence_status": "strongly_supported",
                "evidence_strength": "strong",
            },
            {
                "skill_name": "Machine Learning",
                "category": "Machine Learning",
                "confidence": 0.80,
                "evidence_status": "strongly_supported",
                "evidence_strength": "strong",
            },
            {
                "skill_name": "SQL",
                "category": "Programming Languages",
                "confidence": 0.60,
                "evidence_status": "partially_supported",
                "evidence_strength": "moderate",
            },
            {
                "skill_name": "Docker",
                "category": "DevOps",
                "confidence": 0.45,
                "evidence_status": "partially_supported",
                "evidence_strength": "weak",
            },
            {
                "skill_name": "React",
                "category": "Web Development",
                "confidence": 0.80,
                "evidence_status": "strongly_supported",
                "evidence_strength": "strong",
            },
            {
                "skill_name": "Photoshop",
                "category": "Tools",
                "confidence": 0.70,
                "evidence_status": "strongly_supported",
                "evidence_strength": "strong",
            },
        ]

    def test_1_strong_candidate_skill_to_strong_match(self):
        """1. Candidate skill with confidence >= 0.70 maps to 'strong_match'."""
        res = match_candidate_to_role("AI Engineer", self.candidate_skills)
        py_match = next(m for m in res.skill_matches if m.skill_name == "Python")

        self.assertEqual(py_match.candidate_confidence, 0.85)
        self.assertEqual(py_match.match_status, "strong_match")
        self.assertIn("strongly supported", py_match.explanation.lower())

    def test_2_medium_confidence_skill_to_partial_match(self):
        """2. Candidate skill with 0.50 <= confidence < 0.70 maps to 'partial_match'."""
        res = match_candidate_to_role("AI Engineer", self.candidate_skills)
        sql_match = next(m for m in res.skill_matches if m.skill_name == "SQL")

        self.assertEqual(sql_match.candidate_confidence, 0.60)
        self.assertEqual(sql_match.match_status, "partial_match")
        self.assertIn("partial evidence support", sql_match.explanation.lower())

    def test_3_low_confidence_skill_to_gap(self):
        """3. Candidate skill with confidence < 0.50 maps to 'gap'."""
        res = match_candidate_to_role("AI Engineer", self.candidate_skills)
        docker_match = next(m for m in res.skill_matches if m.skill_name == "Docker")

        self.assertEqual(docker_match.candidate_confidence, 0.45)
        self.assertEqual(docker_match.match_status, "gap")
        self.assertIn("weak", docker_match.explanation.lower())

    def test_4_missing_candidate_skill_to_gap(self):
        """4. Missing role-required skill has 0.0 confidence and maps to 'gap'."""
        res = match_candidate_to_role("AI Engineer", self.candidate_skills)
        dsa_match = next(m for m in res.skill_matches if m.skill_name == "Data Structures & Algorithms")

        self.assertEqual(dsa_match.candidate_confidence, 0.0)
        self.assertEqual(dsa_match.match_status, "gap")
        self.assertEqual(dsa_match.candidate_evidence_status, "insufficient_evidence")
        self.assertEqual(dsa_match.candidate_evidence_strength, "none")
        self.assertEqual(dsa_match.weighted_match_contribution, 0.0)
        self.assertIn("no supporting evidence was available", dsa_match.explanation.lower())

    def test_5_high_importance_weight_preserved(self):
        """5. High importance requirements preserve weight 1.0."""
        res = match_candidate_to_role("AI Engineer", self.candidate_skills)
        py_match = next(m for m in res.skill_matches if m.skill_name == "Python")

        self.assertEqual(py_match.importance, "high")
        self.assertEqual(py_match.importance_weight, 1.0)

    def test_6_medium_importance_weight_preserved(self):
        """6. Medium importance requirements preserve weight 0.6."""
        res = match_candidate_to_role("AI Engineer", self.candidate_skills)
        sql_match = next(m for m in res.skill_matches if m.skill_name == "SQL")

        self.assertEqual(sql_match.importance, "medium")
        self.assertEqual(sql_match.importance_weight, 0.6)

    def test_7_low_importance_weight_preserved(self):
        """7. Low importance requirements preserve weight 0.3."""
        res = match_candidate_to_role("AI Engineer", self.candidate_skills)
        fastapi_match = next(m for m in res.skill_matches if m.skill_name == "FastAPI")

        self.assertEqual(fastapi_match.importance, "low")
        self.assertEqual(fastapi_match.importance_weight, 0.3)

    def test_8_weighted_contribution_calculation(self):
        """8. Weighted contribution = round(confidence * importance_weight, 2)."""
        res = match_candidate_to_role("AI Engineer", self.candidate_skills)

        # Python: 0.85 * 1.0 = 0.85
        py_match = next(m for m in res.skill_matches if m.skill_name == "Python")
        self.assertEqual(py_match.weighted_match_contribution, 0.85)

        # SQL: 0.60 * 0.6 = 0.36
        sql_match = next(m for m in res.skill_matches if m.skill_name == "SQL")
        self.assertEqual(sql_match.weighted_match_contribution, 0.36)

        # Docker: 0.45 * 0.6 = 0.27
        docker_match = next(m for m in res.skill_matches if m.skill_name == "Docker")
        self.assertEqual(docker_match.weighted_match_contribution, 0.27)

    def test_9_extra_candidate_skills_not_treated_as_gaps(self):
        """9. Candidate skills not required by the role are not treated as gaps."""
        res = match_candidate_to_role("AI Engineer", self.candidate_skills)

        # React and Photoshop are not required by AI Engineer
        matched_skill_names = {m.skill_name for m in res.skill_matches}
        self.assertNotIn("React", matched_skill_names)
        self.assertNotIn("Photoshop", matched_skill_names)

        # They must be tracked separately in unmatched_candidate_skills
        self.assertIn("React", res.unmatched_candidate_skills)
        self.assertIn("Photoshop", res.unmatched_candidate_skills)

        # Gaps count must only reflect role-required skills that are missing/weak
        self.assertEqual(res.skills_evaluated, 7)

    def test_10_canonical_skill_aliases_matching(self):
        """10. Candidate skills using aliases like 'DSA' or 'OOP' match canonical role requirements."""
        alias_candidate = [
            {"skill_name": "DSA", "confidence": 0.80, "evidence_status": "strongly_supported", "evidence_strength": "strong"},
            {"skill_name": "OOP", "confidence": 0.75, "evidence_status": "strongly_supported", "evidence_strength": "strong"},
        ]
        res = match_candidate_to_role("Software Engineer", alias_candidate)

        dsa_match = next(m for m in res.skill_matches if m.skill_name == "Data Structures & Algorithms")
        oop_match = next(m for m in res.skill_matches if m.skill_name == "Object-Oriented Programming")

        self.assertEqual(dsa_match.candidate_confidence, 0.80)
        self.assertEqual(dsa_match.match_status, "strong_match")

        self.assertEqual(oop_match.candidate_confidence, 0.75)
        self.assertEqual(oop_match.match_status, "strong_match")

    def test_11_candidate_evidence_status_preserved(self):
        """11. The candidate's evidence status is accurately recorded in the match item."""
        res = match_candidate_to_role("AI Engineer", self.candidate_skills)
        py_match = next(m for m in res.skill_matches if m.skill_name == "Python")
        docker_match = next(m for m in res.skill_matches if m.skill_name == "Docker")

        self.assertEqual(py_match.candidate_evidence_status, "strongly_supported")
        self.assertEqual(docker_match.candidate_evidence_status, "partially_supported")

    def test_12_candidate_evidence_strength_preserved(self):
        """12. The candidate's evidence strength tier is accurately recorded."""
        res = match_candidate_to_role("AI Engineer", self.candidate_skills)
        py_match = next(m for m in res.skill_matches if m.skill_name == "Python")
        docker_match = next(m for m in res.skill_matches if m.skill_name == "Docker")

        self.assertEqual(py_match.candidate_evidence_strength, "strong")
        self.assertEqual(docker_match.candidate_evidence_strength, "weak")

    def test_13_every_role_requirement_receives_match_result(self):
        """13. Every single requirement of the target role is evaluated."""
        res = match_candidate_to_role("AI Engineer", self.candidate_skills)
        self.assertEqual(len(res.skill_matches), 7)
        self.assertEqual(res.skills_evaluated, 7)
        self.assertEqual(res.strong_matches + res.partial_matches + res.gaps, 7)

    def test_14_matching_is_deterministic(self):
        """14. Repeated executions yield identical outputs."""
        res1 = match_candidate_to_role("Software Engineer", self.candidate_skills)
        res2 = match_candidate_to_role("Software Engineer", self.candidate_skills)

        self.assertEqual(res1.strong_matches, res2.strong_matches)
        self.assertEqual(res1.partial_matches, res2.partial_matches)
        self.assertEqual(res1.gaps, res2.gaps)
        for m1, m2 in zip(res1.skill_matches, res2.skill_matches):
            self.assertEqual(m1.skill_name, m2.skill_name)
            self.assertEqual(m1.weighted_match_contribution, m2.weighted_match_contribution)
            self.assertEqual(m1.explanation, m2.explanation)

    def test_15_numeric_values_rounded_to_two_decimals(self):
        """15. All floating-point scores are rounded to two decimal places."""
        unrounded_candidate = [
            {"skill_name": "Python", "confidence": 0.833333333, "evidence_status": "strongly_supported", "evidence_strength": "strong"}
        ]
        res = match_candidate_to_role("AI Engineer", unrounded_candidate)
        py_match = next(m for m in res.skill_matches if m.skill_name == "Python")

        self.assertEqual(py_match.candidate_confidence, 0.83)
        self.assertEqual(py_match.weighted_match_contribution, 0.83)


if __name__ == "__main__":
    unittest.main()
