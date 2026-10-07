# ProfiQ — Backend Services

> **ProfiQ Backend** — Core server-side API, candidate profile management, secure document ingestion pipeline, and data layer for the AI-Powered Employability and Career Readiness Analyzer.

---

## 📌 Milestones Overview

### 1. Candidate Data Hub
- **MongoDB Connection**: Connects to MongoDB via Mongoose with clean connection logging and failover timeout.
- **CandidateProfile Data Model**: Single document schema capturing student academic details, college, education, experience, skills, projects, certifications, coding/professional profiles, GitHub links, resume/cv documents, and target role.
- **`POST /api/profiles`**: Ingests candidate profile data, validates inputs, and persists to the `candidateprofiles` collection.
- **`GET /api/profiles/:id`**: Retrieves candidate profile JSON by MongoDB ObjectId with 400 (invalid ID) and 404 (not found) error handling.
- **`GET /api/health`**: Verifies backend server health status.

### 2. Resume / CV Document Pipeline
- **Secure File Ingestion**: Accepts PDF files up to 5 MB using `multipart/form-data`.
- **Validation**: Strict PDF MIME type and file extension validation. Rejects missing files, non-PDF formats, and oversized uploads with HTTP 400.
- **Safe Server-Side Storage**: Stores uploaded documents under `backend/uploads/` using secure, collision-free server-generated filenames (`doc-<timestamp>-<hash>.pdf`). Never exposes physical filesystem paths to API clients.
- **PDF Text Extraction**: Extracts machine-readable text safely using `pdf-parse`. Marks `extractionStatus` as `"completed"` or `"failed"` without crashing.
- **Document Replacement Policy**: Enforces at most one active document per `documentType` (`resume` or `cv`). Uploading a new resume replaces the previous one.
- **AI Engine Readiness**: Exposes `getCandidateDocumentText(profileId)` returning structured `{ resumeText, cvText }` for future AI consumption (Aman's module).

---

## 🏗️ Architecture & Folder Structure

```text
backend/
├── src/
│   ├── config/
│   │   ├── db.js                   # Mongoose connection with error handling
│   │   └── env.js                  # Centralized environment loader
│   ├── controllers/
│   │   ├── profileController.js    # Profile creation and retrieval handlers
│   │   └── documentController.js   # Resume / CV upload, list, details, and raw text
│   ├── middleware/
│   │   ├── errorHandler.js         # Centralized error handler (CastError, Multer, etc.)
│   │   └── uploadMiddleware.js     # Multer storage, PDF validation, 5MB limit
│   ├── models/
│   │   └── CandidateProfile.js     # Unified schema with 13 sections + documents array
│   ├── routes/
│   │   ├── profileRoutes.js        # /api/profiles routes
│   │   └── documentRoutes.js       # /api/profiles/:id/documents sub-routes
│   ├── services/
│   │   ├── profileService.js       # Database persistence operations
│   │   └── resumeService.js        # PDF text extraction and AI text combiner
│   ├── app.js                      # Express configuration, CORS, and route mounting
│   └── server.js                   # Server bootstrap: Env -> Connect DB -> Start Server
├── uploads/                        # Server-side uploaded PDF documents (.gitkeep)
├── test-candidate-hub.js           # Candidate Data Hub verification test suite
├── test-document-pipeline.js       # Document Pipeline verification test suite
├── .env.example                    # Environment variable template
├── .env                            # Active environment variables (git-ignored)
├── package.json                    # Dependencies and scripts
└── README.md                       # Service documentation
```

---

## 🔐 Environment Variables

Create or update `backend/.env` based on `backend/.env.example`:

```env
PORT=5000
MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@CLUSTER/profiq
FRONTEND_URL=http://localhost:5173
```

> **Note**: Never commit `.env` or files inside `uploads/` to version control. Both are included in `.gitignore`.

---

## 🛠️ Installation & Running

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Run Verification Test Suites
```bash
# Run all test suites
npm test

# Run Candidate Data Hub tests only
npm run test:hub

# Run Document Pipeline tests only
npm run test:pipeline
```

### 3. Start Development Server (with Hot Reload)
```bash
npm run dev
```

### 4. Start Production Server
```bash
npm start
```

---

## 📡 API Endpoints

### 1. Health Check
- **Endpoint**: `GET /api/health`
- **Response** (HTTP 200 OK):
```json
{
  "success": true,
  "message": "ProfiQ backend is running"
}
```

---

### 2. Candidate Profiles

#### Create Profile
- **Endpoint**: `POST /api/profiles`
- **Headers**: `Content-Type: application/json`
- **Response** (HTTP 201 Created):
```json
{
  "success": true,
  "message": "Candidate profile created successfully",
  "data": {
    "profile": {
      "_id": "6703ee54fa315a6760592b01",
      "basicInfo": { "name": "Test Candidate", "email": "test@example.com" },
      "documents": []
    }
  }
}
```

#### Retrieve Profile by ID
- **Endpoint**: `GET /api/profiles/:id`
- **Response** (HTTP 200 OK):
```json
{
  "success": true,
  "data": {
    "profile": {
      "_id": "6703ee54fa315a6760592b01",
      "basicInfo": { "name": "Test Candidate" },
      "documents": []
    }
  }
}
```

---

### 3. Resume / CV Document Pipeline

#### Upload Resume or CV
- **Endpoint**: `POST /api/profiles/:id/documents`
- **Content-Type**: `multipart/form-data`
- **Form Fields**:
  - `file`: PDF file (max 5 MB)
  - `documentType`: `"resume"` or `"cv"`
- **Response** (HTTP 201 Created):
```json
{
  "success": true,
  "message": "Document uploaded and processed successfully",
  "data": {
    "document": {
      "_id": "6703f191fa315a6760592b05",
      "documentType": "resume",
      "fileName": "my_resume.pdf",
      "mimeType": "application/pdf",
      "fileSize": 128450,
      "extractionStatus": "completed",
      "uploadedAt": "2026-10-07T11:55:00.000Z"
    }
  }
}
```
*(Notice: Local filesystem path and raw extracted text are omitted from the upload response).*

#### List Candidate Documents
- **Endpoint**: `GET /api/profiles/:id/documents`
- **Response** (HTTP 200 OK):
```json
{
  "success": true,
  "data": {
    "documents": [
      {
        "_id": "6703f191fa315a6760592b05",
        "documentType": "resume",
        "fileName": "my_resume.pdf",
        "mimeType": "application/pdf",
        "fileSize": 128450,
        "extractionStatus": "completed",
        "uploadedAt": "2026-10-07T11:55:00.000Z"
      }
    ]
  }
}
```

#### Get Document Details by ID
- **Endpoint**: `GET /api/profiles/:id/documents/:documentId`
- **Response** (HTTP 200 OK):
```json
{
  "success": true,
  "data": {
    "document": {
      "_id": "6703f191fa315a6760592b05",
      "documentType": "resume",
      "fileName": "my_resume.pdf",
      "mimeType": "application/pdf",
      "fileSize": 128450,
      "extractionStatus": "completed",
      "extractedText": "Alex Mercer Software Engineer...",
      "uploadedAt": "2026-10-07T11:55:00.000Z"
    }
  }
}
```

#### Get Raw Document Text for AI Service (Aman's Module)
- **Endpoint**: `GET /api/profiles/:id/documents/text`
- **Response** (HTTP 200 OK):
```json
{
  "success": true,
  "data": {
    "resumeText": "Alex Mercer Software Engineer...",
    "cvText": null
  }
}
```

---

## 🔒 Security & Validation Details

- **File Type**: Strictly limited to `application/pdf` with `.pdf` extension.
- **File Size**: Maximum 5 MB enforced at the Multer layer.
- **File Naming**: Collision-resistant cryptographic random server-side filename (`doc-<timestamp>-<randomHex>.pdf`).
- **Filesystem Privacy**: Server filesystem paths (`storagePath`) are never leaked to API clients.
- **Git Protection**: `uploads/*` is excluded from git commits via `.gitignore`.
