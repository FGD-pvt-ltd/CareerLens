# ProfiQ REST API Inventory

Comprehensive reference and contract specification for all currently active REST API endpoints implemented in the ProfiQ Node.js/Express backend service.

---

## Standard Response Format

All ProfiQ API endpoints follow standardized JSON response structures:

### Success Response
```json
{
  "success": true,
  "message": "Human-readable status summary",
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Descriptive error message"
}
```

---

## 1. System Health Endpoints

### `GET /api/health`
- **Purpose**: Verify backend server availability, runtime health, and uptime.
- **Authentication**: None (Public)
- **Content-Type**: N/A
- **Request Parameters / Body**: None
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "ProfiQ backend is running",
  "data": {
    "status": "healthy",
    "service": "profiq-backend",
    "uptime": 128,
    "timestamp": "2026-10-08T01:50:00.000Z"
  }
}
```
- **Error Response**: None under standard execution.
- **Status Codes**: `200 OK`.

---

### `GET /api/ai/health`
- **Purpose**: Check upstream Python/FastAPI AI Service connectivity without exposing internal URLs or architecture details.
- **Authentication**: None (Internal / Public diagnostics)
- **Content-Type**: N/A
- **Request Parameters / Body**: None
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "AI service is available and healthy",
  "data": {
    "aiService": "available"
  }
}
```
- **Error Response (503 Service Unavailable)**:
```json
{
  "success": false,
  "error": "AI service unavailable"
}
```
- **Status Codes**: `200 OK`, `503 Service Unavailable`.

---

## 2. Candidate Profile Endpoints

### `POST /api/profiles`
- **Purpose**: Create a new Candidate Profile document in MongoDB. Whitelists schema properties and validates optional target roles.
- **Authentication**: None
- **Content-Type**: `application/json`
- **Request Body**:
```json
{
  "basicInfo": {
    "name": "Aditya Asati",
    "email": "aditya@example.com",
    "phone": "+91 9876543210",
    "location": "Bengaluru, India",
    "headline": "Full Stack Engineer"
  },
  "college": {
    "collegeName": "National Institute of Technology",
    "degree": "B.Tech",
    "branch": "CSE",
    "graduationYear": 2025,
    "cgpa": 8.85
  },
  "targetRole": {
    "roleName": "Backend Developer"
  }
}
```
- **Success Response (201 Created)**:
```json
{
  "success": true,
  "message": "Candidate profile created successfully",
  "data": {
    "profile": {
      "_id": "6ac6aa3f4ce7adfadee982b3",
      "basicInfo": { "name": "Aditya Asati", "email": "aditya@example.com" },
      "college": { "collegeName": "National Institute of Technology", "cgpa": 8.85 },
      "profileCompleteness": 35,
      "createdAt": "2026-10-08T01:50:00.000Z",
      "updatedAt": "2026-10-08T01:50:00.000Z"
    }
  }
}
```
- **Error Response (400 / 404)**:
```json
{
  "success": false,
  "error": "Candidate name is required in basicInfo.name"
}
```
- **Status Codes**: `201 Created`, `400 Bad Request`, `404 Not Found (Invalid Target Role)`.

---

### `GET /api/profiles/:id`
- **Purpose**: Retrieve candidate profile by MongoDB ObjectId.
- **Authentication**: None
- **URL Params**: `id` (24-character hexadecimal MongoDB ObjectId)
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "Candidate profile retrieved successfully",
  "data": {
    "profile": {
      "_id": "6ac6aa3f4ce7adfadee982b3",
      "basicInfo": { "name": "Aditya Asati", "email": "aditya@example.com" },
      "profileCompleteness": 85
    }
  }
}
```
- **Error Response (400 / 404)**:
```json
{
  "success": false,
  "error": "Candidate profile not found"
}
```
- **Status Codes**: `200 OK`, `400 Bad Request (Invalid ObjectId)`, `404 Not Found`.

---

### `PUT /api/profiles/:id`
- **Purpose**: Update candidate profile fields using structured whitelist validation. Recalculates `profileCompleteness`.
- **Authentication**: None
- **Content-Type**: `application/json`
- **URL Params**: `id` (MongoDB ObjectId)
- **Request Body**:
```json
{
  "basicInfo": {
    "headline": "Lead Backend & Distributed Systems Architect"
  },
  "college": {
    "cgpa": 8.95
  }
}
```
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "Candidate profile updated successfully",
  "data": {
    "profile": { ... },
    "profileCompleteness": 88
  }
}
```
- **Error Response (400 / 404)**:
```json
{
  "success": false,
  "error": "Update payload must be a non-empty object"
}
```
- **Status Codes**: `200 OK`, `400 Bad Request`, `404 Not Found`.

---

### `DELETE /api/profiles/:id`
- **Purpose**: Delete candidate profile by MongoDB ObjectId and cascade delete associated analysis records.
- **Authentication**: None
- **URL Params**: `id` (MongoDB ObjectId)
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "Candidate profile deleted successfully",
  "data": {
    "profileId": "6ac6aa3f4ce7adfadee982b3"
  }
}
```
- **Error Response (400 / 404)**:
```json
{
  "success": false,
  "error": "Candidate profile not found"
}
```
- **Status Codes**: `200 OK`, `400 Bad Request`, `404 Not Found`.

---

### `GET /api/profiles/:id/unified`
- **Purpose**: Retrieve complete normalized Unified Candidate Profile across all 15 sub-domains (basicInfo, college, education, experience, skills, projects, certifications, academicAchievements, achievements, resume, github, codingProfiles, professionalProfiles, portfolios, targetRole) plus `profileCompleteness` breakdown and sanitized `aiHandoff`.
- **Authentication**: None
- **URL Params**: `id` (MongoDB ObjectId)
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "Unified candidate profile retrieved successfully",
  "data": {
    "candidateId": "6ac6aa3f4ce7adfadee982b3",
    "targetRole": "Backend Developer",
    "profileCompleteness": 85,
    "completenessBreakdown": {
      "basicInfo": 15,
      "college": 15,
      "education": 10,
      "experience": 10,
      "projects": 15,
      "skills": 10,
      "resume": 10,
      "github": 5,
      "codingProfiles": 5,
      "certifications": 5
    },
    "candidate": {
      "basicInfo": { ... },
      "college": { ... },
      "education": [ ... ],
      "experience": [ ... ],
      "skills": [ ... ],
      "projects": [ ... ],
      "certifications": [ ... ],
      "academicAchievements": [ ... ],
      "achievements": [ ... ],
      "resume": { "hasResume": true, "hasCv": false, "resumeText": "..." },
      "github": { "username": "...", "repositories": [ ... ] },
      "codingProfiles": [ ... ],
      "professionalProfiles": [ ... ],
      "portfolios": [ ... ],
      "targetRole": { "roleId": "...", "roleName": "Backend Developer", "slug": "backend-developer" }
    },
    "aiHandoff": { ... }
  }
}
```
- **Status Codes**: `200 OK`, `400 Bad Request`, `404 Not Found`.

---

## 3. Sub-Resource Enrichment Endpoints

### `POST /api/profiles/:id/projects`
- **Purpose**: Add or update candidate project.
- **Content-Type**: `application/json`
- **Request Body**:
```json
{
  "name": "Distributed Stream Engine",
  "description": "High-throughput message pipeline",
  "technologies": ["Node.js", "Redis", "Kafka"],
  "role": "Lead Architect",
  "githubUrl": "https://github.com/org/stream-engine",
  "liveUrl": "https://stream.demo.dev",
  "teamSize": 2
}
```
- **Status Codes**: `201 Created`, `400 Bad Request`, `404 Not Found`.

---

### `POST /api/profiles/:id/experience`
- **Purpose**: Add professional experience record.
- **Content-Type**: `application/json`
- **Request Body**:
```json
{
  "organization": "Google Summer of Code",
  "role": "Open Source Contributor",
  "employmentType": "internship",
  "startDate": "2024-05-01",
  "endDate": "2024-08-31",
  "description": "Implemented telemetry export in Go",
  "technologies": ["Go", "gRPC", "Prometheus"]
}
```
- **Status Codes**: `201 Created`, `400 Bad Request`, `404 Not Found`.

---

### `POST /api/profiles/:id/certifications`
- **Purpose**: Add certification. Supports optional multipart file attachment or JSON payload.
- **Content-Type**: `application/json` or `multipart/form-data`
- **Request Body / Form Fields**: `name`, `issuingOrganization`, `credentialUrl`, `issueDate`, `file`
- **Status Codes**: `201 Created`, `400 Bad Request`, `404 Not Found`.

---

### `POST /api/profiles/:id/portfolios`
- **Purpose**: Add or update portfolio link.
- **Content-Type**: `application/json`
- **Request Body**:
```json
{
  "platform": "Personal Website",
  "url": "https://adityasati.dev",
  "title": "Engineering Portfolio"
}
```
- **Status Codes**: `200 OK`, `400 Bad Request`, `404 Not Found`.

---

### `POST /api/profiles/:id/professional-profiles`
- **Purpose**: Add professional link (LinkedIn, GitLab, etc.).
- **Content-Type**: `application/json`
- **Request Body**: `{ "platform": "LinkedIn", "profileUrl": "https://linkedin.com/in/username" }`
- **Status Codes**: `200 OK`, `400 Bad Request`, `404 Not Found`.

---

### `POST /api/profiles/:id/achievements`
- **Purpose**: Add hackathon, competition, or extracurricular achievement.
- **Content-Type**: `application/json`
- **Request Body**: `{ "title": "SIH Winner", "category": "hackathon", "organization": "MHRD" }`
- **Status Codes**: `201 Created`, `400 Bad Request`, `404 Not Found`.

---

### `POST /api/profiles/:id/academic-achievements`
- **Purpose**: Add academic honors or distinctions.
- **Content-Type**: `application/json`
- **Request Body**: `{ "title": "Dean's List 2024", "organization": "NIT" }`
- **Status Codes**: `201 Created`, `400 Bad Request`, `404 Not Found`.

---

### `PUT /api/profiles/:id/target-role`
- **Purpose**: Select candidate target role. Validated against benchmark `JobRole` catalog.
- **Content-Type**: `application/json`
- **Request Body**: `{ "roleName": "Backend Developer" }`
- **Status Codes**: `200 OK`, `400 Bad Request`, `404 Not Found (Invalid Role)`.

---

## 4. Document / Resume Pipeline

### `POST /api/profiles/:id/documents`
- **Purpose**: Upload candidate resume or CV PDF, perform safe in-memory text extraction, persist subdocument in MongoDB, and maintain exactly one active document per type.
- **Content-Type**: `multipart/form-data`
- **Form Fields**:
  - `file`: PDF document (max 5 MB)
  - `documentType`: `"resume"` or `"cv"`
- **Success Response (201 Created)**:
```json
{
  "success": true,
  "message": "Document uploaded and processed successfully",
  "data": {
    "document": {
      "_id": "6ac6aa3f4ce7adfadee982c1",
      "documentType": "resume",
      "fileName": "Aditya_Resume.pdf",
      "mimeType": "application/pdf",
      "fileSize": 45012,
      "extractionStatus": "completed",
      "uploadedAt": "2026-10-08T01:50:00.000Z"
    }
  }
}
```
- **Error Response (400 Bad Request)**:
```json
{
  "success": false,
  "error": "Invalid file type. Only PDF documents are allowed."
}
```
- **Status Codes**: `201 Created`, `400 Bad Request`, `404 Not Found`.

---

### `GET /api/profiles/:id/documents`
- **Purpose**: Retrieve candidate's uploaded document metadata list (omits server storage paths).
- **Status Codes**: `200 OK`, `400 Bad Request`, `404 Not Found`.

---

### `GET /api/profiles/:id/documents/:documentId`
- **Purpose**: Retrieve individual document metadata and extracted text.
- **Status Codes**: `200 OK`, `400 Bad Request`, `404 Not Found`.

---

### `GET /api/profiles/:id/documents/text`
- **Purpose**: Retrieve combined raw extracted text (`resumeText`, `cvText`) for AI engine consumption.
- **Status Codes**: `200 OK`, `400 Bad Request`, `404 Not Found`.

---

## 5. GitHub Integration Pipeline

### `POST /api/profiles/:id/github`
- **Purpose**: Ingest and normalize public GitHub profile, top repositories, READMEs, language summary, and consistency activity into `CandidateProfile.github`.
- **Content-Type**: `application/json`
- **Request Body**:
```json
{
  "githubUrl": "https://github.com/octocat"
}
```
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "GitHub profile analyzed successfully",
  "data": {
    "github": {
      "username": "octocat",
      "profileUrl": "https://github.com/octocat",
      "name": "The Octocat",
      "publicRepositoryCount": 8,
      "repositories": [ ... ],
      "languageSummary": { "JavaScript": 4, "Python": 2 },
      "activity": { "lastActiveDate": "2026-10-01T00:00:00.000Z" }
    }
  }
}
```
- **Status Codes**: `200 OK`, `400 Bad Request (Invalid URL)`, `403/429 (Rate Limit Exceeded)`, `404 Not Found`.

---

## 6. Coding Platform Pipeline

### `POST /api/profiles/:id/coding-profiles`
- **Purpose**: Add or refresh candidate competitive programming profile evidence (`leetcode`, `codeforces`, `codechef`, `hackerrank`, `geeksforgeeks`). Prevents duplicate platform entries by updating in-place.
- **Content-Type**: `application/json`
- **Request Body**:
```json
{
  "platform": "leetcode",
  "profileUrl": "https://leetcode.com/u/neal_wu"
}
```
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "Coding profile for leetcode processed successfully",
  "data": {
    "codingProfile": {
      "platform": "leetcode",
      "username": "neal_wu",
      "profileUrl": "https://leetcode.com/u/neal_wu",
      "stats": { "problemsSolved": 253, "rating": 1950 },
      "problemBreakdown": { "easy": 60, "medium": 141, "hard": 52 },
      "fetchStatus": "completed"
    },
    "codingProfiles": [ ... ]
  }
}
```
- **Status Codes**: `200 OK`, `400 Bad Request`, `404 Not Found`.

---

### `GET /api/profiles/:id/coding-profiles`
- **Purpose**: Retrieve all coding platform profiles attached to candidate.
- **Status Codes**: `200 OK`, `400 Bad Request`, `404 Not Found`.

---

### `PUT /api/profiles/:id/coding-profiles/:platform`
- **Purpose**: Re-fetch live metrics and refresh coding profile data for a specific platform.
- **Status Codes**: `200 OK`, `400 Bad Request`, `404 Not Found`.

---

### `DELETE /api/profiles/:id/coding-profiles/:platform`
- **Purpose**: Remove specific platform from candidate's coding profiles.
- **Status Codes**: `200 OK`, `400 Bad Request`, `404 Not Found`.

---

## 7. Job Role & Benchmark Requirements Endpoints

### `GET /api/roles`
- **Purpose**: Retrieve catalog of benchmark industry roles with required skills, preferred skills, responsibilities, and certifications.
- **Query Parameters**:
  - `category` (optional, e.g. `Engineering`, `Data`)
  - `search` (optional string)
  - `active` (optional boolean, default `true`)
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "Job roles retrieved successfully",
  "data": {
    "roles": [
      {
        "id": "6ac6aa3f4ce7adfadee98210",
        "name": "Backend Developer",
        "slug": "backend-developer",
        "category": "Engineering",
        "requiredSkills": [ ... ],
        "preferredSkills": [ ... ],
        "responsibilities": [ ... ]
      }
    ],
    "total": 10
  }
}
```
- **Status Codes**: `200 OK`.

---

### `GET /api/roles/:id`
- **Purpose**: Retrieve benchmark job role by MongoDB ObjectId.
- **Status Codes**: `200 OK`, `400 Bad Request`, `404 Not Found`.

---

### `GET /api/roles/slug/:slug`
- **Purpose**: Retrieve benchmark job role by unique URL slug (e.g. `backend-developer`, `full-stack-developer`, `data-analyst`).
- **Status Codes**: `200 OK`, `400 Bad Request`, `404 Not Found`.

---

## 8. AI Analysis & Evaluation Lifecycle

### `POST /api/analysis`
- **Purpose**: Initialize Candidate Profile Analysis. Creates `Analysis` record with `status: "processing"`, dispatches sanitized payload to FastAPI AI service, updates record to `completed` (or `failed` upon timeout/error), and synchronizes readiness snapshot on candidate profile. Returns existing in-flight analysis if already running.
- **Content-Type**: `application/json`
- **Query Parameters**: `sync=true` (optional, for synchronous test completion)
- **Request Body**:
```json
{
  "candidateId": "6ac6aa3f4ce7adfadee982b3",
  "targetRole": "Backend Developer"
}
```
- **Success Response (202 Accepted / 200 OK if sync)**:
```json
{
  "success": true,
  "message": "Candidate profile analysis initialized and processing",
  "data": {
    "analysisId": "6ac6aa3f4ce7adfadee982c5",
    "status": "processing"
  }
}
```
- **Status Codes**: `200 OK`, `202 Accepted`, `400 Bad Request`, `404 Not Found`.

---

### `GET /api/analysis/:id`
- **Purpose**: Retrieve Analysis report and readiness evaluation by analysis ID.
- **URL Params**: `id` (Analysis MongoDB ObjectId)
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "Analysis record retrieved successfully",
  "data": {
    "analysis": {
      "_id": "6ac6aa3f4ce7adfadee982c5",
      "candidateId": "6ac6aa3f4ce7adfadee982b3",
      "targetRole": { "roleName": "Backend Developer", "slug": "backend-developer" },
      "status": "completed",
      "result": {
        "readinessScore": 88,
        "scoreBreakdown": {
          "skillConfidence": 90,
          "projectEvidence": 85,
          "codingRigor": 88,
          "academicRigor": 86
        },
        "skills": ["Node.js", "Express", "MongoDB", "System Design"],
        "strengths": ["Strong backend API engineering"],
        "gaps": ["Kubernetes container orchestration"],
        "roadmap": [
          { "step": "1", "title": "Containerize backend service", "duration": "Week 1", "status": "Next" }
        ]
      },
      "aiMetadata": {
        "serviceVersion": "1.0.0",
        "model": "fastapi-pipeline-v1",
        "analyzedAt": "2026-10-08T01:50:00.000Z"
      }
    }
  }
}
```
- **Status Codes**: `200 OK`, `400 Bad Request`, `404 Not Found`.
