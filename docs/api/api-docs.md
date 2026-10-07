# SkillProof — REST API Documentation

Base URL: `http://localhost:5000/api`

## Endpoints

### 1. Health
- `GET /health`
  - Returns backend service health status.

### 2. Authentication
- `POST /auth/register`
  - Request: `{ name, email, password, role }`
  - Response: `{ success, user, token }`
- `POST /auth/login`
  - Request: `{ email, password }`
  - Response: `{ success, token }`
- `GET /auth/me`
  - Headers: `Authorization: Bearer <token>`
  - Response: Current user object

### 3. Profile Management
- `GET /profile`
  - Retrieve current user profile and claimed skills.
- `PUT /profile`
  - Update user profile details, links, and targets.
- `POST /profile/upload-resume`
  - Multipart form upload for candidate resume (PDF/DOCX).

### 4. Analysis & Scoring
- `POST /analysis/start`
  - Request: `{ profileId, targetRoleId }`
  - Response: `{ success, analysisId }`
- `GET /analysis/:id`
  - Response: `{ readinessScore, skillScore, evidenceScore, verifiedSkills, missingSkills, roadmap }`

### 5. Roadmap & Growth
- `GET /roadmap/:analysisId`
  - Retrieve personalized milestone roadmap.
- `PATCH /roadmap/milestone/:milestoneId`
  - Request: `{ completed: boolean }`
  - Updates candidate progress on specific roadmap milestone.
