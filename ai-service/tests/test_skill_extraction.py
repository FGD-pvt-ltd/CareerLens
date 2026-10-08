import os
import sys
import unittest

# Ensure ai-service root is in Python module search path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from services.skill_extractor import extract_skills_from_text
from services.section_parser import parse_resume_sections


class TestSkillExtraction(unittest.TestCase):
    """Test suite for the skill extraction service."""

    def test_canonical_variations_matching(self):
        """
        Verify that common variations normalize to their canonical skill names:
        - 'Python 3' -> 'Python'
        - 'React.js' -> 'React'
        - 'Node.js' -> 'Node.js'
        - 'Machine Learning' -> 'Machine Learning'
        """
        resume_text = (
            "TECHNICAL SKILLS\n"
            "Languages: Python 3, JavaScript\n"
            "Frameworks: React.js, Node.js\n"
            "Specialization: Machine Learning"
        )
        result = extract_skills_from_text(resume_text)
        detected_names = {s["name"] for s in result["skills_detected_in_resume"]}

        self.assertIn("Python", detected_names)
        self.assertIn("React", detected_names)
        self.assertIn("Node.js", detected_names)
        self.assertIn("Machine Learning", detected_names)
        self.assertIn("JavaScript", detected_names)

        # Ensure variations are not added as separate duplicate names
        self.assertNotIn("Python 3", detected_names)
        self.assertNotIn("React.js", detected_names)

    def test_avoid_duplicate_skills(self):
        """
        Verify that skills appearing multiple times across different sections
        are not duplicated in the output list.
        """
        resume_text = (
            "SKILLS\n"
            "Python 3, Docker, PostgreSQL\n\n"
            "EXPERIENCE\n"
            "Software Engineer - Built backend services using Python and PostgreSQL.\n\n"
            "PROJECTS\n"
            "CareerLens Analyzer - Deployed Python microservice with Docker container."
        )
        result = extract_skills_from_text(resume_text)
        skills = result["skills_detected_in_resume"]

        python_entries = [s for s in skills if s["name"] == "Python"]
        docker_entries = [s for s in skills if s["name"] == "Docker"]
        postgres_entries = [s for s in skills if s["name"] == "PostgreSQL"]

        # Each canonical skill must appear exactly once
        self.assertEqual(len(python_entries), 1)
        self.assertEqual(len(docker_entries), 1)
        self.assertEqual(len(postgres_entries), 1)

        # Python should record all sections where it appeared
        python_sections = python_entries[0]["sections"]
        self.assertIn("skills section", python_sections)
        self.assertIn("experience section", python_sections)
        self.assertIn("projects section", python_sections)

    def test_section_tracking(self):
        """
        Verify that where a skill was found is correctly identified
        (skills section, projects section, experience section, etc.).
        """
        resume_text = (
            "TECHNICAL SKILLS\n"
            "C++, TypeScript\n\n"
            "PROJECTS\n"
            "ProfiQ: Implemented with FastAPI and MongoDB\n\n"
            "EXPERIENCE\n"
            "Intern: Worked with AWS and CI/CD pipelines"
        )
        result = extract_skills_from_text(resume_text)
        skill_map = {s["name"]: s for s in result["skills_detected_in_resume"]}

        self.assertEqual(skill_map["C++"]["found_in"], "skills section")
        self.assertEqual(skill_map["FastAPI"]["found_in"], "projects section")
        self.assertEqual(skill_map["MongoDB"]["found_in"], "projects section")
        self.assertEqual(skill_map["AWS"]["found_in"], "experience section")
        self.assertEqual(skill_map["CI/CD"]["found_in"], "experience section")

    def test_distinguish_claimed_vs_verified(self):
        """
        Verify that output clearly distinguishes between skills detected/claimed
        in the resume and skills verified by external evidence.
        """
        resume_text = "SKILLS\nPython, React, Docker, Kubernetes"
        result = extract_skills_from_text(resume_text)

        # Detected in resume is populated
        self.assertGreater(result["total_detected_skills"], 0)
        self.assertEqual(len(result["skills_detected_in_resume"]), 4)

        # Verified by evidence MUST be empty at this stage
        self.assertEqual(result["skills_verified_by_evidence"], [])

        # Every detected skill must be flagged as unverified claim
        for skill in result["skills_detected_in_resume"]:
            self.assertEqual(skill["detection_type"], "claimed_in_resume")
            self.assertEqual(skill["verification_status"], "unverified")
            self.assertEqual(skill["evidence_sources"], [])

        # Explanatory note is present
        self.assertIn("verification_note", result)

    def test_empty_and_whitespace_input(self):
        """Verify graceful handling for empty or whitespace-only inputs."""
        empty_result = extract_skills_from_text("")
        self.assertEqual(empty_result["total_detected_skills"], 0)
        self.assertEqual(empty_result["skills_detected_in_resume"], [])
        self.assertEqual(empty_result["skills_verified_by_evidence"], [])

        whitespace_result = extract_skills_from_text("   \n\t  ")
        self.assertEqual(whitespace_result["total_detected_skills"], 0)

    def test_categories_representation(self):
        """
        Verify that skills from various key categories are properly categorized:
        - Programming Languages
        - Web Development
        - Databases
        - Machine Learning
        - Data Science
        - Cloud
        - DevOps
        - Tools
        - Computer Science Fundamentals
        """
        resume_text = (
            "SKILLS\n"
            "Java, React, Redis, PyTorch, Pandas, Google Cloud, Docker, Git, System Design"
        )
        result = extract_skills_from_text(resume_text)
        categories = {s["category"] for s in result["skills_detected_in_resume"]}

        expected_categories = {
            "Programming Languages",
            "Web Development",
            "Databases",
            "Machine Learning",
            "Data Science",
            "Cloud",
            "DevOps",
            "Tools",
            "Computer Science Fundamentals",
        }
        for expected in expected_categories:
            self.assertIn(expected, categories)


if __name__ == "__main__":
    unittest.main()
