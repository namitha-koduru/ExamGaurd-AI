# ExamGuard AI — System Architecture
**Challenge**: ED-02 — AI-Based Exam Malpractice Detection  
**Core Thesis**: *Detect Behavior, Not the Person*

---

## 1. Executive Summary

ExamGuard AI is a production-oriented, privacy-preserving digital examination and behavioral anomaly platform. Traditional proctoring tools rely on invasive techniques—such as continuous webcam surveillance, biometric facial recognition, microphone audio scraping, and room inspections—that infringe on candidate privacy, induce psychological stress, and generate biased false positives.

ExamGuard AI replaces physical surveillance with **non-invasive behavioral biometric telemetry** and **unsupervised Isolation Forest anomaly detection**. The platform monitors interaction dynamics (window focus continuity, answering cadence, clipboard usage patterns, typing rhythm, and coding execution flows) to provide human examiners with objective decision-support signals.

---

## 2. Active Technical Stack

The active runtime is unified in a single full-stack TypeScript environment:

```text
┌─────────────────────────────────────────────────────────────┐
│                    Client Surfaces                          │
│  ┌─────────────────────────────┐  ┌───────────────────────┐  │
│  │   Candidate React App       │  │  Examiner Dashboard   │  │
│  │  (Monaco, Fullscreen, Timer)│  │ (Live Feed, Forensics)│  │
│  └──────────────┬──────────────┘  └───────────▲───────────┘  │
│                 │                             │              │
│  ┌──────────────▼──────────────┐              │ SSE Stream   │
│  │  Manifest V3 Chrome Ext     │              │              │
│  │  (Isolated Sensor Sandbox)  │              │              │
│  └──────────────┬──────────────┘              │              │
└─────────────────┼─────────────────────────────┼─────────────┘
                  │ HTTPS REST / Batch Telemetry│
┌─────────────────▼─────────────────────────────┴─────────────┐
│                 Node.js / Express Server                    │
│  ┌──────────────────┐  ┌────────────────┐  ┌──────────────┐ │
│  │   Auth & RBAC    │  │ Code Execution │  │ SSE Realtime │ │
│  │  (JWT + Bcrypt)  │  │  (VM Sandbox)  │  │   Event Hub  │ │
│  └────────┬─────────┘  └────────┬───────┘  └──────▲───────┘ │
│           │                     │                 │         │
│  ┌────────▼─────────────────────▼─────────────────┴───────┐ │
│  │       In-Process Behavioral Risk Engine (ML)           │ │
│  │   - Isolation Forest Anomaly Detection (iForest)       │ │
│  │   - Feature Vectorizer (behavior-v2)                   │ │
│  │   - Z-Score Baseline Comparison                        │ │
│  │   - Explainable Point Attribution                      │ │
│  └──────────────────────────────┬─────────────────────────┘ │
└─────────────────────────────────┼───────────────────────────┘
                                  │ Persistent Documents
┌─────────────────────────────────▼───────────────────────────┐
│                     MongoDB Atlas                           │
│  Collections: users, exams, questions, sessions,            │
│  behavior_events, coding_submissions, audit_logs            │
└─────────────────────────────────────────────────────────────┘
```

### Stack Components:
1. **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Recharts, Monaco Editor.
2. **Backend**: Node.js, Express, TypeScript, JWT auth (`jsonwebtoken`), `bcryptjs`.
3. **Database**: MongoDB Atlas via official `mongodb` driver, with resilient in-memory collection layer for offline development.
4. **Machine Learning Engine**: In-process deterministic TypeScript Isolation Forest with statistical z-score baseline comparisons.
5. **Real-Time Pipeline**: Server-Sent Events (SSE) broadcasting live candidate telemetry and risk alerts to examiners.
6. **Browser Extension**: Manifest V3 compliant telemetry sensor with strict host permissions and cryptographic handshake.

---

## 3. Data Flow & Telemetry Ingestion

1. **Session Handshake**: When an examination starts, the server generates an authoritative session record with an ephemeral `handshakeToken`.
2. **Telemetry Buffering**: The browser client captures non-invasive telemetry events (window focus loss, paste actions, keystroke intervals, mouse move intensity, code runs). Events are queued and flushed in batches every 12 seconds or immediately on critical focus loss.
3. **Feature Vector Extraction**: The server computes a 15-dimensional behavioral biometrics vector (`behavior-v2`).
4. **Multivariate Scoring**: The Isolation Forest model calculates the normalized anomaly probability. A deterministic rule-based explainability layer calculates point attribution.
5. **Live Broadcasting**: Real-time updates are dispatched via SSE to connected examiners.
6. **Human Decision-Support**: Risk indices are classified into four tiers:
   - `NORMAL` (0–29)
   - `LOW_CONCERN` (30–54)
   - `REVIEW` (55–74)
   - `HIGH_ANOMALY` (75–100)

*Note: AI scores never accuse candidates or automatically disqualify them. They serve solely as prioritized forensic review recommendations.*
