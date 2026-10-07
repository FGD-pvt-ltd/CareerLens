# ProfiQ — Architecture Overview

ProfiQ is an AI-powered employability and career readiness analyzer designed for engineering and technology students, academic placement cells, and recruiters.

## System Architecture

```text
┌────────────────────────────────────────────────────────┐
│                   Frontend (React + Vite)              │
│  - Candidate Portal (Resume Upload, Profile Inputs)    │
│  - Placement Cell & Admin Dashboard                    │
│  - ScoreCards, Skill Visualizer & Roadmap View         │
└───────────────────────────┬────────────────────────────┘
                            │ REST API (JSON)
                            ▼
┌────────────────────────────────────────────────────────┐
│                   Backend (Node.js + Express)          │
│  - Authentication & Authorization                      │
│  - Profile & Document Ingestion Controllers            │
│  - Pipeline Orchestrator & Storage Access              │
└──────────────┬────────────────────────────┬────────────┘
               │                            │
               ▼                            ▼
┌─────────────────────────┐    ┌─────────────────────────┐
│     Database (MongoDB)  │    │      AI Engine (Gemini) │
│  - Users, Profiles      │    │  - Skill Extraction     │
│  - JobRole Benchmarks   │    │  - Evidence Verification│
│  - Analysis & Roadmaps  │    │  - Scoring & Roadmaps   │
└─────────────────────────┘    └─────────────────────────┘
```

## Team Responsibilities (3-Member Team)

1. **Member 1 — Frontend Specialist:**
   - React components (future: ScoreCard, EvidenceCard, GapAnalysis, Roadmap, ResumeUpload)
   - Route pages (future: Landing, ProfileSetup, Analysis, Results, PlacementDashboard)
   - State management, responsive UI, and backend API integration.

2. **Member 2 — Backend & Database Specialist:**
   - Express routing, controllers, and middleware.
   - MongoDB schemas (`User`, `Profile`, `Analysis`, `JobRole`).
   - GitHub API integration & resume file ingestion services.

3. **Member 3 — AI Engine & Scoring Specialist:**
   - Gemini API prompt engineering and schema validation.
   - Verification heuristics and evidence scoring engines.
   - Skill gap calculation and milestone roadmap generator.
