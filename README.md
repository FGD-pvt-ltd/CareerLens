# ProfiQ

> **ProfiQ** — An AI-Powered Employability and Career Readiness Analyzer.

---

## 🏗️ Current Architecture

ProfiQ is designed as a modular monorepo tailored for high-speed hackathon execution and structured collaboration across a **3-member team**. 

```text
┌────────────────────────────────────────────────────────┐
│                   Frontend (React + Vite)              │
│  - Candidate Portal (Resume Ingestion, Skills, Links)  │
│  - Institutional / Placement Dashboard                 │
│  - Readiness Scorecard, Evidence Breakdown, Roadmap    │
└───────────────────────────┬────────────────────────────┘
                            │ REST API (JSON)
                            ▼
┌────────────────────────────────────────────────────────┐
│                   Backend (Node.js + Express)          │
│  - Health Check & Auth / Session Routing               │
│  - Profile Ingestion & Verification Orchestrator       │
│  - MongoDB Storage & External API Connectors (GitHub)  │
└──────────────┬────────────────────────────┬────────────┘
               │                            │
               ▼                            ▼
┌─────────────────────────┐    ┌─────────────────────────┐
│     Database (MongoDB)  │    │   AI Engine (Gemini)    │
│  - Users & Profiles     │    │  - Skill Extraction     │
│  - Job Role Benchmarks  │    │  - Evidence Verification│
│  - Analysis Reports     │    │  - Role Matching        │
│  - Growth Roadmaps      │    │  - Scoring Engine       │
└─────────────────────────┘    └─────────────────────────┘
```

- **Frontend Client (`frontend/`)**: Modern React 18 SPA powered by Vite for rapid development and high-performance asset bundling.
- **Backend Service (`backend/`)**: Express REST API coordinating profile ingestion, external validation (e.g., GitHub verification), database persistence, and AI orchestration.
- **AI Engine (`ai-engine/`)**: Modular architecture targeting Google Gemini models for skill extraction, artifact verification, benchmark comparison, and scoring algorithms.
- **Data Repository (`data/`)**: Canonical taxonomies of technical/soft skills, job role benchmark matrices, and mock candidate profiles for offline testing.
- **Documentation (`docs/`)**: Specifications covering architecture, REST endpoints, database schemas, evaluation logic, and demo scripts.
- **Test Suites (`tests/`)**: Test directories for frontend, backend, and AI engine modules.

---

## 📁 Folder Structure

```text
profiq/
├── frontend/                     # React + Vite application
│   ├── public/                   # Static public assets
│   ├── src/
│   │   ├── assets/               # Local bundled assets
│   │   ├── components/           # Reusable UI component modules
│   │   ├── pages/                # Application views
│   │   ├── services/             # API client services (api.js)
│   │   ├── hooks/                # Custom React hooks
│   │   ├── context/              # Global state management
│   │   ├── utils/                # Frontend helper functions
│   │   ├── App.jsx               # Main React application component
│   │   ├── main.jsx              # React DOM mounting entrypoint
│   │   └── index.css             # Design tokens & core styling
│   ├── index.html                # HTML5 entrypoint
│   ├── package.json              # Frontend dependencies and scripts
│   └── vite.config.js            # Vite configuration
│
├── backend/                      # Node.js + Express REST API
│   ├── src/
│   │   ├── controllers/          # Endpoint request handlers
│   │   ├── routes/               # Express REST route definitions
│   │   ├── models/               # MongoDB Mongoose schemas
│   │   ├── services/             # Business logic & external API connectors
│   │   ├── middleware/           # Auth and error handling middleware
│   │   ├── config/               # Database and environment configurations
│   │   ├── utils/                # Backend utilities and helpers
│   │   ├── app.js                # Express app setup and middleware pipeline
│   │   └── server.js             # Server startup entrypoint
│   ├── uploads/                  # Uploaded resume files (git-ignored)
│   └── package.json              # Backend dependencies and scripts
│
├── ai-engine/                    # AI agents, prompts, schemas, and scoring
│   ├── skill-extraction/         # Resume & profile skill extractor module
│   ├── evidence-verification/    # Code repo & commit artifact verifier
│   ├── role-matching/            # Benchmark role requirement matcher
│   ├── roadmap-generation/       # Personalized career roadmap generator
│   ├── scoring/                  # Deterministic & weighted scoring formulas
│   ├── prompts/                  # LLM prompt templates
│   ├── schemas/                  # Structured JSON I/O schemas
│   └── index.js                  # AI Engine aggregator entrypoint
│
├── data/                         # Role matrices and skill benchmarks
│   ├── roles/                    # Target role benchmark skill definitions
│   ├── skills/                   # Technical and soft skills taxonomy
│   └── sample-profiles/          # Mock candidate profiles for testing
│
├── docs/                         # Project specifications & documentation
│   ├── architecture/             # Architecture overview & diagrams
│   ├── api/                      # REST API endpoints documentation
│   ├── database/                 # MongoDB database schemas
│   ├── scoring/                  # Employability scoring methodology
│   └── demo/                     # Hackathon presentation and demo script
│
├── tests/                        # Automated test suites
│   ├── frontend/                 # Frontend component & UI tests
│   ├── backend/                  # API and database tests
│   └── ai-engine/                # Prompt & scoring tests
│
├── .env.example                  # Environment configuration template
├── .gitignore                    # Version control exclusions
├── LICENSE                       # MIT License
├── package.json                  # Monorepo root scripts
└── README.md                     # Project documentation
```

---

## ⚙️ Setup Instructions

### Prerequisites
- **Node.js**: v18+ (Node v20+ recommended)
- **npm**: v9+
- **MongoDB**: Local MongoDB instance or MongoDB Atlas cluster (optional for initial foundation)
- **Git**

### Installation

1. Clone the repository and navigate into the project root:
   ```bash
   git clone <repository-url> profiq
   cd profiq
   ```

2. Copy the environment configuration:
   ```bash
   cp .env.example .env
   ```

3. Install all dependencies across both frontend and backend using the root helper:
   ```bash
   npm run install:all
   ```
   *(Or run `npm install` inside both `frontend/` and `backend/` folders individually.)*

---

## 🚀 How to Run the Project

### Running Backend Server
```bash
# From the root directory:
npm run dev:backend

# Or directly from backend/:
cd backend
npm run dev
```
- **Port**: `http://localhost:5000`
- **Health Check Endpoint**: [`http://localhost:5000/api/health`](http://localhost:5000/api/health)
  - Returns `{ "status": "ok", "service": "ProfiQ Backend API", "version": "1.0.0" }`

### Running Frontend Client
```bash
# From the root directory:
npm run dev:frontend

# Or directly from frontend/:
cd frontend
npm run dev
```
- **Port**: `http://localhost:5173`
- The foundation interface confirms live connectivity to the backend health check.

---

## 🔐 Environment Variables Required

Configure the following variables in `.env` (refer to `.env.example`):

| Variable | Description | Example / Default | Required / Optional |
| :--- | :--- | :--- | :--- |
| `PORT` | Backend server port | `5000` | Required |
| `MONGODB_URI` | MongoDB connection URI string | `mongodb://localhost:27017/profiq` | Required in prod (auto-fallback in dev) |
| `FRONTEND_URL` | Allowed origin for CORS policy | `http://localhost:5173` | Required |
| `GITHUB_TOKEN` | GitHub Personal Access Token for telemetry | `ghp_...` | Optional (prevents API rate limits) |
| `GEMINI_API_KEY` | Google Gemini API key for AI engine | `AIza...` | Optional |
| `AI_SERVICE_URL` | Upstream Python/FastAPI AI engine URL | `http://localhost:8000` | Optional |
| `AI_SERVICE_TIMEOUT_MS` | AI service HTTP request timeout (ms) | `15000` | Optional (default: 15000) |
| `MOCK_AI_SERVICE` | Enable mock AI responses for isolated dev | `false` | Optional |

---

## 🧪 Testing Commands

```bash
# Run all backend automated tests:
cd backend
npm test

# Run full realistic pipeline end-to-end verification:
npm run test:pipeline-e2e

# Run live HTTP end-to-end tests:
npm run test:e2e
```

---

## 📖 API Documentation Reference

For the complete specification of all backend endpoints, schemas, request/response models, and status codes:
👉 [ProfiQ REST API Inventory](docs/api/api-inventory.md)

---

## 👥 Team Development Structure

ProfiQ is cleanly divided across **3 team members** with clear boundaries:

| Member / Role | Module Ownership | Core Deliverables |
| :--- | :--- | :--- |
| **Sahaj (Frontend Lead)** | `frontend/`, `tests/frontend/` | UI/UX implementation, candidate input flows, placement dashboard, responsive scorecards, gap visualizer, and React state management. |
| **Asati (Backend & Data Lead)** | `backend/`, `data/`, `tests/backend/` | Express REST APIs, MongoDB Mongoose schemas, Resume extraction, GitHub & coding platform collectors, unified profile normalization, Node ↔ FastAPI integration. |
| **Aman (AI/ML Lead)** | `ai-engine/`, `docs/`, `tests/ai-engine/` | Python/FastAPI service, prompt engineering, evidence verification heuristics, skill gap scoring algorithms, readiness metrics, and career roadmap generation. |