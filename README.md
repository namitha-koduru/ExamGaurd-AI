# ExamGuard AI — Institutional Examination Platform

> **ExamGuard AI is an institutional examination platform that enables educational organizations to create, schedule, conduct, evaluate, and monitor secure online examinations with privacy-conscious behavioral intelligence.**

---

## 1. Core Principle: "Detect Behavior, Not The Person"

Conventional remote proctoring relies on intrusive surveillance mechanisms: continuous webcam recordings, algorithmic facial recognition, room panning, and ambient microphone listening. These mechanisms introduce severe demographic bias, violate personal privacy, and cause intense student anxiety.

**ExamGuard AI fundamentally rejects invasive surveillance.**

The system evaluates measurable examination interaction dynamics through privacy-filtered in-browser telemetry:
- Window focus changes & tab-switching frequency
- Interaction latency & answer timing cadence
- Typing rhythm dynamics (WPM & interval variance) without storing raw keystroke content
- Aggregate clipboard copy/paste character counts without storing raw clipboard text
- Mouse movement intensity and prolonged idle periods
- Non-linear question navigation anomalies
- Coding IDE interactions: compilation failure frequency, burst paste detections, and run cadence

### Assistive Review Principle
The AI identifies **behavioral anomalies** and provides an **EXAMINER REVIEW SIGNAL**, but never automates disciplinary decisions.
- **Accepted Terminology**: `"Behavioral anomaly detected"`, `"Review recommended"`, `"Unusual interaction pattern"`, `"Elevated behavioral risk"`, `"Behavioral risk score"`
- **Prohibited Terminology**: `"Cheating detected"`, `"Student cheated"`, `"Malpractice proven"`

---

## 2. Multi-Tenant Architecture

```text
                                EXAMGUARD AI
                                     |
                +--------------------+--------------------+
                |                                         |
     ACCREDITED INSTITUTIONS                     ISOLATED TENANTS
                |                                         |
  [University / College / School]               [Institution-Scoped Data]
                |                                         |
                +--------------------+--------------------+
                                     |
               +---------------------+---------------------+
               |                                           |
            STUDENT                                     FACULTY
               |                                           |
               v                                           v
     Student Exam Portal                         Examiner Command Center
               |                                           ^
               v                                           |
      In-Browser Telemetry                                 | Real-Time SSE
      (No Chrome Extension)                                | Stream (/api/proctor/stream)
               |                                           |
               v                                           |
        Privacy Filter                                     |
   (Strips raw text/keys)                                  |
               |                                           |
               +---------------------+---------------------+
                                     |
                                     v
                        MongoDB Multi-Tenant Store
                                     |
               +---------------------+---------------------+
               |                                           |
               v                                           v
       Baseline Biometrics                      Isolation Forest ML
               |                                           |
               +---------------------+---------------------+
                                     |
                                     v
                        Deterministic Risk Engine
                                     |
                                     v
                           Explainability Engine
```

---

## 3. Examination Attempt Lifecycle

1. **Examiner Creation**:
   - Create multi-format questions: MCQs, Coding problems with masked test cases, Descriptive essays.
   - Schedule availability window (start date/time to deadline).
   - Set individual examinee duration in minutes.
   - Generate secure examination access code (e.g. `A7K9-XP2`).
   - Publish to institutional tenant.

2. **Student Examination**:
   - Authenticate under accredited institution.
   - Enter instructor's access code.
   - Strict single-attempt verification at database level.
   - In-browser telemetry collection activates only upon exam start and stops immediately upon submission.
   - Sandboxed code execution with masked hidden test cases.
   - Continuous autosave and countdown timers.

3. **Live Examiner Monitoring**:
   - Real-time Server-Sent Events stream (`/api/proctor/stream`).
   - Multivariate behavioral risk score (0-100) and risk levels (`NORMAL`, `LOW_CONCERN`, `REVIEW`, `HIGH_ANOMALY`).
   - Transparent feature comparison against population baselines.
