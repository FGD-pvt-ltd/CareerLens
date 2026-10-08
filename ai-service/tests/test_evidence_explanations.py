"""
Tests for Evidence Explanations and Certification Cap Metadata

Validates:
1. Certification-only evidence produces structured explanation
2. Certification + Project evidence does NOT produce explanation
3. Certification + GitHub evidence does NOT produce explanation
4. No certification does NOT produce explanation
5. Multiple certifications for the same skill produce exactly one explanation
6. Existing certification confidence cap (<= 0.60) is strictly preserved
7. Response schema compatibility across all endpoints
8. Mixed skills candidate isolates explanation only to capped skill
9. Numerical scoring remains untouched and mathematically consistent
"""

import unittest
from fastapi.testclient import TestClient

from main import app
from models.evidence import (
    EvidenceItem,
    EvidenceType,
    EvidenceStrength,
    CERTIFICATION_CAP_TYPE,
    CERTIFICATION_CAP_TITLE,
    CERTIFICATION_CAP_MESSAGE,
)
from models.compatibility import BackendAnalyzeRequest
from services.evidence_aggregator import aggregate_evidence_for_skills
from services.analysis_service import analyze_candidate
from services.report_service import generate_candidate_report
from services.compatibility_service import adapt_backend_analysis


class TestEvidenceExplanations(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_1_certification_only_evidence_produces_explanation(self):
        """
        1. Certification-only evidence:
        - Cap confidence at <= 0.60
        - Status must be 'partially_supported'
        - Must generate structured evidence_explanations entry
        """
        claimed = ["Machine Learning"]
        evidence = [
            EvidenceItem(
                evidence_type=EvidenceType.CERTIFICATION,
                title="Deep Learning Specialization",
                description="Coursera Deep Learning Certificate",
                source="Coursera",
                url="https://coursera.org/verify/DL123",
                related_skills=["Machine Learning"],
                evidence_strength=EvidenceStrength.STRONG,
                confidence=0.85,
            )
        ]

        # In evidence aggregation
        agg_resp = aggregate_evidence_for_skills(claimed, evidence)
        ml_skill = agg_resp.skills[0]
        self.assertLessEqual(ml_skill.confidence, 0.60)
        self.assertEqual(ml_skill.evidence_status, "partially_supported")
        self.assertTrue(ml_skill.is_certification_capped)

        self.assertEqual(len(agg_resp.evidence_explanations), 1)
        exp = agg_resp.evidence_explanations[0]
        self.assertEqual(exp.skill, "Machine Learning")
        self.assertEqual(exp.type, CERTIFICATION_CAP_TYPE)
        self.assertEqual(exp.title, CERTIFICATION_CAP_TITLE)
        self.assertEqual(exp.message, CERTIFICATION_CAP_MESSAGE)

        # In analysis orchestrator
        resume_text = "Machine Learning candidate profile."
        analysis = analyze_candidate(
            resume_text=resume_text,
            target_role="AI Engineer",
            evidence_items=evidence,
        )
        self.assertEqual(len(analysis.evidence_explanations), 1)
        self.assertEqual(analysis.evidence_explanations[0].skill, "Machine Learning")
        self.assertEqual(analysis.evidence_explanations[0].type, "certification_cap")

        # In candidate report
        report = generate_candidate_report(analysis)
        self.assertEqual(len(report.evidence_explanations), 1)
        self.assertEqual(report.evidence_explanations[0].skill, "Machine Learning")

    def test_2_certification_plus_project_does_not_produce_explanation(self):
        """
        2. Certification + Project evidence:
        Practical evidence exists, so certification cap does not apply.
        No evidence explanation should be generated.
        """
        claimed = ["Machine Learning"]
        evidence = [
            EvidenceItem(
                evidence_type=EvidenceType.CERTIFICATION,
                title="Deep Learning Certificate",
                description="Theory cert",
                source="Coursera",
                url="https://coursera.org/verify/DL123",
                related_skills=["Machine Learning"],
                evidence_strength=EvidenceStrength.STRONG,
                confidence=0.80,
            ),
            EvidenceItem(
                evidence_type=EvidenceType.PROJECT,
                title="Neural Network Vision Classifier",
                description="Production PyTorch CV project",
                source="Portfolio",
                url="https://github.com/test/cv-proj",
                related_skills=["Machine Learning"],
                evidence_strength=EvidenceStrength.STRONG,
                confidence=0.85,
            ),
        ]

        agg_resp = aggregate_evidence_for_skills(claimed, evidence)
        ml_skill = agg_resp.skills[0]
        self.assertGreater(ml_skill.confidence, 0.60)
        self.assertEqual(ml_skill.evidence_status, "strongly_supported")
        self.assertFalse(ml_skill.is_certification_capped)
        self.assertEqual(len(agg_resp.evidence_explanations), 0)

        # In analysis orchestrator
        analysis = analyze_candidate(
            resume_text="Machine Learning engineer.",
            target_role="AI Engineer",
            evidence_items=evidence,
        )
        self.assertEqual(len(analysis.evidence_explanations), 0)

    def test_3_certification_plus_github_does_not_produce_explanation(self):
        """
        3. Certification + GitHub repository:
        Practical repository evidence is present, so certification cap does not apply.
        """
        claimed = ["Python"]
        evidence = [
            EvidenceItem(
                evidence_type=EvidenceType.CERTIFICATION,
                title="Python for Everybody Certificate",
                description="University of Michigan course cert",
                source="Coursera",
                url="https://coursera.org/verify/PY123",
                related_skills=["Python"],
                evidence_strength=EvidenceStrength.STRONG,
                confidence=0.75,
            ),
            EvidenceItem(
                evidence_type=EvidenceType.GITHUB_REPOSITORY,
                title="fastapi-microservices",
                description="Public GitHub repo with Python code",
                source="GitHub",
                url="https://github.com/test/fastapi-microservices",
                related_skills=["Python"],
                evidence_strength=EvidenceStrength.STRONG,
                confidence=0.85,
            ),
        ]

        agg_resp = aggregate_evidence_for_skills(claimed, evidence)
        py_skill = agg_resp.skills[0]
        self.assertGreater(py_skill.confidence, 0.60)
        self.assertFalse(py_skill.is_certification_capped)
        self.assertEqual(len(agg_resp.evidence_explanations), 0)

    def test_4_no_certification_does_not_produce_explanation(self):
        """
        4. Skills with no certification evidence:
        Neither project-backed nor unevidenced skills produce certification cap explanations.
        """
        claimed = ["Python", "Docker"]
        evidence = [
            EvidenceItem(
                evidence_type=EvidenceType.PROJECT,
                title="Python CLI Tool",
                description="Built a CLI parser",
                source="Portfolio",
                related_skills=["Python"],
                evidence_strength=EvidenceStrength.MODERATE,
                confidence=0.65,
            )
        ]

        agg_resp = aggregate_evidence_for_skills(claimed, evidence)
        self.assertEqual(len(agg_resp.evidence_explanations), 0)

        analysis = analyze_candidate(
            resume_text="Experienced in Python and Docker.",
            target_role="Software Engineer",
            evidence_items=evidence,
        )
        self.assertEqual(len(analysis.evidence_explanations), 0)

    def test_5_multiple_certifications_produce_single_explanation(self):
        """
        5. Multiple certifications for the same skill:
        Even if candidate has 2 or 3 certifications for Machine Learning,
        exactly ONE explanation is generated for that skill (no duplicates).
        """
        claimed = ["Machine Learning"]
        evidence = [
            EvidenceItem(
                evidence_type=EvidenceType.CERTIFICATION,
                title="AWS Certified Machine Learning - Specialty",
                description="Cloud ML Certification",
                source="AWS",
                url="https://aws.amazon.com/verify/111",
                related_skills=["Machine Learning"],
                evidence_strength=EvidenceStrength.STRONG,
                confidence=0.85,
            ),
            EvidenceItem(
                evidence_type=EvidenceType.CERTIFICATION,
                title="TensorFlow Developer Certificate",
                description="Google TF Certification",
                source="Google",
                url="https://google.com/verify/222",
                related_skills=["Machine Learning"],
                evidence_strength=EvidenceStrength.STRONG,
                confidence=0.85,
            ),
        ]

        agg_resp = aggregate_evidence_for_skills(claimed, evidence)
        ml_skill = agg_resp.skills[0]
        self.assertLessEqual(ml_skill.confidence, 0.60)
        self.assertEqual(ml_skill.evidence_status, "partially_supported")
        self.assertTrue(ml_skill.is_certification_capped)

        # Must be deduplicated per skill
        self.assertEqual(len(agg_resp.evidence_explanations), 1)
        self.assertEqual(agg_resp.evidence_explanations[0].skill, "Machine Learning")

    def test_6_existing_certification_confidence_cap_preserved(self):
        """
        6. Existing certification confidence cap (0.60) must remain strictly intact
        and readiness score calculation remains deterministic.
        """
        claimed = ["SQL"]
        evidence = [
            EvidenceItem(
                evidence_type=EvidenceType.CERTIFICATION,
                title="Oracle SQL Certified Associate",
                description="SQL certification",
                source="Oracle",
                url="https://oracle.com/verify/sql",
                related_skills=["SQL"],
                evidence_strength=EvidenceStrength.STRONG,
                confidence=0.90,  # 0.90 must be capped at 0.60
            )
        ]

        analysis = analyze_candidate(
            resume_text="SQL Specialist.",
            target_role="Data Analyst",
            evidence_items=evidence,
        )

        sql_match = next(m for m in analysis.skill_matches if m.skill_name == "SQL")
        self.assertEqual(sql_match.candidate_confidence, 0.60)
        self.assertEqual(sql_match.candidate_evidence_status, "partially_supported")
        self.assertEqual(sql_match.weighted_match_contribution, round(0.60 * sql_match.importance_weight, 2))

    def test_7_response_schema_compatibility(self):
        """
        7. Response schema compatibility:
        Ensures evidence_explanations is exposed cleanly in POST /api/analyze
        without breaking any existing fields or backend expectations.
        """
        payload = {
            "candidateId": "cert-cap-test-123",
            "targetRole": {"roleId": "ai_eng", "roleName": "AI Engineer"},
            "profile": {
                "basicInfo": {"fullName": "Cert Candidate"},
                "skills": ["Machine Learning"],
                "resume": {
                    "hasResume": True,
                    "resumeText": "Machine Learning certification holder.",
                },
                "certifications": [
                    {
                        "name": "Professional Machine Learning Engineer",
                        "issuingOrganization": "Google Cloud",
                        "credentialUrl": "https://gcp.cert/123",
                        "skills": ["Machine Learning"],
                    }
                ],
            },
        }

        # Test compatibility service directly
        req = BackendAnalyzeRequest(**payload)
        resp = adapt_backend_analysis(req)

        self.assertTrue(resp.success)
        self.assertEqual(resp.data.candidateId, "cert-cap-test-123")
        self.assertIsInstance(resp.data.evidence_explanations, list)
        self.assertEqual(len(resp.data.evidence_explanations), 1)

        exp = resp.data.evidence_explanations[0]
        self.assertEqual(exp["skill"], "Machine Learning")
        self.assertEqual(exp["type"], "certification_cap")
        self.assertEqual(exp["title"], "Why certification evidence is partially supported")
        self.assertIn("0.60", exp["message"])

        # Top-level evidence_explanations also present
        self.assertEqual(len(resp.evidence_explanations), 1)

        # Test live FastAPI endpoint POST /api/analyze
        http_resp = self.client.post("/api/analyze", json=payload)
        self.assertEqual(http_resp.status_code, 200)
        body = http_resp.json()
        self.assertTrue(body["success"])
        self.assertIn("evidence_explanations", body["data"])
        self.assertEqual(len(body["data"]["evidence_explanations"]), 1)
        self.assertEqual(body["data"]["evidence_explanations"][0]["skill"], "Machine Learning")

    def test_8_mixed_skills_candidate_isolates_explanation(self):
        """
        8. Mixed skills candidate:
        Explanation should ONLY appear for the skill capped by certification,
        and NOT for skills supported by projects or lacking evidence.
        """
        claimed = ["Python", "Machine Learning", "Docker"]
        evidence = [
            # Python -> Strong project
            EvidenceItem(
                evidence_type=EvidenceType.PROJECT,
                title="Python API",
                description="FastAPI service",
                source="Portfolio",
                url="https://github.com/test/py-api",
                related_skills=["Python"],
                evidence_strength=EvidenceStrength.STRONG,
                confidence=0.85,
            ),
            # Machine Learning -> Cert only
            EvidenceItem(
                evidence_type=EvidenceType.CERTIFICATION,
                title="AWS Machine Learning",
                description="AWS ML cert",
                source="AWS",
                url="https://aws.cert/ml",
                related_skills=["Machine Learning"],
                evidence_strength=EvidenceStrength.STRONG,
                confidence=0.85,
            ),
            # Docker -> No evidence
        ]

        analysis = analyze_candidate(
            resume_text="Python, ML, and Docker engineer.",
            target_role="AI Engineer",
            evidence_items=evidence,
        )

        # Only Machine Learning should have an explanation
        skills_with_exp = [e.skill for e in analysis.evidence_explanations]
        self.assertEqual(skills_with_exp, ["Machine Learning"])
        self.assertNotIn("Python", skills_with_exp)
        self.assertNotIn("Docker", skills_with_exp)

    def test_9_numerical_scoring_untouched(self):
        """
        9. Verifies that adding evidence_explanations did not touch
        readiness score, confidence, or weighted match calculations.
        """
        resume = "Python and Machine Learning developer."
        role = "AI Engineer"
        ev = [
            EvidenceItem(
                evidence_type=EvidenceType.CERTIFICATION,
                title="ML Cert",
                description="Certificate",
                source="Coursera",
                url="https://cert.com/ml",
                related_skills=["Machine Learning"],
                evidence_strength=EvidenceStrength.STRONG,
                confidence=0.80,
            )
        ]

        analysis = analyze_candidate(resume, role, ev)

        # ML conf is 0.60
        ml_m = next(m for m in analysis.skill_matches if m.skill_name == "Machine Learning")
        self.assertEqual(ml_m.candidate_confidence, 0.60)
        self.assertEqual(ml_m.weighted_match_contribution, 0.60)

        # Total weighted score = 0.60 / 4.70 * 100 = 12.76 -> 13
        self.assertEqual(analysis.readiness_score, 13)


if __name__ == "__main__":
    unittest.main()
