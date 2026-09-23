# SmartExam AI — ED-02: AI-Based Exam Malpractice Detection

> **A privacy-preserving AI-powered online examination and behavioral anomaly detection platform that identifies potentially suspicious examination behavior using behavioral biometrics and non-invasive interaction analysis, without relying on continuous webcam surveillance, facial recognition, microphone recording, or invasive monitoring.**

---

## 1. Core Principle: "Detect Behavior, Not The Person"

Conventional remote proctoring relies on intrusive surveillance mechanisms: continuous webcam recordings, algorithmic facial recognition, room panning, and ambient microphone listening. These mechanisms introduce severe demographic bias, violate personal privacy, and cause intense student anxiety.

**SmartExam AI fundamentally rejects invasive surveillance.**

The system evaluates measurable examination interaction dynamics:
- Window focus changes & tab-switching frequency
- Interaction latency & answer timing cadence
- Typing rhythm dynamics (WPM & interval variance) without storing keystroke content
- Non-invasive clipboard copy/paste attempt interception
- Cursor movement intensity and prolonged idle periods
- Non-linear question navigation anomalies

### Important Decision-Support Principle:
The AI identifies **behavioral anomalies**, but never declares a student guilty.
- **Allowed Output**: `"Potential behavioral anomaly detected"` or `"Review recommended"`
- **Prohibited Output**: `"Student cheated"`

---

## 2. System Architecture

```text
                    SMARTEXAM AI
                         |
          +--------------+--------------+
          |                             |
       STUDENT                       EXAMINER
          |                             |
          v                             v
   React Exam UI                Proctor Dashboard
          |                             ^
          v                             |
 Chrome Extension (MV3)                 | SSE Real-Time Stream
          |                             | Live Telemetry Feed
          | Aggregated Event Bursts     |
          v                             |
  Express / FastAPI Backend ------------+
          |
     +----+-----+----------------+
     |          |                |
     v          v                v
 Database    ML Engine      Risk Engine
 (Postgres/  (Isolation     (Explainable
  SQLite)     Forest)        Attribution)
```

---

## 3. Project Structure

```text
smartexam-ai/
├── src/                        # Full-stack React 19 Frontend + Express Integration
│   ├── components/common/      # Navbar, Timeline, RiskBadge, ExtensionSimulatorBar
│   ├── context/AuthContext.tsx # Role management (Student / Examiner switcher)
│   ├── data/mockStore.ts       # Authoritative Datastore & Seed Baseline Sessions
│   ├── ml/isolationForest.ts   # ML Isolation Forest & Deterministic Risk Engine
│   ├── pages/
│   │   ├── student/            # Student Dashboard, Readiness Check, Exam Interface, Result
│   │   ├── examiner/           # Proctor Dashboard, Forensic Detail, Analytics, Create Exam
│   │   ├── PrivacyPage.tsx     # Institutional Privacy Charter
│   │   └── ExtensionHub.tsx    # Chrome Extension Manifest V3 Guide
│   └── types/index.ts          # Domain Type Definitions
├── backend/                    # Python FastAPI Production Service
│   ├── app/
│   │   ├── api/                # Auth, Exams, Sessions, Behavior Telemetry, Analytics
│   │   ├── core/               # Database, Security, Config
│   │   ├── models/             # SQLAlchemy ORM Models
│   │   ├── schemas/            # Pydantic Schemas
│   │   └── services/           # ML Service & Explainable Risk Engine
│   ├── tests/                  # Test suite
│   ├── Dockerfile
│   └── requirements.txt
├── ml/                         # Machine Learning Pipeline
│   ├── data/                   # Synthetic Biometric Generator (Fixed seed = 42)
│   ├── src/                    # Train, Evaluation, Inference
│   ├── models/                 # Baseline model weights JSON
│   └── README.md
├── extension/                  # Chrome Extension (Manifest V3)
│   ├── manifest.json           # MV3 compliant manifest
│   ├── src/background/         # Service worker
│   ├── src/content/            # Exam monitor content script
│   ├── src/popup/              # Extension popup status UI
│   └── README.md
├── docs/                       # Comprehensive Documentation
│   ├── architecture.md
│   ├── api.md
│   ├── ml-methodology.md
│   ├── privacy.md
│   ├── deployment.md
│   └── development.md
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## 4. Non-Invasive Biometrics vs Invasive Surveillance

| Dimension | Conventional Remote Proctoring | SmartExam AI |
|---|---|---|
| **Webcam Surveillance** | Continuous video recording of home room | **Zero webcam access** |
| **Microphone Monitoring** | Ambient acoustic recording | **Zero microphone access** |
| **Facial Recognition** | Biometric scan & emotion classification | **None** |
| **Keystroke Logging** | Logs every typed character | **Rhythm and WPM only (Zero text stored)** |
| **Clipboard Inspection** | May inspect clipboard contents | **Metadata only (event count & char length)** |
| **Malpractice Conclusion** | Automated disqualification | **Anomaly signal for human examiner review** |

---

## 5. Quickstart & Local Execution

### Unified Server (Node.js / Express + Vite SPA)
```bash
# 1. Install dependencies
npm install

# 2. Start Fullstack Development Server (Port 3000)
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Python FastAPI Backend (Optional Alternative Run)
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Docker Compose
```bash
docker-compose up --build
```

---

## 6. Pre-Seeded Demonstration Accounts

| Role | Name | Email | Password |
|---|---|---|---|
| **Student** | Alex Rivera | `alex.student@smartexam.edu` | `password123` |
| **Examiner** | Dr. Elena Vance | `elena.examiner@smartexam.edu` | `password123` |
| **Admin** | System Administrator | `admin@smartexam.edu` | `password123` |

*Tip: You can use the quick role switcher in the top banner of the application to instantly test student taking vs examiner proctoring!*

---

## 7. Chrome Extension Installation (Manifest V3)

1. Open Google Chrome and navigate to `chrome://extensions/`.
2. Toggle on **Developer mode** in the upper-right corner.
3. Click **Load unpacked** and choose the `extension/` directory.
4. When you open the exam interface on `localhost:3000`, the telemetry sensor attaches automatically!
