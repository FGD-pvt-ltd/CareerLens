# ProfiQ — REST API Documentation

Base URL: `http://localhost:5000/api`

## Current Endpoints (Foundation)

### 1. Health Check
- `GET /api/health`
  - **Description**: Returns backend service health status, version, and timestamp.
  - **Status Code**: `200 OK`
  - **Response Sample**:
    ```json
    {
      "status": "ok",
      "service": "ProfiQ Backend API",
      "version": "1.0.0",
      "timestamp": "2026-10-07T08:59:58.715Z"
    }
    ```

## Planned Endpoints (Future Modules)

### 2. Authentication
- `POST /api/auth/register` — Candidate and admin registration
- `POST /api/auth/login` — Authentication and token generation
- `GET /api/auth/me` — Authenticated user verification

### 3. Profile Management
- `GET /api/profile` — Fetch candidate profile and claimed skills
- `PUT /api/profile` — Update candidate profile data and target role
- `POST /api/profile/upload-resume` — Multipart upload for PDF/DOCX resumes

### 4. Analysis & Readiness Scoring
- `POST /api/analysis/start` — Initiate AI analysis pipeline for candidate profile
- `GET /api/analysis/:id` — Fetch full employability report with readiness breakdown

### 5. Roadmap & Growth
- `GET /api/roadmap/:analysisId` — Retrieve personalized milestone action plan
- `PATCH /api/roadmap/milestone/:milestoneId` — Mark milestone progress
