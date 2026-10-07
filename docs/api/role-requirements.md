# ProfiQ Target Role & Job Requirements Contract

**Team Interface**: Asati (Backend / Data) ↔ Aman (AI / ML)  
**Document Version**: 1.0.0  
**Status**: Implemented & Seeded  

---

## 1. Overview & Architectural Role

The Target Role & Job Requirement system establishes the deterministic ground-truth requirements for careers supported by ProfiQ.

```
React (Sahaj)
  ↓ [Candidate selects Target Role]
Node.js / Express (Asati)
  ↓ [Validates role & persists reference]
MongoDB (Collection: jobroles)
  ↓ [Candidate Profile + Target Role Requirements Snapshot]
Python / FastAPI (Aman)
  ↓ [Performs AI reasoning: Candidate Evidence vs. Role Requirements]
Readiness Score + Skill Gaps + Roadmap
```

> **Strict Boundary**: Asati's backend provides structured role requirement data and canonical skill normalization only. Aman owns all evaluation formulas, evidence matching, DSA/project weighting, readiness scores, and personalized roadmap synthesis.

---

## 2. JobRole Schema Definition

Each document in the `jobroles` collection conforms to the following schema:

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | `String` / `ObjectId` | Yes | Unique MongoDB identifier |
| `name` | `String` | Yes | Canonical display name of the role (e.g., `"Backend Developer"`) |
| `slug` | `String` | Yes | URL-friendly, lowercase unique slug (e.g., `"backend-developer"`) |
| `category` | `String` | Yes | Industry sector (`"Engineering"`, `"Data & Analytics"`, `"Infrastructure"`, `"Design"`, `"Security"`) |
| `description` | `String` | No | Role overview and scope description |
| `requiredSkills` | `Array<SkillRequirement>` | Yes | Core skills required for the role |
| `preferredSkills` | `Array<SkillRequirement>` | Yes | Secondary / differentiating skills |
| `responsibilities` | `Array<String>` | No | Typical day-to-day duties |
| `commonTechnologies` | `Array<String>` | No | Primary tools and frameworks in this domain |
| `relevantCertifications` | `Array<String>` | No | Industry-recognized certifications relevant to the role |
| `relevantCoursework` | `Array<String>` | No | Academic curriculum relevant to this specialization |
| `experienceExpectations` | `Array<String>` | No | Qualitative project and assessment expectations |
| `active` | `Boolean` | Yes | Whether the role is available for selection (`default: true`) |
| `createdAt` / `updatedAt` | `Date` | Yes | ISO 8601 timestamps |

---

## 3. Skill Requirement Schema & Enumerations

Each item in `requiredSkills` and `preferredSkills` has the following structure:

```json
{
  "skillName": "Node.js",
  "category": "backend",
  "importance": "core",
  "expectedLevel": "intermediate"
}
```

### `importance` Enum

Describes the requirement level of the role itself (NOT the candidate's score):
- `core`: Indispensable foundation. A candidate lacking this skill cannot credibly function in this role.
- `important`: Highly expected. Significantly impacts candidate readiness.
- `optional`: Beneficial differentiator. Enhances competitiveness without being a gatekeeper.

### `expectedLevel` Enum

Describes the proficiency level expected for early-to-mid career benchmark roles:
- `beginner`: Familiarity with syntax, concepts, and basic usage.
- `intermediate`: Ability to independently build features, handle errors, and integrate with surrounding systems.
- `advanced`: Mastery of concurrency, internals, performance optimization, and architectural best practices.

### `category` Enum

Standardized taxonomy categories:
- `programming`
- `frontend`
- `backend`
- `database`
- `cloud`
- `devops`
- `data`
- `machine-learning`
- `cybersecurity`
- `design`
- `soft-skill`
- `tools`

---

## 4. REST Endpoints for AI / Consumer Access

### 4.1 List All Available Roles
`GET /api/roles`

**Response (`200 OK`):**
```json
{
  "success": true,
  "data": {
    "roles": [
      {
        "id": "670356...",
        "name": "Backend Developer",
        "slug": "backend-developer",
        "category": "Engineering",
        "description": "Server-side architect focused on scalable RESTful microservices...",
        "requiredSkills": [...],
        "preferredSkills": [...]
      }
    ],
    "total": 10
  }
}
```

### 4.2 Get Role by Slug
`GET /api/roles/slug/:slug`

Example: `GET /api/roles/slug/backend-developer`

**Response (`200 OK`):**
```json
{
  "success": true,
  "data": {
    "role": {
      "id": "670356...",
      "name": "Backend Developer",
      "slug": "backend-developer",
      "category": "Engineering",
      "description": "Server-side architect focused on scalable RESTful microservices...",
      "requiredSkills": [
        { "skillName": "Node.js", "category": "backend", "importance": "core", "expectedLevel": "intermediate" },
        { "skillName": "Express.js", "category": "backend", "importance": "core", "expectedLevel": "intermediate" },
        { "skillName": "REST APIs", "category": "backend", "importance": "core", "expectedLevel": "advanced" },
        { "skillName": "MongoDB", "category": "database", "importance": "core", "expectedLevel": "intermediate" },
        { "skillName": "SQL", "category": "database", "importance": "important", "expectedLevel": "intermediate" },
        { "skillName": "Git", "category": "tools", "importance": "core", "expectedLevel": "intermediate" }
      ],
      "preferredSkills": [
        { "skillName": "Redis", "category": "database", "importance": "important", "expectedLevel": "beginner" },
        { "skillName": "Docker", "category": "devops", "importance": "important", "expectedLevel": "beginner" },
        { "skillName": "System Design", "category": "backend", "importance": "important", "expectedLevel": "intermediate" },
        { "skillName": "AWS", "category": "cloud", "importance": "optional", "expectedLevel": "beginner" }
      ],
      "responsibilities": [
        "Design, implement, and maintain high-performance REST APIs",
        "Structure relational and document-oriented database models with indices",
        "Implement authentication, authorization (JWT), and rate-limiting safeguards"
      ],
      "commonTechnologies": ["Node.js", "Express.js", "MongoDB", "PostgreSQL", "Redis", "Docker", "Git"],
      "relevantCertifications": [
        "OpenJS Node.js Application Developer (JSNAD)",
        "AWS Certified Developer - Associate"
      ],
      "relevantCoursework": [
        "Database Management Systems",
        "Distributed Systems",
        "Computer Networks & Protocols"
      ],
      "experienceExpectations": [
        "Experience designing CRUD endpoints with validation and error handling",
        "Familiarity with query optimization, schema indexing, and security best practices"
      ],
      "active": true
    }
  }
}
```

### 4.3 Get Role by MongoDB ObjectId
`GET /api/roles/:id`

Returns identical structure by ID. If not found, responds with `404 Not Found`:
```json
{
  "success": false,
  "error": "Job role not found"
}
```

---

## 5. Candidate Profile Target Role Representation

In `CandidateProfile`, the candidate references their selected target role without duplicating all requirements:

```json
{
  "targetRole": {
    "roleId": "670356...",
    "roleName": "Backend Developer",
    "slug": "backend-developer"
  }
}
```

When changing the target role via `PUT /api/profiles/:id/target-role` or `PUT /api/profiles/:id`:
- Backend validates that the role ID or slug exists and is active.
- If invalid or inactive:
  ```json
  {
    "success": false,
    "error": "Target role not found"
  }
  ```

---

## 6. Target Role Snapshot in AI Analysis Payload

When `POST /api/analysis` sends data to Aman's FastAPI service (`POST /api/analyze`), the payload provides both candidate evidence and the role requirements snapshot:

```json
{
  "candidateId": "6ac6812e13e083843ca5a94b",
  "targetRole": {
    "roleId": "670356a...",
    "roleName": "Backend Developer",
    "slug": "backend-developer",
    "requirements": {
      "requiredSkills": [
        { "skillName": "Node.js", "category": "backend", "importance": "core", "expectedLevel": "intermediate" },
        { "skillName": "Express.js", "category": "backend", "importance": "core", "expectedLevel": "intermediate" },
        { "skillName": "REST APIs", "category": "backend", "importance": "core", "expectedLevel": "advanced" },
        { "skillName": "MongoDB", "category": "database", "importance": "core", "expectedLevel": "intermediate" },
        { "skillName": "SQL", "category": "database", "importance": "important", "expectedLevel": "intermediate" },
        { "skillName": "Git", "category": "tools", "importance": "core", "expectedLevel": "intermediate" }
      ],
      "preferredSkills": [
        { "skillName": "Redis", "category": "database", "importance": "important", "expectedLevel": "beginner" },
        { "skillName": "Docker", "category": "devops", "importance": "important", "expectedLevel": "beginner" },
        { "skillName": "System Design", "category": "backend", "importance": "important", "expectedLevel": "intermediate" }
      ],
      "responsibilities": [...],
      "commonTechnologies": ["Node.js", "Express.js", "MongoDB", "PostgreSQL", "Redis", "Docker", "Git"]
    }
  },
  "profile": {
    "basicInfo": { ... },
    "college": { ... },
    "education": [ ... ],
    "experience": [ ... ],
    "skills": [ ... ],
    "projects": [ ... ],
    "certifications": [ ... ],
    "resume": { ... },
    "github": { ... },
    "codingProfiles": [ ... ]
  }
}
```

---

## 7. Example Seed Roles

### 7.1 Frontend Developer (`frontend-developer`)
- **Required**: HTML (advanced), CSS (advanced), JavaScript (advanced), React (intermediate), Git (intermediate)
- **Preferred**: TypeScript (intermediate), Next.js (beginner), Tailwind CSS (intermediate), Redux (intermediate)
- **Common Technologies**: HTML5, CSS3, JavaScript, React, TypeScript, Tailwind CSS, Vite

### 7.2 Data Analyst (`data-analyst`)
- **Required**: SQL (advanced), Excel (advanced), Python (intermediate), Data Visualization (intermediate), Statistics (intermediate)
- **Preferred**: Power BI (intermediate), Tableau (intermediate), Pandas (intermediate)
- **Common Technologies**: SQL, Python, Pandas, Excel, Power BI, Tableau

### 7.3 DevOps Engineer (`devops-engineer`)
- **Required**: Linux (advanced), Docker (advanced), CI/CD (advanced), Git (advanced), AWS (intermediate)
- **Preferred**: Kubernetes (intermediate), Python (intermediate), System Design (intermediate)
- **Common Technologies**: Docker, Kubernetes, GitHub Actions, Linux, AWS, Bash, Git
