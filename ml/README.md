# SmartExam AI — Machine Learning & Anomaly Detection Pipeline

## Methodology

SmartExam AI implements a **multivariate behavioral biometric anomaly detection** architecture coupled with a **deterministic, explainable risk scoring engine**.

### 1. Feature Vector
The system extracts 14 non-invasive interaction signals:
- `typing_speed` (WPM)
- `typing_variance` (keystroke interval variance in ms)
- `average_answer_time` (seconds per question)
- `answer_time_variance`
- `focus_loss_count` (frequency of window blur / tab departures)
- `focus_loss_duration` (cumulative seconds outside active exam window)
- `copy_count` & `paste_count` (clipboard manipulation metadata)
- `mouse_activity_score` (interaction density index 0-100)
- `mouse_idle_time` (seconds without cursor movement)
- `question_navigation_count` (total switches)
- `back_navigation_count` (reverse sequence jumps)
- `session_duration` (seconds)

### 2. Model: Isolation Forest
Isolation Forest partitions instances by recursively isolating observations. In exam sessions, normal interaction dynamics cluster tightly around predictable reading cadence and focus stability; anomalies exhibit significantly shorter tree isolation depths.

### 3. Transparent Explainability
Scores are normalized to `0–100` and categorized as:
- **0–29**: NORMAL (green)
- **30–54**: LOW CONCERN (blue)
- **55–74**: REVIEW (amber)
- **75–100**: HIGH ANOMALY (red)

Every flagged session provides exact factor points and comparison against baseline distributions.
