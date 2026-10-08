"""
Regression Test Suite for Negation Filtering & Claim Extraction Semantics

Verifies that negated statements and target-role intent are never interpreted
as positive skill claims, while positive claims (including C and mixed clauses)
are accurately preserved.
"""

import os
import sys
import unittest

# Ensure ai-service root is in Python module search path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from services.skill_extractor import extract_skills_from_text, is_negated_mention
from services.analysis_service import analyze_candidate
from services.compatibility_service import adapt_backend_analysis
from models.compatibility import BackendAnalyzeRequest, TargetRolePayload


class TestNegationClaimExtraction(unittest.TestCase):
    """Test suite covering deterministic negation and non-claim filtering."""

    def test_01_positive_claim_extraction(self):
        """1. Positive: 'I know Python and SQL' -> Python and SQL are extracted."""
        text = "I know Python and SQL"
        result = extract_skills_from_text(text)
        detected = {s["name"] for s in result["skills_detected_in_resume"]}

        self.assertIn("Python", detected)
        self.assertIn("SQL", detected)

    def test_02_negative_no_experience_with(self):
        """2. Negative: 'I have no experience with Python' -> Python is NOT extracted."""
        text = "I have no experience with Python"
        result = extract_skills_from_text(text)
        detected = {s["name"] for s in result["skills_detected_in_resume"]}

        self.assertNotIn("Python", detected)
        self.assertEqual(len(detected), 0)

    def test_03_negative_havent_learned(self):
        """3. Negative: 'I haven't learned Machine Learning' -> Machine Learning is NOT extracted."""
        text = "I haven't learned Machine Learning"
        result = extract_skills_from_text(text)
        detected = {s["name"] for s in result["skills_detected_in_resume"]}

        self.assertNotIn("Machine Learning", detected)
        self.assertEqual(len(detected), 0)

    def test_04_negative_never_worked_with(self):
        """4. Negative: 'I never worked with Docker' -> Docker is NOT extracted."""
        text = "I never worked with Docker"
        result = extract_skills_from_text(text)
        detected = {s["name"] for s in result["skills_detected_in_resume"]}

        self.assertNotIn("Docker", detected)
        self.assertEqual(len(detected), 0)

    def test_05_negative_no_projects(self):
        """5. Negative: 'I have no machine learning projects' -> Machine Learning is NOT extracted."""
        text = "I have no machine learning projects"
        result = extract_skills_from_text(text)
        detected = {s["name"] for s in result["skills_detected_in_resume"]}

        self.assertNotIn("Machine Learning", detected)
        self.assertEqual(len(detected), 0)

    def test_06_negative_zero_coding_platform(self):
        """6. Negative: '0 LeetCode problems' -> Does NOT create positive coding platform evidence or claims."""
        text = "0 LeetCode problems"
        result = extract_skills_from_text(text)
        detected = {s["name"] for s in result["skills_detected_in_resume"]}

        self.assertEqual(len(detected), 0)

        # Also verify in analyze_candidate that no coding evidence or DSA claim is created
        analysis = analyze_candidate(resume_text=text, target_role="AI Engineer")
        for m in analysis.skill_matches:
            if m.skill_name == "Data Structures & Algorithms":
                self.assertEqual(m.candidate_confidence, 0.0)

    def test_07_mixed_positive_and_negative(self):
        """
        7. Mixed: 'I know Python but I have no experience with Docker'
        -> Python is extracted.
        -> Docker is NOT extracted.
        """
        text = "I know Python but I have no experience with Docker"
        result = extract_skills_from_text(text)
        detected = {s["name"] for s in result["skills_detected_in_resume"]}

        self.assertIn("Python", detected)
        self.assertNotIn("Docker", detected)

    def test_08_target_role_intent(self):
        """8. Target-role intent: 'I want to become an AI Engineer' -> Must NOT create AI Engineer skills or evidence."""
        text = "I want to become an AI Engineer"
        result = extract_skills_from_text(text)
        detected = {s["name"] for s in result["skills_detected_in_resume"]}

        self.assertEqual(len(detected), 0)

        # Full analysis must not credit candidate with AI Engineer skills
        analysis = analyze_candidate(resume_text=text, target_role="AI Engineer")
        self.assertEqual(analysis.readiness_score, 0)
        for m in analysis.skill_matches:
            self.assertEqual(m.candidate_confidence, 0.0)

    def test_09_c_language_isolated_claim(self):
        """
        9. C language: 'I know C'
        -> C may be extracted as a claim.
        -> It must NOT automatically create Python, Machine Learning, Docker, Git, FastAPI, or other unrelated skills.
        """
        text = "I know C"
        result = extract_skills_from_text(text)
        detected = {s["name"] for s in result["skills_detected_in_resume"]}

        self.assertIn("C", detected)
        self.assertNotIn("Python", detected)
        self.assertNotIn("Machine Learning", detected)
        self.assertNotIn("Docker", detected)
        self.assertNotIn("Git", detected)
        self.assertNotIn("FastAPI", detected)
        self.assertNotIn("SQL", detected)

        # Analyzing for AI Engineer with only C must produce readiness = 0
        analysis = analyze_candidate(resume_text=text, target_role="AI Engineer")
        self.assertEqual(analysis.readiness_score, 0)

    def test_10_additional_negation_patterns(self):
        """Verify additional common negative patterns from requirements."""
        cases = [
            ("No experience with SQL", "SQL"),
            ("no experience in SQL", "SQL"),
            ("have not learned Python", "Python"),
            ("haven't worked with Docker", "Docker"),
            ("have not worked with Docker", "Docker"),
            ("never used Docker", "Docker"),
            ("never learned Machine Learning", "Machine Learning"),
            ("0 Python projects", "Python"),
            ("zero Machine Learning projects", "Machine Learning"),
            ("without Docker experience", "Docker"),
            ("without experience in SQL", "SQL"),
            ("I have no Git experience", "Git"),
        ]
        for phrase, skill in cases:
            res = extract_skills_from_text(phrase)
            detected = {s["name"] for s in res["skills_detected_in_resume"]}
            self.assertNotIn(
                skill,
                detected,
                f"Skill '{skill}' should NOT be extracted from negated phrase: '{phrase}'",
            )

    def test_11_multiple_mentions_positive_override(self):
        """
        If a skill is mentioned in a negated clause but also in a valid positive clause,
        the positive claim must be recognized.
        """
        text = (
            "Earlier in my degree I had no experience with Python, "
            "but in my final year I built several backend services using Python."
        )
        result = extract_skills_from_text(text)
        detected = {s["name"] for s in result["skills_detected_in_resume"]}

        self.assertIn("Python", detected)

    def test_12_adversarial_candidate_e2e(self):
        """
        Full adversarial scenario:
        'I am a student. I know C. I want to become an AI Engineer.
         I have no Python experience, no machine learning projects, no SQL experience,
         no Git experience, no Docker experience, and 0 LeetCode problems.'
        """
        resume_text = (
            "I am a student. I know C. I want to become an AI Engineer. "
            "I have no Python experience, no machine learning projects, no SQL experience, "
            "no Git experience, no Docker experience, and 0 LeetCode problems."
        )

        extraction = extract_skills_from_text(resume_text)
        detected = [s["name"] for s in extraction["skills_detected_in_resume"]]

        # C may appear as claim
        self.assertIn("C", detected)

        # None of the negated skills should appear
        self.assertNotIn("Python", detected)
        self.assertNotIn("Machine Learning", detected)
        self.assertNotIn("SQL", detected)
        self.assertNotIn("Git", detected)
        self.assertNotIn("Docker", detected)

        # End-to-end analysis must produce readiness = 0
        analysis = analyze_candidate(resume_text=resume_text, target_role="AI Engineer")
        self.assertEqual(analysis.readiness_score, 0)
        self.assertEqual(analysis.readiness_label, "Needs Significant Development")

        # Compatibility endpoint adapter test
        req = BackendAnalyzeRequest(
            candidateId="adversarial_test_01",
            targetRole=TargetRolePayload(roleId="ai_eng", roleName="AI Engineer"),
            profile={
                "basicInfo": {"fullName": "Adversarial Student"},
                "resume": {"resumeText": resume_text},
            },
        )
        resp = adapt_backend_analysis(req)
        self.assertEqual(resp.data.readinessScore, 0)
        self.assertIn("C", resp.data.skills)
        self.assertNotIn("Python", resp.data.skills)
        self.assertNotIn("Machine Learning", resp.data.skills)
        self.assertNotIn("Docker", resp.data.skills)
        self.assertNotIn("SQL", resp.data.skills)
        self.assertNotIn("Git", resp.data.skills)
        self.assertEqual(resp.data.scoreBreakdown["skillConfidence"], 0)
        self.assertEqual(resp.data.scoreBreakdown["projectEvidence"], 0)
        self.assertEqual(resp.data.scoreBreakdown["codingRigor"], 0)
        self.assertEqual(resp.data.scoreBreakdown["academicRigor"], 0)


if __name__ == "__main__":
    unittest.main()
