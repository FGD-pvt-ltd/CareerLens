# ProfiQ — Backend REST API & Integration Layer

> **ProfiQ Backend** — Core server-side API, candidate profile management, secure document ingestion pipeline, coding platform & GitHub evidence collectors, target role benchmark catalog, and Node.js ↔ Python/FastAPI AI handoff integration layer for the AI-Powered Employability and Career Readiness Analyzer.

---

## 👥 Team Ownership & Responsibilities

- **Asati (Backend Lead)**:
  - Node.js + Express REST API
  - MongoDB & Mongoose Models (`CandidateProfile`, `JobRole`, `Analysis`)
  - Resume / CV PDF ingestion & text extraction
  - GitHub & Coding Platform evidence collection
  - Candidate profile CRUD, enrichment, & Unified Profile normalization
  - Target-role / benchmark job requirement data
  - React ↔ Node communication & Node ↔ Python/FastAPI integration
  - API testing & deployment readiness
- **Sahaj (Frontend Lead)**: React 18 + Vite UI/UX, dashboards, visuals
- **Aman (AI/ML Lead)**: Python/FastAPI service, scoring models, readiness benchmarks, gap analysis, roadmap generation

---

## 🏗️ Architecture & Pipeline Flow

```text
USER
 ↓
REACT FRONTEND
 ↓
NODE / EXPRESS REST API
 ↓
DATA COLLECTION PIPELINE
 ├── Resume/CV Upload (pdf-parse)
 ├── GitHub Telemetry (GitHub API v3)
 ├── Coding Profiles (LeetCode, Codeforces, HackerRank, CodeChef, GeeksforGeeks)
 ├── College & Academics
 ├── Education History
 ├── Professional Experience
 ├── Projects (Live demo, GitHub, team size)
 ├── Certifications (with credential validation)
 ├── Portfolios
 └── Target Benchmark Role (Linked to JobRole)
 ↓
MONGODB (`candidateprofiles`, `jobroles`, `analyses`)
 ↓
UNIFIED CANDIDATE PROFILE (`GET /api/profiles/:id/unified`)
 ↓
FASTAPI / AI SERVICE HANDOFF (`POST ${AI_SERVICE_URL}/api/analyze`)
 ↓
NORMALIZED ANALYSIS RESULT
 ↓
MONGODB (`analyses`)
 ↓
NODE / EXPRESS
 ↓
REACT FRONTEND
```

---

## 📌 Features & Milestones Completed

### 1. Unified Candidate Profile & Complete CRUD
- **CandidateProfile Schema**: Single document schema capturing student academic details, college, education, experience, skills, projects, certifications, coding/professional profiles, GitHub links, resume/cv documents, and target role.
- **`POST /api/profiles`**: Ingests candidate profile, whitelists schema fields, validates target role, and persists to MongoDB.
- **`GET /api/profiles/:id`**: Retrieves candidate profile JSON by MongoDB ObjectId with 400 (invalid ID) and 404 (not found) error handling.
- **`PUT /api/profiles/:id`**: Whitelist-enforced partial profile updates with automatic completeness recalculation.
- **`DELETE /api/profiles/:id`**: Deletes candidate profile and cascades cleanup to associated analysis records.
- **`GET /api/profiles/:id/unified`**: Assembles normalized unified candidate across all 15 sections. Gracefully handles partial profiles without fake data.

### 2. Resume / CV Document Pipeline
- Accepts PDF files up to 5 MB using `multipart/form-data`.
- Strict PDF MIME type and file extension validation.
- Secure, collision-free server-generated filenames (`doc-<timestamp>-<hash>.pdf`). Never exposes physical filesystem paths to API clients.
- Clean text extraction safely handled using `pdf-parse`.
- Enforces at most one active document per `documentType` (`resume` or `cv`).

### 3. GitHub Profile & Repository Telemetry
- Resolves GitHub profile username from URLs or handles.
- Ingests public repositories, star/fork counts, languages, topics, and standout repository READMEs.
- Aggregates language frequency summary and consistency activity.
- Handles API rate limits (403/429) gracefully without server crashes.

### 4. Coding Platform Integration
- Supports **LeetCode**, **Codeforces**, **CodeChef**, **HackerRank**, and **GeeksforGeeks**.
- Normalizes problems solved, competitive contest ratings, global ranks, difficulty breakdowns, and activity timestamps.
- Preserves URLs and usernames when APIs are rate-limited or unavailable (`fetchStatus: "unavailable"`) without fabricating statistics.
- Prevents duplicate platform entries by updating in-place.

### 5. Benchmark Job Roles & Requirements
- Catalogs 10 industry benchmark job roles with required skills, preferred skills, responsibilities, common technologies, and certifications.
- Endpoints: `GET /api/roles`, `GET /api/roles/:id`, `GET /api/roles/slug/:slug`.
- Enforces JobRole as the single source of truth when assigning target roles.

### 6. Node ↔ Python/FastAPI AI Integration
- `prepareAiPayload`: Sanitizes profile and role data into the exact contract payload expected by FastAPI. Strips all credentials, tokens, and filesystem paths.
- `aiService.analyzeCandidateProfile`: Dispatches payload with timeout protection and AbortController.
- `validateAndNormalizeAiResponse`: Validates upstream AI responses (candidateId, readinessScore, breakdown, skills, strengths, gaps, roadmap) and protects MongoDB against malformed data.
- Duplicate analysis prevention: Returns active in-flight analysis if already running.

---

## 🔐 Environment Variables

Configure `backend/.env` (or project root `.env`):

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/profiq
FRONTEND_URL=http://localhost:5173
GITHUB_TOKEN=your_github_token_here       # Optional (avoids rate limits)
GEMINI_API_KEY=your_gemini_key_here       # Optional
AI_SERVICE_URL=http://localhost:8000      # Optional (FastAPI URL)
AI_SERVICE_TIMEOUT_MS=15000               # Optional (Timeout in ms)
MOCK_AI_SERVICE=false                     # Optional (Mock mode for standalone dev)
```

> **Security Note**: Never commit `.env` or files inside `uploads/` to version control. Both are strictly excluded in `.gitignore`.

---

## 🛠️ Installation & Running

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Run Database & Seed Roles
```bash
npm run seed:roles
```
*(Note: If local MongoDB is not running, the backend automatically initializes an embedded in-memory MongoDB instance so all APIs function out of the box).*

### 3. Run Backend Server
```bash
# Production mode
npm start

# Development mode (with live reload)
npm run dev
```

Server starts on `http://localhost:5000`. Health check at: `http://localhost:5000/api/health`.

---

## 🧪 Testing Commands

The backend includes zero-dependency automated verification test suites:

```bash
# Run all core verification suites:
npm test

# Run individual verification suites:
npm run test:hub          # Candidate data hub & profile CRUD
npm run test:pipeline     # Resume / CV document upload & parsing
npm run test:github       # GitHub telemetry & API ingestion
npm run test:coding       # Coding platform normalization & deduplication
npm run test:unified      # Unified profile aggregation & completeness
npm run test:ai           # Node ↔ FastAPI integration & response validation
npm run test:roles        # Job role benchmark catalog & taxonomy
npm run test:pipeline-e2e # Full end-to-end multi-step realistic candidate pipeline
npm run test:e2e          # Live HTTP end-to-end integration test
```

---

## 📖 API Documentation Reference

For the complete exhaustive documentation of all endpoints, request/response bodies, query parameters, and status codes, see:
👉 [ProfiQ REST API Inventory](../docs/api/api-inventory.md)
