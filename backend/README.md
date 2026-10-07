# ProfiQ — Backend REST API Service

> **ProfiQ Backend** — Core server-side API, candidate profile management, evidence normalization, and orchestration layer for the AI-Powered Employability and Career Readiness Analyzer.

---

## 📌 Backend Purpose

The ProfiQ Backend is responsible for:
1. Ingesting student candidate credentials, public links (GitHub, portfolio, competitive coding), and resume documents.
2. Securely storing uploaded PDF resumes and performing text/entity extraction.
3. Querying the official GitHub REST API to retrieve and normalize public development artifacts (repositories, languages, stars, commit history).
4. Normalizing multi-source candidate evidence into a consistent internal schema ready for downstream AI scoring.
5. Identifying objective skill gaps against standardized industry role benchmarks (`JobRole`).
6. Generating personalized 4-phase milestone roadmaps.
7. Providing a modular foundation ready to connect cleanly with the Gemini AI Engine.

---

## 🏗️ Architecture & Folder Structure

```text
backend/
├── src/
│   ├── config/
│   │   ├── db.js                   # Mongoose connection with resilient dev fallback
│   │   └── env.js                  # Centralized environment variable loader
│   │
│   ├── controllers/
│   │   ├── profileController.js    # Candidate profile CRUD & resume ingestion
│   │   ├── analysisController.js   # Analysis pipeline & readiness report retrieval
│   │   ├── roadmapController.js    # Career progression milestones
│   │   └── githubController.js     # GitHub profile & repository evidence analyzer
│   │
│   ├── routes/
│   │   ├── profileRoutes.js        # /api/profiles endpoints
│   │   ├── analysisRoutes.js       # /api/analysis endpoints
│   │   ├── roadmapRoutes.js        # /api/roadmap endpoints
│   │   └── githubRoutes.js         # /api/github endpoints
│   │
│   ├── models/
│   │   ├── User.js                 # Authentication & account model
│   │   ├── CandidateProfile.js     # Student profile, links, resume text, projects
│   │   ├── Skill.js                # Claimed & verified skills taxonomy
│   │   ├── Evidence.js             # Multi-source normalized proof artifacts
│   │   ├── Analysis.js             # Evaluation run with readiness breakdown & gaps
│   │   └── JobRole.js              # Standardized industry benchmarks & skill weights
│   │
│   ├── services/
│   │   ├── resumeService.js        # PDF text parsing & keyword extraction
│   │   ├── githubService.js        # Official GitHub API v3 connector & normalizer
│   │   ├── portfolioService.js     # Web portfolio & coding profile evidence
│   │   ├── profileService.js       # Profile database operations & persistence
│   │   ├── roleService.js          # Industry role benchmarks & seed loader
│   │   ├── analysisService.js      # Evidence normalization & gap detection
│   │   └── roadmapService.js       # Milestone generation & learning priorities
│   │
│   ├── middleware/
│   │   ├── errorHandler.js         # Centralized Express error handler
│   │   ├── uploadMiddleware.js     # Multer PDF storage & 5MB size validator
│   │   └── validationMiddleware.js # Input sanitizers & MongoDB ObjectId validators
│   │
│   ├── utils/
│   │   ├── response.js             # Standardized success/error JSON responders
│   │   └── validators.js           # Regex & URL validation helpers
│   │
│   ├── app.js                      # Express configuration, CORS, and route mounting
│   └── server.js                   # Database initialization, seeding & server listen
│
├── uploads/                        # Temporary uploaded PDF resumes (.gitkeep)
├── .env                            # Active environment variables (git-ignored)
├── .env.example                    # Environment variable template
├── package.json                    # Backend dependencies & lifecycle scripts
└── README.md                       # Service documentation
```

---

## 🔐 Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `PORT` | HTTP server listening port | `5000` |
| `MONGODB_URI` | MongoDB connection URI string | `mongodb://localhost:27017/profiq` |
| `GITHUB_TOKEN` | GitHub Personal Access Token (for higher API rate limits) | `optional` |
| `GEMINI_API_KEY` | Google Gemini API key (for future AI Engine modules) | `optional` |
| `FRONTEND_URL` | Client origin allowed by CORS | `http://localhost:5173` |
| `NODE_ENV` | Runtime environment mode | `development` |

---

## 🛠️ Setup & Running

### Prerequisites
- Node.js v18+ (Node v20+ recommended)
- npm v9+
- MongoDB (Local instance or MongoDB Atlas URI; resilient in-memory fallback enabled for offline development)

### Installation
```bash
cd backend
npm install
```

### Run in Development Mode (with Hot Reload)
```bash
npm run dev
```

### Run in Production Mode
```bash
npm start
```

### Seed Job Role Benchmarks
```bash
npm run seed
```

---

## 📡 REST API Endpoints

All responses adhere to standardized JSON formats:
- **Success**: `{ "success": true, "data": ... }`
- **Error**: `{ "success": false, "error": "..." }`

### 1. Health Check
- `GET /api/health`
  - Returns service operational status and version.

### 2. Candidate Profiles
- `POST /api/profiles`
  - Create a new candidate profile.
  - Body: `{ "name": "Alex Mercer", "email": "alex@example.com", "githubUrl": "https://github.com/alex", "targetRole": "Frontend Developer" }`
- `GET /api/profiles/:id`
  - Retrieve candidate profile by MongoDB ObjectId.
- `PUT /api/profiles/:id`
  - Update candidate profile fields.
- `DELETE /api/profiles/:id`
  - Delete candidate profile.

### 3. Resume Upload & Text Extraction
- `POST /api/profiles/:id/resume`
  - Multipart form-data with file field `resume`.
  - Accepts PDF documents up to 5MB.
  - Automatically extracts plain text, identifies skills, and safely stores file metadata without exposing server filesystem paths.

### 4. GitHub Evidence Analysis
- `POST /api/github/analyze`
  - Body: `{ "username": "torvalds" }` or `{ "url": "https://github.com/torvalds" }`
  - Uses the official GitHub REST API to analyze repositories, languages, stars, and activity into standardized evidence items.

### 5. Profile Analysis (Evidence Normalization)
- `POST /api/analysis`
  - Body: `{ "candidateId": "...", "targetRole": "Software Engineer" }`
  - Aggregates multi-source evidence (resume, GitHub, portfolio).
  - Detects objective skill gaps against benchmark role requirements.
  - Creates analysis with `status: "pending"` and `readinessScore: null` (no artificial/fake scores).
- `GET /api/analysis/:id`
  - Returns complete analysis record, skill gaps, recommendations, and roadmap reference.

### 6. Career Readiness Roadmap
- `GET /api/roadmap/:analysisId`
  - Returns structured 4-phase milestone roadmap tailored to identified skill gaps and target role.

---

## 🗄️ MongoDB Setup

1. **Local MongoDB**: Install MongoDB Community Server and start the daemon at `mongodb://localhost:27017`.
2. **MongoDB Atlas**: Create a free cloud cluster at [mongodb.com/atlas](https://www.mongodb.com/atlas) and set `MONGODB_URI` in `.env`:
   ```env
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/profiq?retryWrites=true&w=majority
   ```
3. **Resilient Dev Mode**: If MongoDB is not reachable, the server gracefully activates its in-memory storage layer so development and testing continue uninterrupted.

---

## 🐙 GitHub API Setup

To prevent GitHub API rate limits (60 requests/hr for unauthenticated IP), generate a GitHub Personal Access Token at [github.com/settings/tokens](https://github.com/settings/tokens) (no special scopes needed for public repos) and configure:
```env
GITHUB_TOKEN=ghp_yourPersonalAccessTokenHere
```
This increases the limit to 5,000 requests per hour.
