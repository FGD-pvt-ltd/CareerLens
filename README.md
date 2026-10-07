# SkillProof — AI-Powered Employability & Career Readiness Analyzer

> **DataQuest 3.0 Hackathon Project**  
> An AI-driven intelligence platform for evaluating candidate skill authenticity, verifying portfolio evidence, detecting industry skill gaps, and generating personalized career roadmaps.

---

## 📌 Project Architecture Overview

SkillProof is structured as a modular monorepo tailored for a **3-member hackathon team** to collaborate concurrently without merge conflicts or overlapping concerns:

```text
skillproof/
│
├── frontend/                     # Member 1: React + Vite web client
│   ├── public/                   # Static public assets (images, icons)
│   │   ├── images/
│   │   └── icons/
│   └── src/
│       ├── assets/               # Local bundled assets
│       ├── components/           # Reusable UI component modules
│       │   ├── Navbar/
│       │   ├── Dashboard/
│       │   ├── ResumeUpload/
│       │   ├── ProfileInput/
│       │   ├── ScoreCard/
│       │   ├── SkillAnalysis/
│       │   ├── EvidenceCard/
│       │   ├── GapAnalysis/
│       │   └── Roadmap/
│       ├── pages/                # High-level route views
│       │   ├── Landing.jsx
│       │   ├── Login.jsx
│       │   ├── ProfileSetup.jsx
│       │   ├── Analysis.jsx
│       │   ├── Results.jsx
│       │   └── PlacementDashboard.jsx
│       ├── services/             # API client & auth connectors
│       │   ├── api.js
│       │   ├── auth.js
│       │   └── github.js
│       ├── hooks/                # Custom React hooks
│       ├── context/              # State management context providers
│       ├── utils/                # Frontend helpers
│       ├── App.jsx               # App container & route navigator
│       └── main.jsx              # React DOM entrypoint
│
├── backend/                      # Member 2: Node.js + Express REST API & Database
│   ├── src/
│   │   ├── controllers/          # Endpoint request handlers
│   │   │   ├── authController.js
│   │   │   ├── profileController.js
│   │   │   ├── analysisController.js
│   │   │   └── roadmapController.js
│   │   ├── routes/               # Express REST route definitions
│   │   │   ├── authRoutes.js
│   │   │   ├── profileRoutes.js
│   │   │   ├── analysisRoutes.js
│   │   │   └── roadmapRoutes.js
│   │   ├── models/               # MongoDB Mongoose schemas
│   │   │   ├── User.js
│   │   │   ├── Profile.js
│   │   │   ├── Analysis.js
│   │   │   └── JobRole.js
│   │   ├── services/             # Core business logic & integrations
│   │   │   ├── resumeService.js
│   │   │   ├── githubService.js
│   │   │   ├── portfolioService.js
│   │   │   └── analysisService.js
│   │   ├── middleware/           # Auth and error middleware
│   │   ├── config/               # Database and server configs
│   │   ├── utils/                # Server utility functions
│   │   ├── app.js                # Express app configuration
│   │   └── server.js             # Server startup entrypoint
│   └── uploads/                  # Temporary resume file upload storage
│
├── ai-engine/                    # Member 3: Gemini AI Agents, Scoring, & Schemas
│   ├── agents/                   # Autonomous AI prompt executors
│   │   ├── profileAnalyzer/
│   │   ├── skillExtractor/
│   │   ├── evidenceVerifier/
│   │   ├── roleMatcher/
│   │   └── roadmapGenerator/
│   ├── prompts/                  # Versioned LLM prompt templates
│   │   ├── skillExtraction.txt
│   │   ├── evidenceVerification.txt
│   │   ├── roleMatching.txt
│   │   └── roadmapGeneration.txt
│   ├── scoring/                  # Deterministic & weighted scoring formulas
│   │   ├── readinessScore.js
│   │   ├── skillScore.js
│   │   └── evidenceScore.js
│   ├── schemas/                  # JSON Schemas for structured LLM I/O
│   │   ├── profileSchema.json
│   │   ├── skillsSchema.json
│   │   └── analysisSchema.json
│   └── index.js                  # AI Engine aggregator entrypoint
│
├── data/                         # Standardized datasets & role benchmarks
│   ├── skills/                   # Curated technical & soft skills taxonomy
│   │   ├── technicalSkills.json
│   │   └── softSkills.json
│   ├── roles/                    # Target job role skill matrices
│   │   ├── softwareEngineer.json
│   │   ├── dataAnalyst.json
│   │   ├── frontendDeveloper.json
│   │   └── uiuxDesigner.json
│   └── sample-profiles/          # Mock candidate data for testing & demo
│
├── docs/                         # Technical documentation & project artifacts
│   ├── architecture/             # System diagrams and topology
│   ├── api/                      # REST API specifications
│   ├── database/                 # MongoDB collection schema details
│   ├── scoring/                  # Scoring equations & verification logic
│   └── demo/                     # Step-by-step hackathon pitch guide
│
├── tests/                        # Modular test suites
│   ├── frontend/
│   ├── backend/
│   └── ai-engine/
│
├── .env.example                  # Environment configuration template
├── .gitignore                    # Git ignore rules for node, env, build, uploads
├── README.md                     # Monorepo documentation
└── LICENSE                       # MIT License
```

---

## 👥 3-Member Team Division of Responsibilities

| Role | Module Ownership | Core Responsibilities |
| :--- | :--- | :--- |
| **Developer 1 (Frontend)** | `frontend/`, `tests/frontend/` | UI/UX design, interactive dashboards, file upload widgets, visual scorecards, gap visualizer, and API consumption. |
| **Developer 2 (Backend & DB)** | `backend/`, `data/`, `tests/backend/` | REST API routes, controllers, MongoDB schemas, JWT auth, GitHub REST API data fetcher, and file upload handling. |
| **Developer 3 (AI Engine & Scoring)** | `ai-engine/`, `docs/`, `tests/ai-engine/` | Gemini prompt engineering, evidence verification algorithms, scoring formulas, JSON schema contracts, and roadmap generator. |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18+ (v20+ recommended)
- **npm**: v9+
- **MongoDB**: Local MongoDB instance or MongoDB Atlas URI
- **Google Gemini API Key**: [Google AI Studio](https://aistudio.google.com/)

---

### 1. Environment Setup

Copy `.env.example` to `.env` in the root (or your backend directory) and configure your keys:

```bash
cp .env.example .env
```

Ensure the following variables are configured:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/skillproof
GEMINI_API_KEY=your_gemini_api_key_here
GITHUB_TOKEN=your_github_token_here
CLIENT_URL=http://localhost:5173
```

---

### 2. Independent Execution

Both frontend and backend can be installed and executed independently:

#### Backend Server
```bash
cd backend
npm install
npm run dev
```
Backend runs by default on: `http://localhost:5000`  
Health check endpoint: `http://localhost:5000/api/health`

#### Frontend Client
```bash
cd frontend
npm install
npm run dev
```
Frontend runs by default on: `http://localhost:5173`

---

### 3. Monorepo Root Commands

For convenience, helper scripts are provided in the root `package.json`:

```bash
# Install dependencies for both frontend and backend
npm run install:all

# Start backend in development mode
npm run dev:backend

# Start frontend in development mode
npm run dev:frontend
```

---

## 🛡️ Security & Secret Management
- **Never commit `.env` or API credentials** to version control.
- All temporary uploaded files in `backend/uploads/` are ignored by git (preserving only `.gitkeep`).
- The Gemini API key and GitHub personal access token must be kept purely in environment variables.
#   C a r e e r L e n s  
 