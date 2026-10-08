import os
import sys
import unittest

# Ensure ai-service root is in Python module search path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from config.role_requirements import get_supported_roles
from services.role_service import resolve_role_requirements


class TestRoleRequirements(unittest.TestCase):
    """
    Test suite for the Role Requirements service verifying role resolution,
    alias matching, canonical skill mapping, importance weights, and counts.
    """

    def test_1_ai_engineer_role_resolution(self):
        """1. Verify standard 'AI Engineer' role resolution and expected skills."""
        res = resolve_role_requirements("AI Engineer")

        self.assertEqual(res.role, "AI Engineer")
        self.assertEqual(res.matched_role, "AI Engineer")
        self.assertEqual(res.total_required_skills, 7)

        skill_map = {s.skill_name: s for s in res.skills_required}
        self.assertIn("Python", skill_map)
        self.assertIn("Machine Learning", skill_map)
        self.assertIn("Data Structures & Algorithms", skill_map)
        self.assertIn("SQL", skill_map)
        self.assertIn("Git", skill_map)
        self.assertIn("Docker", skill_map)
        self.assertIn("FastAPI", skill_map)

        self.assertEqual(skill_map["Python"].importance, "high")
        self.assertEqual(skill_map["Machine Learning"].importance, "high")
        self.assertEqual(skill_map["FastAPI"].importance, "low")

    def test_2_ai_ml_engineer_alias_resolution(self):
        """2. Verify that aliases like 'AI/ML Engineer' and 'Machine Learning Engineer' resolve to AI Engineer."""
        aliases = ["AI/ML Engineer", "ai ml engineer", "Machine Learning Engineer", "ml engineer"]
        for alias in aliases:
            res = resolve_role_requirements(alias)
            self.assertEqual(res.matched_role, "AI Engineer")
            self.assertEqual(res.total_required_skills, 7)

    def test_3_software_engineer_role_resolution(self):
        """3. Verify standard 'Software Engineer' role resolution and expected skills."""
        res = resolve_role_requirements("Software Engineer")

        self.assertEqual(res.matched_role, "Software Engineer")
        self.assertEqual(res.total_required_skills, 7)

        skill_map = {s.skill_name: s for s in res.skills_required}
        self.assertIn("Data Structures & Algorithms", skill_map)
        self.assertIn("Object-Oriented Programming", skill_map)
        self.assertIn("System Design", skill_map)

        self.assertEqual(skill_map["Data Structures & Algorithms"].importance, "high")
        self.assertEqual(skill_map["Object-Oriented Programming"].importance, "high")
        self.assertEqual(skill_map["System Design"].importance, "low")

    def test_4_sde_alias_resolution(self):
        """4. Verify that aliases like 'SDE', 'Software Developer', and 'SWE' resolve to Software Engineer."""
        aliases = ["SDE", "sde 1", "sde-1", "Software Developer", "swe"]
        for alias in aliases:
            res = resolve_role_requirements(alias)
            self.assertEqual(res.matched_role, "Software Engineer")

    def test_5_data_scientist_role_resolution(self):
        """5. Verify 'Data Scientist' role and 'DS' alias resolution."""
        for alias in ["Data Scientist", "DS", "ds"]:
            res = resolve_role_requirements(alias)
            self.assertEqual(res.matched_role, "Data Scientist")
            self.assertEqual(res.total_required_skills, 8)

            skill_map = {s.skill_name: s for s in res.skills_required}
            self.assertEqual(skill_map["Python"].importance, "high")
            self.assertEqual(skill_map["Machine Learning"].importance, "high")
            self.assertEqual(skill_map["Statistics"].importance, "high")
            self.assertEqual(skill_map["SQL"].importance, "high")
            self.assertEqual(skill_map["Pandas"].importance, "medium")
            self.assertEqual(skill_map["NumPy"].importance, "medium")

    def test_6_data_analyst_role_resolution(self):
        """6. Verify 'Data Analyst' and 'Business Data Analyst' resolution."""
        for alias in ["Data Analyst", "Business Data Analyst", "bi analyst"]:
            res = resolve_role_requirements(alias)
            self.assertEqual(res.matched_role, "Data Analyst")
            self.assertEqual(res.total_required_skills, 7)

            skill_map = {s.skill_name: s for s in res.skills_required}
            self.assertEqual(skill_map["SQL"].importance, "high")
            self.assertEqual(skill_map["Excel"].importance, "high")
            self.assertEqual(skill_map["Data Analysis"].importance, "high")
            self.assertEqual(skill_map["Statistics"].importance, "high")
            self.assertEqual(skill_map["Power BI"].importance, "medium")

    def test_7_backend_developer_role_resolution(self):
        """7. Verify 'Backend Developer' and 'Backend Engineer' resolution."""
        for alias in ["Backend Developer", "Backend Engineer", "back-end developer"]:
            res = resolve_role_requirements(alias)
            self.assertEqual(res.matched_role, "Backend Developer")
            self.assertEqual(res.total_required_skills, 7)

            skill_map = {s.skill_name: s for s in res.skills_required}
            self.assertEqual(skill_map["Node.js"].importance, "high")
            self.assertEqual(skill_map["REST APIs"].importance, "high")
            self.assertEqual(skill_map["SQL"].importance, "high")
            self.assertEqual(skill_map["MongoDB"].importance, "medium")
            self.assertEqual(skill_map["System Design"].importance, "medium")

    def test_8_unknown_role_handling(self):
        """8. Unknown or blank roles must return a clear error listing supported roles."""
        invalid_roles = ["Quantum Astronaut", "Photographer", "Architectural Painter", "   ", ""]
        for invalid in invalid_roles:
            with self.assertRaises(ValueError) as ctx:
                resolve_role_requirements(invalid)
            self.assertTrue(len(str(ctx.exception)) > 0)

    def test_9_required_skills_are_canonicalized(self):
        """9. Verify required skills use canonical names and valid categories."""
        for role in get_supported_roles():
            res = resolve_role_requirements(role)
            for skill in res.skills_required:
                self.assertIsInstance(skill.skill_name, str)
                self.assertGreater(len(skill.skill_name), 0)
                # Category must not be empty
                self.assertIsInstance(skill.category, str)
                self.assertGreater(len(skill.category), 0)

    def test_10_importance_weights_are_correct(self):
        """10. Verify that importance levels map accurately to numeric weights."""
        expected_weights = {
            "high": 1.0,
            "medium": 0.6,
            "low": 0.3,
        }
        for role in get_supported_roles():
            res = resolve_role_requirements(role)
            for skill in res.skills_required:
                self.assertIn(skill.importance, expected_weights)
                self.assertEqual(skill.importance_weight, expected_weights[skill.importance])

    def test_11_high_medium_low_counts_are_correct(self):
        """11. Verify that priority counts sum to total_required_skills and match expectations."""
        test_expectations = {
            "AI Engineer": {"high": 2, "medium": 4, "low": 1, "total": 7},
            "Software Engineer": {"high": 2, "medium": 4, "low": 1, "total": 7},
            "Data Scientist": {"high": 4, "medium": 4, "low": 0, "total": 8},
            "Data Analyst": {"high": 4, "medium": 3, "low": 0, "total": 7},
            "Backend Developer": {"high": 3, "medium": 4, "low": 0, "total": 7},
        }

        for role_name, exp in test_expectations.items():
            res = resolve_role_requirements(role_name)
            self.assertEqual(res.total_required_skills, exp["total"])
            self.assertEqual(res.high_priority_skills, exp["high"])
            self.assertEqual(res.medium_priority_skills, exp["medium"])
            self.assertEqual(res.low_priority_skills, exp["low"])
            self.assertEqual(
                res.total_required_skills,
                res.high_priority_skills + res.medium_priority_skills + res.low_priority_skills,
            )

    def test_12_every_required_skill_has_a_description(self):
        """12. Verify that every required skill across all roles has a non-empty explanation description."""
        for role in get_supported_roles():
            res = resolve_role_requirements(role)
            for skill in res.skills_required:
                self.assertIsInstance(skill.description, str)
                self.assertGreater(len(skill.description.strip()), 10)


if __name__ == "__main__":
    unittest.main()
