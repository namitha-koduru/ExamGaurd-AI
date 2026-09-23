# SmartExam AI — Privacy Model & Data Minimization Charter

## Core Philosophy: "Detect Behavior, Not The Person"

Conventional remote proctoring relies on intrusive surveillance mechanisms: continuous webcam recordings, algorithmic facial recognition, emotional tracking, room panning, and ambient microphone listening. These mechanisms introduce severe demographic bias, violate personal privacy, cause intense student anxiety, and collect disproportionate personal data.

**SmartExam AI rejects invasive surveillance.**

Instead, the platform evaluates purely non-invasive behavioral telemetry and interaction mechanics within the exam interface.

---

## 1. What We Collect

| Signal | Purpose | Storage Format |
|---|---|---|
| **Tab Focus / Window State** | Detect when student leaves exam browser tab | Event count & duration in milliseconds |
| **Clipboard Interaction** | Detect copy/paste attempts | Event timestamp & char count only (**No clipboard text stored**) |
| **Keystroke Dynamics** | Pacing and typing rhythm | Aggregated WPM & interval variance (**No key content stored**) |
| **Mouse Interaction** | Movement density and pauses | Movement score (0-100) & idle duration (**No raw coordinates**) |
| **Question Navigation** | Reading sequence and review pattern | Question index transitions & elapsed time |

---

## 2. What We Explicitly DO NOT Collect

- ❌ **No continuous webcam footage**
- ❌ **No facial recognition or identity scanning**
- ❌ **No gaze tracking or eye movement surveillance**
- ❌ **No microphone recording or acoustic profiling**
- ❌ **No unrelated browsing history or external tabs**
- ❌ **No keystroke content (passwords, sentences, or queries)**
- ❌ **No background operating system files or process scraping**

---

## 3. Data Minimization & Retention

1. **Immediate In-Memory Aggregation**: Raw cursor positions and key events are aggregated within the client/extension buffer into statistical indices (`mouse_activity_score`, `typing_variance`) before transmission.
2. **Configurable Retention Policy**:
   - Examination session features and anomaly reports are retained for the institutional grade verification window (configurable default: 30 days).
   - High-granularity event timelines are automatically purged or anonymized after examiner review sign-off.
3. **Student Transparency**:
   - Students are informed before beginning the exam of all active telemetry sensors.
   - Live indicators show extension connection status and non-invasive mode confirmation.

---

## 4. Human-in-the-Loop Principle

The AI system is strictly an **anomaly detector**, never a judge.
- It produces signals: `"Potential behavioral anomaly detected"` or `"Review recommended"`.
- It **never declares "Student cheated"**.
- Final decisions require contextual evaluation by authorized institutional academic examiners.
