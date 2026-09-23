# ExamGuard AI — Machine Learning Methodology
**Algorithm**: Isolation Forest (iForest) + Explainable Attribution  
**Model Version**: `behavioral-iforest-v2`  
**Feature Schema**: `behavior-v2`  
**Philosophy**: Decision-Support Anomaly Detection, Never Automatic Disciplinary Judgment

---

## 1. Why Isolation Forest?

Traditional supervised learning requires labeled datasets of "cheating" vs "non-cheating" students. In real-world educational institutions:
1. Ground-truth malpractice labels are scarce and noisy.
2. Malpractice techniques evolve continuously.
3. Supervised classifiers overfit to historical patterns and exhibit bias against students with atypical neurodivergent typing rhythms.

**Isolation Forest** is an unsupervised anomaly detection algorithm based on the principle that anomalies are "few and different":
- By constructing an ensemble of isolation trees (iTrees) with random axis-aligned splits, anomalous points are isolated closer to the root of the trees.
- Normal exam sessions with standard answering cadences require much deeper path lengths to isolate.

$$s(x, n) = 2^{-\frac{E(h(x))}{c(n)}}$$

Where:
- $h(x)$ is the path length of observation $x$ in an iTree.
- $E(h(x))$ is the expected path length across the ensemble.
- $c(n)$ is the average path length of unsuccessful searches in a Binary Search Tree of $n$ instances.
- $s \in [0, 1]$ is the normalized anomaly score:
  - $s \to 1$: Strong anomaly
  - $s < 0.5$: Normal observation

---

## 2. Behavioral Feature Vector (`behavior-v2`)

The platform extracts 15 non-invasive behavioral signals:

| Feature Name | Description | Normal Baseline ($\mu \pm \sigma$) |
|:---|:---|:---|
| `tab_switch_count` | Number of times exam tab lost focus | $2.1 \pm 1.8$ switches |
| `focus_loss_duration_seconds` | Total seconds away from active window | $8.4 \pm 7.2$ seconds |
| `copy_event_count` | Copy attempts logged | $0.8 \pm 1.2$ events |
| `paste_event_count` | Paste attempts logged | $0.4 \pm 0.8$ events |
| `key_press_rate_wpm` | Estimated typing speed (strokes/min / 5) | $44.0 \pm 14.5$ WPM |
| `key_interval_variance` | Variance in inter-keystroke intervals (ms) | $420.0 \pm 180.0$ ms |
| `mouse_move_intensity` | Sampled mouse velocity & trajectory density | $42.0 \pm 18.0$ units |
| `answer_duration_variance` | Variance of time spent across questions | $18.0 \pm 12.0$ seconds |
| `idle_time_total_seconds` | Periods exceeding 15s without user input | $35.0 \pm 25.0$ seconds |
| `rapid_response_count` | Questions answered in $< 3$ seconds | $0.2 \pm 0.5$ questions |
| `code_edit_duration` | Active time spent inside code editor | $480.0 \pm 180.0$ seconds |
| `code_paste_count` | Clipboard paste attempts inside code editor | $0.5 \pm 0.9$ events |
| `compile_failure_count` | Number of syntax/build errors encountered | $2.2 \pm 2.0$ errors |
| `code_run_count` | Number of test execution runs triggered | $5.5 \pm 3.2$ runs |
| `large_insertion_count` | Sudden insertions ($> 80$ chars in $< 1.5$s) | $0.1 \pm 0.3$ bursts |

---

## 3. Explainable Risk Attribution

An anomaly score without attribution is frustrating for educators and unfair to students. ExamGuard AI pairs the multivariate iForest score with **deterministic point attribution**:

- **Excessive Window Focus Loss**: If focus loss duration exceeds 45 seconds, attribution assigns $+15$ to $+30$ points depending on deviation.
- **External Paste Ingestion**: If content or code is pasted rather than typed, $+12$ to $+25$ points are attributed.
- **Unusual Keystroke Rhythm**: Extremely low interval variance combined with high WPM indicates automated or non-human text insertion ($+15$ pts).
- **Rapid Answer Bursts**: Answering complex questions in $< 3$ seconds ($+18$ pts).
- **Large Sudden Code Insertions**: Insertion of multi-line blocks into the code editor without incremental keystrokes ($+20$ pts).

Each contributing factor is presented to the examiner with:
1. The observed session value.
2. The expected institutional baseline.
3. The exact point contribution.
4. A plain-language contextual explanation.

---

## 4. Human-in-the-Loop Safeguards

1. **No Automatic Accusations**: The system outputs "Review Recommended" or "Unusual Interaction Pattern", never "Cheater" or "Cheating Detected".
2. **Context Matters**: A temporary focus loss can happen if the operating system displays a system notification or network hiccup. Human examiners review the event timeline before making any academic determination.
3. **Reproducibility**: In-process isolation trees use a deterministic random seed to ensure consistent evaluations.
