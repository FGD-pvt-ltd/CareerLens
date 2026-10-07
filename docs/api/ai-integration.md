# ProfiQ AI Integration Contract: Node.js ↔ Python/FastAPI

**Document Version:** 1.0.0  
**Ownership Boundary:**
- **Asati (Backend):** Candidate data collection, normalization, MongoDB persistence, request transport, error/timeout handling, and client delivery.
- **Aman (AI/ML):** Natural Language Processing, skill extraction, evidence confidence, readiness scoring formulas, skill gaps, and personalized roadmap generation.

---

## 1. Architecture Overview

```
React (Frontend)
       │  POST /api/analysis
       ▼
Node.js / Express (Backend)
       │  1. Validates Candidate ID
       │  2. Loads Unified Candidate Profile
       │  3. Creates Analysis document (status="processing")
       │  POST /api/analyze
       ▼
Python / FastAPI (AI Service)
       │  1. Evaluates evidence & verified signals
       │  2. Computes readiness & gap analysis
       │  Returns structured JSON
       ▼
Node.js / Express (Backend)
       │  1. Validates response schema & types
       │  2. Updates Analysis document (status="completed")
       │  3. Syncs profile overview
       ▼
React (Frontend)
          GET /api/analysis/:id
```

---

## 2. Node → FastAPI Request Contract

- **HTTP Method:** `POST`
- **Path:** `/api/analyze`
- **Headers:**
  - `Content-Type: application/json`
  - `Accept: application/json`

### Request Payload Schema

```json
{
  "candidateId": "STRING (24-char hex MongoDB ID)",
  "targetRole": {
    "roleId": "STRING (e.g. backend_developer)",
    "roleName": "STRING (e.g. Backend Developer)"
  },
  "profile": {
    "basicInfo": {
      "name": "STRING",
      "email": "STRING",
      "phone": "STRING | null",
      "location": "STRING | null",
      "headline": "STRING | null",
      "profilePhotoUrl": "STRING | null"
    },
    "college": {
      "collegeName": "STRING | null",
      "university": "STRING | null",
      "degree": "STRING | null",
      "branch": "STRING | null",
      "specialization": "STRING | null",
      "yearOfStudy": "STRING | null",
      "graduationYear": "NUMBER | null",
      "cgpa": "NUMBER | null",
      "percentage": "NUMBER | null",
      "relevantCoursework": ["STRING"],
      "academicAchievements": ["STRING"]
    },
    "education": [
      {
        "level": "STRING",
        "institution": "STRING",
        "degree": "STRING",
        "field": "STRING",
        "startYear": "NUMBER",
        "endYear": "NUMBER",
        "cgpa": "NUMBER | null",
        "percentage": "NUMBER | null"
      }
    ],
    "experience": [
      {
        "organization": "STRING",
        "role": "STRING",
        "employmentType": "STRING",
        "location": "STRING | null",
        "startDate": "ISO_DATE | null",
        "endDate": "ISO_DATE | null",
        "isCurrent": "BOOLEAN",
        "description": "STRING",
        "technologies": ["STRING"],
        "achievements": ["STRING"],
        "source": "STRING"
      }
    ],
    "skills": [
      {
        "name": "STRING",
        "category": "STRING | null",
        "source": "STRING"
      }
    ],
    "projects": [
      {
        "name": "STRING",
        "description": "STRING",
        "technologies": ["STRING"],
        "category": "STRING | null",
        "role": "STRING | null",
        "startDate": "ISO_DATE | null",
        "endDate": "ISO_DATE | null",
        "githubUrl": "STRING | null",
        "liveUrl": "STRING | null",
        "demoUrl": "STRING | null",
        "teamSize": "NUMBER",
        "source": "STRING"
      }
    ],
    "certifications": [
      {
        "name": "STRING",
        "issuingOrganization": "STRING | null",
        "issueDate": "ISO_DATE | null",
        "expiryDate": "ISO_DATE | null",
        "credentialId": "STRING | null",
        "credentialUrl": "STRING | null",
        "certificateFileReference": "STRING | null",
        "source": "STRING"
      }
    ],
    "academicAchievements": [
      {
        "title": "STRING",
        "description": "STRING",
        "date": "ISO_DATE | null",
        "organization": "STRING | null",
        "credentialUrl": "STRING | null",
        "source": "STRING"
      }
    ],
    "achievements": [
      {
        "title": "STRING",
        "description": "STRING",
        "category": "STRING",
        "date": "ISO_DATE | null",
        "organization": "STRING | null",
        "source": "STRING"
      }
    ],
    "resume": {
      "hasResume": "BOOLEAN",
      "hasCv": "BOOLEAN",
      "resumeText": "STRING",
      "cvText": "STRING",
      "uploadedAt": "ISO_DATE | null"
    },
    "github": {
      "username": "STRING | null",
      "profileUrl": "STRING | null",
      "name": "STRING | null",
      "bio": "STRING | null",
      "publicRepositoryCount": "NUMBER",
      "followers": "NUMBER",
      "following": "NUMBER",
      "repositories": [
        {
          "name": "STRING",
          "fullName": "STRING",
          "description": "STRING",
          "url": "STRING",
          "primaryLanguage": "STRING | null",
          "languages": ["STRING"],
          "topics": ["STRING"],
          "stars": "NUMBER",
          "forks": "NUMBER",
          "readme": "STRING"
        }
      ],
      "languageSummary": "OBJECT",
      "activity": "OBJECT"
    },
    "codingProfiles": [
      {
        "platform": "STRING (leetcode | codeforces | codechef | hackerrank | geeksforgeeks)",
        "username": "STRING",
        "profileUrl": "STRING",
        "stats": {
          "problemsSolved": "NUMBER | null",
          "rating": "NUMBER | null",
          "rank": "NUMBER | null",
          "contestsParticipated": "NUMBER | null"
        },
        "problemBreakdown": {
          "easy": "NUMBER | null",
          "medium": "NUMBER | null",
          "hard": "NUMBER | null"
        },
        "languages": ["STRING"],
        "activity": {
          "lastActiveDate": "ISO_DATE | null"
        },
        "dataSource": "STRING",
        "fetchStatus": "STRING",
        "fetchedAt": "ISO_DATE"
      }
    ],
    "professionalProfiles": [
      {
        "platform": "STRING",
        "profileUrl": "STRING",
        "username": "STRING | null",
        "displayName": "STRING | null",
        "fetchStatus": "STRING",
        "dataSource": "STRING",
        "fetchedAt": "ISO_DATE"
      }
    ],
    "portfolios": [
      {
        "platform": "STRING",
        "url": "STRING",
        "title": "STRING | null",
        "description": "STRING | null",
        "type": "STRING | null",
        "fetchStatus": "STRING",
        "dataSource": "STRING",
        "fetchedAt": "ISO_DATE"
      }
    ]
  }
}
```

---

## 3. FastAPI → Node Response Contract

FastAPI must respond with HTTP `200 OK` and a structured JSON payload.

### Success Response Schema

```json
{
  "success": true,
  "data": {
    "candidateId": "6ac678b8457e09849f5095ae",
    "readinessScore": 78,
    "scoreBreakdown": {
      "skillAlignment": 82,
      "projectEvidence": 76,
      "codingRigor": 80,
      "academicRigor": 72,
      "consistency": 75
    },
    "skills": [
      {
        "name": "Node.js",
        "category": "Backend",
        "level": "Proficient",
        "evidenceSource": "github"
      }
    ],
    "strengths": [
      "Demonstrated experience with asynchronous backend architectures",
      "Verified competitive programming record on LeetCode"
    ],
    "gaps": [
      {
        "skill": "Docker",
        "severity": "medium",
        "recommendation": "Add container configuration to featured projects"
      }
    ],
    "roadmap": [
      {
        "step": "1",
        "title": "Containerize API Services with Docker",
        "duration": "1-2 Weeks",
        "targetOutcome": "Multi-container compose environment"
      }
    ]
  },
  "metadata": {
    "serviceVersion": "1.0.0",
    "model": "gemini-1.5-pro",
    "analyzedAt": "2026-10-07T22:50:00.000Z"
  }
}
```

---

## 4. Analysis Status Lifecycle

The Analysis record stored in MongoDB uses the following state lifecycle:

| Status | Description |
|---|---|
| `pending` | Analysis document created; waiting for execution. |
| `processing` | Request dispatched to FastAPI; AI evaluation running. |
| `completed` | Response validated and stored with readiness score and roadmap. |
| `failed` | Connection error, timeout, HTTP 4xx/5xx, or schema validation failure. |

---

## 5. Error Handling & Timeout Behavior

1. **Timeout:** Node.js enforces an HTTP timeout (default `15,000ms`, configurable via `AI_SERVICE_TIMEOUT_MS`). If FastAPI does not return within the timeout, the Analysis is marked as `failed` with error message `"AI service request timed out after 15000ms"`.
2. **HTTP 4xx / 5xx:** If FastAPI returns non-2xx status, Node extracts the error detail, marks the record as `failed`, and logs the event without crashing.
3. **Malformed Response:** If the response is non-JSON or violates data types (e.g. non-numeric readiness score), Node records `failed` with `"Malformed AI service response"`.
4. **Duplicate Prevention:** If an analysis for the same candidate and target role is currently `processing`, calling `POST /api/analysis` returns the existing `analysisId` immediately rather than triggering duplicate redundant requests.

---

## 6. Health Check Endpoint

- **Endpoint:** `GET /health` on FastAPI (`http://localhost:8000/health`)
- **Backend Relay:** `GET /api/ai/health`
- **Expected Return:**
  ```json
  {
    "status": "ok",
    "service": "profiq-ai-service",
    "version": "1.0.0"
  }
  ```
