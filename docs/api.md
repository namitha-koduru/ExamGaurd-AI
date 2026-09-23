# SmartExam AI — API Specification

## Base URL
`/api`

## Authentication
Bearer token authentication using JWT. Pass `Authorization: Bearer <token>` in request headers.

---

## Endpoints

### 1. Authentication
- `POST /api/auth/register` — Register a student or examiner account
- `POST /api/auth/login` — Authenticate and receive JWT token
- `GET /api/auth/me` — Retrieve active authenticated user profile

### 2. Examinations
- `GET /api/exams` — List all examinations
- `POST /api/exams` — Create a new exam with questions (Examiner only)
- `GET /api/exams/:id` — Retrieve exam details and questions (sanitized for students)
- `DELETE /api/exams/:id` — Delete an exam

### 3. Exam Sessions
- `POST /api/exams/:id/start` — Commence secure exam session
- `POST /api/sessions/:id/answers` — Autosave answers and update progress
- `POST /api/sessions/:id/submit` — Final submission and triggers final ML evaluation
- `GET /api/sessions` — List student sessions with optional filtering by exam or risk level
- `GET /api/sessions/:id` — Detailed session breakdown including baseline comparison
- `GET /api/sessions/:id/timeline` — High-resolution behavioral event timeline
- `PATCH /api/sessions/:id/review` — Update proctor notes and status

### 4. Behavioral Telemetry
- `POST /api/behavior/events` — Ingest behavioral event batches from extension or web app

### 5. Examiner Analytics & Live Feed
- `GET /api/analytics/overview` — High-level proctor overview metrics and risk distributions
- `GET /api/audit-logs` — Administrative audit logs
- `GET /api/proctor/stream` — Real-time Server-Sent Events stream for live session monitoring
