"""
Integration Test Suite for Node Backend Compatibility Adapter

Verifies the POST /api/analyze contract:
A. Valid AI Engineer request
B. Candidate ID preserved
C. Resume skills extracted
D. Project evidence contributes through existing evidence pipeline
E. GitHub repository evidence contributes
F. Coding profile evidence is handled
G. Certification cap remains intact
H. Missing evidence does not delete claimed skills
I. Unknown role
J. Missing candidateId
K. Missing targetRole.roleName
L. Empty resume
M. Response shape matches the existing backend contract
N. Deterministic score is unchanged
O. Gemini unavailable still returns a valid response
P. Existing roadmap is reused rather than regenerated
Q. No secrets appear in response/logging
"""

import json
import unittest
from unittest.mock import patch

from fastapi.testclient import TestClient
from main import app
from services.analysis_service import analyze_candidate
from services.compatibility_service import (
    convert_profile_to_evidence,
    extract_resume_text,
)


class TestBackendCompatibilityAdapter(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        self.sample_resume = (
            "Alex Smith | AI Engineer\n"
            "Summary: Machine learning practitioner with experience building deep learning systems.\n"
            "Skills: Python, PyTorch, TensorFlow, Machine Learning, Deep Learning, Docker, SQL, Git, NLP\n"
            "Experience: Built neural network pipelines and computer vision classifiers."
        )

    def test_a_valid_ai_engineer_request(self):
        """A. Valid AI Engineer request succeeds with 200 and expected contract."""
        payload = {
            "candidateId": "cand_12345",
            "targetRole": {
                "roleId": "role_ai_eng",
                "roleName": "AI Engineer",
            },
            "profile": {
                "resume": {
                    "hasResume": True,
                    "hasCv": False,
                    "resumeText": self.sample_resume,
                },
                "projects": [
                    {
                        "name": "Neural Vision Classifier",
                        "description": "Convolutional neural network for image segmentation using PyTorch and OpenCV.",
                        "technologies": ["PyTorch", "Deep Learning", "Python"],
                        "githubUrl": "https://github.com/alexsmith/neural-vision",
                    }
                ],
                "github": {
                    "username": "alexsmith",
                    "repositories": [
                        {
                            "name": "pytorch-models",
                            "primaryLanguage": "Python",
                            "stars": 12,
                            "forks": 3,
                            "fork": False,
                            "description": "PyTorch implementations of transformer models.",
                        }
                    ],
                },
            },
        }

        resp = self.client.post("/api/analyze", json=payload)
        self.assertEqual(resp.status_code, 200, f"Expected 200, got {resp.status_code}: {resp.text}")
        data = resp.json()

        self.assertTrue(data.get("success"))
        self.assertIn("data", data)
        self.assertIn("metadata", data)
        self.assertEqual(data["data"]["candidateId"], "cand_12345")
        self.assertIsInstance(data["data"]["readinessScore"], int)
        self.assertGreater(data["data"]["readinessScore"], 0)

    def test_b_candidate_id_preserved(self):
        """B. Candidate ID is preserved exactly without generating a new ID."""
        test_ids = ["mongo_obj_id_66f0a1b2c3d4", "custom-candidate-9988", "12345"]
        for cid in test_ids:
            payload = {
                "candidateId": cid,
                "targetRole": {"roleName": "AI Engineer"},
                "profile": {
                    "resume": {"resumeText": self.sample_resume},
                },
            }
            resp = self.client.post("/api/analyze", json=payload)
            self.assertEqual(resp.status_code, 200)
            self.assertEqual(resp.json()["data"]["candidateId"], cid)

    def test_c_resume_skills_extracted(self):
        """C. Resume skills are extracted into the candidate's skills list."""
        payload = {
            "candidateId": "cand_skills_01",
            "targetRole": {"roleName": "AI Engineer"},
            "profile": {
                "resume": {
                    "resumeText": "Skills: Python, PyTorch, Natural Language Processing, Machine Learning, TensorFlow, Git",
                },
            },
        }
        resp = self.client.post("/api/analyze", json=payload)
        self.assertEqual(resp.status_code, 200)
        skills = resp.json()["data"]["skills"]

        # Ensure canonical skills from resume are present
        self.assertIn("Python", skills)
        self.assertIn("PyTorch", skills)
        self.assertIn("Machine Learning", skills)

    def test_d_project_evidence_contributes(self):
        """D. Project evidence contributes through existing evidence pipeline."""
        # Baseline: candidate without project evidence
        payload_no_proj = {
            "candidateId": "cand_no_proj",
            "targetRole": {"roleName": "AI Engineer"},
            "profile": {
                "resume": {"resumeText": "Proficient in Python and PyTorch."},
            },
        }
        resp_no_proj = self.client.post("/api/analyze", json=payload_no_proj)
        self.assertEqual(resp_no_proj.status_code, 200)
        score_no_proj = resp_no_proj.json()["data"]["readinessScore"]

        # With project evidence supporting role skills
        payload_with_proj = {
            "candidateId": "cand_with_proj",
            "targetRole": {"roleName": "AI Engineer"},
            "profile": {
                "resume": {"resumeText": "Proficient in Python and PyTorch."},
                "projects": [
                    {
                        "name": "Deep Learning Object Detection",
                        "description": "Production PyTorch CNN model with real-time inference.",
                        "technologies": ["PyTorch", "Deep Learning", "Python"],
                        "githubUrl": "https://github.com/candidate/dl-detector",
                    }
                ],
            },
        }
        resp_with_proj = self.client.post("/api/analyze", json=payload_with_proj)
        self.assertEqual(resp_with_proj.status_code, 200)
        score_with_proj = resp_with_proj.json()["data"]["readinessScore"]

        # Project evidence increases readiness score
        self.assertGreater(score_with_proj, score_no_proj)
        self.assertGreater(
            resp_with_proj.json()["data"]["scoreBreakdown"]["projectEvidence"], 0
        )

    def test_e_github_repository_evidence_contributes(self):
        """E. GitHub repository evidence contributes and fork rules remain intact."""
        # 1. Original repository with stars
        payload_repo = {
            "candidateId": "cand_gh_01",
            "targetRole": {"roleName": "AI Engineer"},
            "profile": {
                "resume": {"resumeText": "Experienced Python software developer."},
                "github": {
                    "username": "coder",
                    "repositories": [
                        {
                            "name": "python-deep-learning",
                            "primaryLanguage": "Python",
                            "stars": 25,
                            "forks": 8,
                            "fork": False,
                            "description": "PyTorch implementations of deep learning models.",
                        }
                    ],
                },
            },
        }
        resp_repo = self.client.post("/api/analyze", json=payload_repo)
        self.assertEqual(resp_repo.status_code, 200)
        res_data = resp_repo.json()["data"]
        self.assertGreater(res_data["scoreBreakdown"]["codingRigor"], 0)

        # 2. Forked repository produces conservative confidence (capped at 0.50)
        profile_fork = {
            "github": {
                "repositories": [
                    {
                        "name": "forked-ai",
                        "primaryLanguage": "Python",
                        "stars": 100,
                        "fork": True,
                    }
                ]
            }
        }
        fork_evidence = convert_profile_to_evidence(profile_fork)
        self.assertEqual(len(fork_evidence), 1)
        self.assertEqual(fork_evidence[0].confidence, 0.50)
        self.assertTrue(fork_evidence[0].metadata["is_fork"])

    def test_f_coding_profile_evidence_handled(self):
        """F. Coding profile evidence is handled conservatively without fabrication."""
        payload = {
            "candidateId": "cand_code_01",
            "targetRole": {"roleName": "AI Engineer"},
            "profile": {
                "resume": {"resumeText": "Solid algorithmic fundamentals and Python skills."},
                "codingProfiles": [
                    {
                        "platform": "LeetCode",
                        "username": "algo_master",
                        "stats": {
                            "problemsSolved": 180,
                            "rating": 1850,
                        },
                        "languages": ["Python", "C++"],
                    }
                ],
            },
        }
        resp = self.client.post("/api/analyze", json=payload)
        self.assertEqual(resp.status_code, 200)
        res_data = resp.json()["data"]
        self.assertGreater(res_data["scoreBreakdown"]["codingRigor"], 0)

        # Empty/unreported coding profile creates no fabricated evidence
        profile_empty_cp = {
            "codingProfiles": [
                {
                    "platform": "HackerRank",
                    "username": "",
                    "stats": {},
                }
            ]
        }
        empty_evidence = convert_profile_to_evidence(profile_empty_cp)
        self.assertEqual(len(empty_evidence), 0)

    def test_g_certification_cap_remains_intact(self):
        """G. Certification cap remains intact at max 0.60 confidence."""
        profile_cert = {
            "certifications": [
                {
                    "name": "Deep Learning Specialization",
                    "issuingOrganization": "DeepLearning.AI",
                    "credentialUrl": "https://coursera.org/verify/12345",
                }
            ]
        }
        evidence_items = convert_profile_to_evidence(profile_cert)
        self.assertEqual(len(evidence_items), 1)
        # Cap strictly enforced at 0.60
        self.assertLessEqual(evidence_items[0].confidence, 0.60)

    def test_h_missing_evidence_does_not_delete_claimed_skills(self):
        """H. Missing evidence does not delete claimed skills or mark them false."""
        payload = {
            "candidateId": "cand_claims_only",
            "targetRole": {"roleName": "AI Engineer"},
            "profile": {
                "resume": {
                    "resumeText": "Experienced in PyTorch, Computer Vision, MLOps, and Kubernetes.",
                },
                # No evidence items provided
            },
        }
        resp = self.client.post("/api/analyze", json=payload)
        self.assertEqual(resp.status_code, 200)
        skills = resp.json()["data"]["skills"]

        # All claimed skills must be preserved even without any supporting evidence
        self.assertIn("PyTorch", skills)
        self.assertIn("Computer Vision", skills)
        self.assertIn("Kubernetes", skills)

    def test_i_unknown_role(self):
        """I. Unknown role returns 404 with clear message listing supported roles."""
        payload = {
            "candidateId": "cand_unknown_role",
            "targetRole": {
                "roleName": "Intergalactic Navigator",
            },
            "profile": {
                "resume": {"resumeText": self.sample_resume},
            },
        }
        resp = self.client.post("/api/analyze", json=payload)
        self.assertEqual(resp.status_code, 404)
        data = resp.json()
        self.assertIn("detail", data)
        self.assertIn("Supported roles", data["detail"])

    def test_j_missing_candidate_id(self):
        """J. Missing or empty candidateId returns 422."""
        # Missing candidateId key
        payload_missing = {
            "targetRole": {"roleName": "AI Engineer"},
            "profile": {"resume": {"resumeText": self.sample_resume}},
        }
        resp = self.client.post("/api/analyze", json=payload_missing)
        self.assertEqual(resp.status_code, 422)

        # Empty candidateId
        payload_empty = {
            "candidateId": "   ",
            "targetRole": {"roleName": "AI Engineer"},
            "profile": {"resume": {"resumeText": self.sample_resume}},
        }
        resp = self.client.post("/api/analyze", json=payload_empty)
        self.assertEqual(resp.status_code, 422)

    def test_k_missing_target_role_role_name(self):
        """K. Missing or empty targetRole.roleName returns 422."""
        # Missing roleName
        payload_no_name = {
            "candidateId": "cand_01",
            "targetRole": {"roleId": "123"},
            "profile": {},
        }
        resp = self.client.post("/api/analyze", json=payload_no_name)
        self.assertEqual(resp.status_code, 422)

        # Empty roleName
        payload_empty_name = {
            "candidateId": "cand_01",
            "targetRole": {"roleName": "  "},
            "profile": {},
        }
        resp = self.client.post("/api/analyze", json=payload_empty_name)
        self.assertEqual(resp.status_code, 422)

    def test_l_empty_resume(self):
        """L. Empty resume is handled gracefully without crashing or 500 error."""
        # 1. Empty resume text but structured profile data provided
        payload_empty_text = {
            "candidateId": "cand_no_resume_text",
            "targetRole": {"roleName": "AI Engineer"},
            "profile": {
                "resume": {
                    "hasResume": False,
                    "resumeText": "",
                    "cvText": "",
                },
                "skills": ["Python", "PyTorch", "TensorFlow"],
                "projects": [
                    {
                        "name": "AI Bot",
                        "technologies": ["Python", "PyTorch"],
                        "githubUrl": "https://github.com/test/bot",
                    }
                ],
            },
        }
        resp = self.client.post("/api/analyze", json=payload_empty_text)
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertTrue(data["success"])
        self.assertIn("Python", data["data"]["skills"])

        # 2. Entirely empty profile (no resume, no skills)
        payload_blank_profile = {
            "candidateId": "cand_blank",
            "targetRole": {"roleName": "AI Engineer"},
            "profile": {},
        }
        resp_blank = self.client.post("/api/analyze", json=payload_blank_profile)
        self.assertEqual(resp_blank.status_code, 200)
        self.assertTrue(resp_blank.json()["success"])
        self.assertEqual(resp_blank.json()["data"]["readinessScore"], 0)

    def test_m_response_shape_matches_backend_contract(self):
        """M. Response shape matches the existing Node backend contract exactly."""
        payload = {
            "candidateId": "cand_contract_test",
            "targetRole": {"roleName": "AI Engineer"},
            "profile": {
                "resume": {"resumeText": self.sample_resume},
            },
        }
        resp = self.client.post("/api/analyze", json=payload)
        self.assertEqual(resp.status_code, 200)
        body = resp.json()

        # Top level
        self.assertIn("success", body)
        self.assertIn("data", body)
        self.assertIn("metadata", body)
        self.assertIsInstance(body["success"], bool)

        # Data block
        d = body["data"]
        self.assertEqual(d["candidateId"], "cand_contract_test")
        self.assertIsInstance(d["readinessScore"], int)
        self.assertIsInstance(d["scoreBreakdown"], dict)
        self.assertIsInstance(d["skills"], list)
        self.assertIsInstance(d["strengths"], list)
        self.assertIsInstance(d["gaps"], list)
        self.assertIsInstance(d["roadmap"], list)

        # scoreBreakdown fields
        sb = d["scoreBreakdown"]
        self.assertIn("skillConfidence", sb)
        self.assertIn("projectEvidence", sb)
        self.assertIn("codingRigor", sb)
        self.assertIn("academicRigor", sb)

        # Roadmap item structure
        if d["roadmap"]:
            step1 = d["roadmap"][0]
            self.assertIn("step", step1)
            self.assertIn("title", step1)
            self.assertIn("duration", step1)
            self.assertIn("status", step1)

        # Metadata block
        m = body["metadata"]
        self.assertIn("serviceVersion", m)
        self.assertIn("model", m)
        self.assertIn("analyzedAt", m)

    def test_n_deterministic_score_is_unchanged(self):
        """N. Deterministic readiness calculation produces exact identical score."""
        payload = {
            "candidateId": "cand_determinism",
            "targetRole": {"roleName": "AI Engineer"},
            "profile": {
                "resume": {"resumeText": self.sample_resume},
                "projects": [
                    {
                        "name": "CV App",
                        "technologies": ["PyTorch", "Python"],
                        "githubUrl": "https://github.com/test/cv",
                    }
                ],
            },
        }

        # 1. Score from compatibility endpoint
        resp = self.client.post("/api/analyze", json=payload)
        self.assertEqual(resp.status_code, 200)
        endpoint_score = resp.json()["data"]["readinessScore"]

        # 2. Score from underlying deterministic pipeline
        resume_text = extract_resume_text(payload["profile"])
        evidence = convert_profile_to_evidence(payload["profile"])
        direct_analysis = analyze_candidate(
            resume_text=resume_text,
            target_role="AI Engineer",
            evidence_items=evidence,
        )

        self.assertEqual(endpoint_score, direct_analysis.readiness_score)

    def test_o_gemini_unavailable_fallback(self):
        """O. If Gemini is unavailable, deterministic fallback continues to work."""
        payload = {
            "candidateId": "cand_fallback",
            "targetRole": {"roleName": "AI Engineer"},
            "profile": {
                "resume": {"resumeText": self.sample_resume},
            },
        }

        # Simulate Gemini exception during LLM explanation
        with patch(
            "services.compatibility_service.generate_candidate_explanation",
            side_effect=RuntimeError("Gemini API connection error"),
        ):
            resp = self.client.post("/api/analyze", json=payload)
            self.assertEqual(resp.status_code, 200)
            data = resp.json()
            self.assertTrue(data["success"])
            self.assertIsInstance(data["data"]["readinessScore"], int)
            self.assertIn("profiq-deterministic-pipeline", data["metadata"]["model"])

    def test_p_existing_roadmap_is_reused(self):
        """P. Existing deterministic roadmap is reused without generating a second one."""
        payload = {
            "candidateId": "cand_roadmap_reuse",
            "targetRole": {"roleName": "AI Engineer"},
            "profile": {
                "resume": {"resumeText": self.sample_resume},
            },
        }
        resp = self.client.post("/api/analyze", json=payload)
        self.assertEqual(resp.status_code, 200)
        roadmap = resp.json()["data"]["roadmap"]

        # Compare with direct orchestrator roadmap
        direct_analysis = analyze_candidate(
            resume_text=self.sample_resume,
            target_role="AI Engineer",
            evidence_items=[],
        )
        direct_items = direct_analysis.roadmap.roadmap_items

        self.assertEqual(len(roadmap), len(direct_items))
        for compat_item, direct_item in zip(roadmap, direct_items):
            self.assertEqual(compat_item["step"], str(direct_item.priority))
            self.assertEqual(compat_item["skill"], direct_item.skill_name)
            self.assertEqual(compat_item["priority"], direct_item.priority)

    def test_q_no_secrets_appear_in_response_or_logging(self):
        """Q. No secrets, keys, filesystem paths, or stack traces appear in response."""
        payload = {
            "candidateId": "cand_secret_check",
            "targetRole": {"roleName": "AI Engineer"},
            "profile": {
                "resume": {"resumeText": self.sample_resume},
            },
        }
        resp = self.client.post("/api/analyze", json=payload)
        self.assertEqual(resp.status_code, 200)
        raw_text = resp.text

        # Ensure no sensitive tokens leaked
        self.assertNotIn("AIzaSy", raw_text)
        self.assertNotIn("GEMINI_API_KEY", raw_text)
        self.assertNotIn("/Users/", raw_text)
        self.assertNotIn("Traceback", raw_text)
        self.assertNotIn("mongodb+srv://", raw_text)


if __name__ == "__main__":
    unittest.main()
