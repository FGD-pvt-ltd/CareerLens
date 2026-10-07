# ProfiQ — Database Schema Design

Database: **MongoDB (Mongoose ODM)**  
Target Database Name: `profiq`

## Collections

### 1. `users`
Represents application accounts (students, administrators, placement officers).
- `_id`: ObjectId
- `name`: String
- `email`: String (unique)
- `password`: String (hashed)
- `role`: Enum `['student', 'admin', 'placement_officer']`
- `createdAt`: Date
- `updatedAt`: Date

### 2. `profiles`
Represents student credentials, public links, and raw inputs.
- `_id`: ObjectId
- `userId`: ObjectId (ref: `User`)
- `githubUsername`: String
- `linkedinUrl`: String
- `portfolioUrl`: String
- `resumePath`: String
- `claimedSkills`: Array of `{ name: String, category: String }`
- `createdAt`, `updatedAt`: Date

### 3. `jobroles`
Standardized industry benchmarks for specific technical roles.
- `_id`: ObjectId
- `title`: String
- `category`: String
- `requiredSkills`: Array of `{ skill: String, weight: Number, importance: Enum }`
- `experienceLevel`: Enum `['entry', 'mid', 'senior']`

### 4. `analyses`
Historical evaluation runs, verified evidence scores, and generated roadmaps.
- `_id`: ObjectId
- `userId`: ObjectId (ref: `User`)
- `targetRoleId`: ObjectId (ref: `JobRole`)
- `readinessScore`: Number (0-100)
- `skillScore`: Number (0-100)
- `evidenceScore`: Number (0-100)
- `verifiedSkills`: Array of `{ skill: String, confidence: Number, evidenceSources: [String] }`
- `missingSkills`: Array of Strings
- `roadmap`: Array of `{ step: Number, title: String, description: String, resources: [String] }`
- `createdAt`, `updatedAt`: Date
