# ExamGuard AI — API Specification
**Base URL**: `/api`

All authenticated endpoints require an `Authorization: Bearer <JWT_TOKEN>` header unless specified otherwise.

---

## 1. Authentication Endpoints

### `POST /api/auth/register`
Creates a new student or examiner account.
- **Body**: `{ name: string, email: string, password: string, role?: "STUDENT" | "EXAMINER" }`
- **Response**: `{ user: User, token: string }`

### `POST /api/auth/login`
Authenticates user credentials and issues a JWT token.
- **Body**: `{ email: string, password: string }`
- **Response**: `{ user: User, token: string }`

### `GET /api/auth/me`
Returns profile data for the authenticated session.
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `{ user: User }`

---

## 2. Examination Endpoints

### `GET /api/exams`
Lists active examinations available for candidates and examiners.
- **Response**: `Exam[]`

### `GET /api/exams/:id`
Retrieves exam specifications and questions.
- **Note**: If requested by a student, correct answers and hidden test case expected outputs are sanitized and omitted.
- **Response**: `{ exam: Exam, questions: Question[] }`

### `POST /api/exams`
Publishes a new examination (Requires `EXAMINER` or `ADMIN` role).
- **Body**: `{ title, courseCode, description, durationMinutes, questions, settings }`
- **Response**: `{ exam: Exam, questions: Question[] }`

### `DELETE /api/exams/:id`
Deletes an exam and its associated question bank (Requires `EXAMINER` role).

---

## 3. Examination Session & Autosave

### `POST /api/exams/:id/start`
Starts a student examination session and initializes the authoritative timer.
- **Response**: `{ session: ExamSession, handshakeToken: string }`

### `PUT /api/sessions/:id/answers`
Autosaves answers for MCQ, Coding, or Descriptive questions.
- **Body**: `{ answers: Record<string, any>, progress?: number }`
- **Response**: `{ message: string, progress: number }`

### `POST /api/sessions/:id/submit`
Finalizes an examination, executes final anomaly analysis, and archives the session.
- **Body**: `{ answers?: Record<string, any> }`
- **Response**: `{ session: ExamSession, anomalyReport: AnomalyReport }`

### `GET /api/sessions`
Lists examinee sessions with filtering (Requires `EXAMINER` role).
- **Query Params**: `riskLevel`, `status`, `examId`, `search`
- **Response**: `ExamSession[]`

### `GET /api/sessions/:id`
Retrieves forensic session details, behavioral baseline comparisons, and attribution breakdown.
- **Response**: `{ session: ExamSession, anomalyReport: AnomalyReport, featureComparison: BaselineFeatureComparison[] }`

### `GET /api/sessions/:id/timeline`
Returns raw interaction and telemetry event logs for the session.
- **Response**: `BehaviorEvent[]`

### `PUT /api/sessions/:id/review`
Updates human examiner evaluation notes and status (`UNREVIEWED`, `REVIEWED`, `FLAGGED`).
- **Body**: `{ proctorStatus: string, proctorNotes: string }`

---

## 4. Behavioral Telemetry & Ingestion

### `POST /api/behavior/events`
Batch telemetry ingestion endpoint called periodically by the browser extension and web application.
- **Body**:
  ```json
  {
    "sessionId": "sess-...",
    "events": [
      {
        "eventType": "TAB_FOCUS_LOST",
        "timestamp": 1740000000000,
        "metadata": { "durationMs": 4200 }
      }
    ]
  }
  ```
- **Response**: `{ success: true, processedEvents: number, currentRiskScore: number, currentRiskLevel: string }`

---

## 5. Coding Execution Sandbox

### `POST /api/coding/run`
Executes code inside the isolated VM sandbox against public and hidden test cases.
- **Body**: `{ code: string, language: string, questionId: string, sessionId?: string }`
- **Response**:
  ```json
  {
    "status": "PASSED" | "FAILED" | "COMPILE_ERROR" | "TIMEOUT",
    "passedTests": 2,
    "totalTests": 2,
    "executionTimeMs": 18,
    "compilerOutput": "...",
    "testResults": [...]
  }
  ```

### `POST /api/coding/submit`
Submits and records a student's final code implementation for a question.

---

## 6. Real-Time & Analytics

### `GET /api/proctor/stream`
Server-Sent Events (SSE) stream for live proctor alerts, risk updates, and submissions.

### `GET /api/analytics/overview`
Aggregated cohort statistics, risk distribution, focus duration histogram, and top anomaly patterns.

### `GET /api/audit-logs`
Institutional audit log of examiner actions.

### `GET /api/health` & `GET /api/health/db`
Health and connection diagnostic endpoints.
