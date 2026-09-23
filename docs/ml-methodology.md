# SmartExam AI — Machine Learning Methodology

## 1. Problem Formulation

Traditional remote exam monitoring treats malpractice as an identity verification problem (requiring webcam facial recognition, gaze tracking, and mic listening).

SmartExam AI reframes it as an **unsupervised behavioral anomaly detection** problem.

A student engaged in regular test-taking displays predictable interaction dynamics:
- Continuous focus on the exam window
- Consistent reading and typing cadence
- Zero external clipboard paste injections
- Normal cursor mobility and natural pauses

Deviations from these patterns (e.g., repeatedly switching windows, burst-pasting text, erratic question skipping, prolonged freezes followed by sudden answers) represent behavioral anomalies that require review.

---

## 2. Feature Representation

Each session is mapped into a 14-dimensional feature vector:
1. `typing_speed` (WPM)
2. `typing_variance` (variance in keystroke latency)
3. `average_answer_time` (seconds per question)
4. `answer_time_variance`
5. `focus_loss_count` (frequency of window blur / tab switches)
6. `focus_loss_duration` (total seconds off-window)
7. `copy_count`
8. `paste_count`
9. `mouse_activity_score` (movement intensity 0-100)
10. `mouse_idle_time`
11. `question_navigation_count`
12. `question_revisit_count`
13. `back_navigation_count`
14. `session_duration`

---

## 3. Isolation Forest Ensemble

The Isolation Forest algorithm exploits two quantitative properties of anomalies:
1. They are fewer in number compared to normal sessions.
2. They possess attribute-values that isolate them earlier in random binary recursive trees.

Given sample $x$ and sample size $n$, the anomaly score is computed as:
$$s(x, n) = 2^{-\frac{E(h(x))}{c(n)}}$$
where $E(h(x))$ is the average path length across the tree ensemble, and $c(n)$ is the average path length of unsuccessful searches in a Binary Search Tree:
$$c(n) = 2(\ln(n - 1) + 0.5772156649) - \frac{2(n - 1)}{n}$$

---

## 4. Deterministic Risk Engine & Attribution

To eliminate black-box ambiguity, the model's anomaly probability is combined with explicit rule bounds:
- **Focus loss contribution**: Up to 30 points
- **Clipboard interaction contribution**: Up to 30 points
- **Answer timing cadence deviation**: Up to 18 points
- **Navigation pattern anomaly**: Up to 15 points
- **Isolation Forest multivariate distance**: Up to 25 points

Final risk score: Clamped to `0 – 100`.
Categorization:
- `0–29`: NORMAL
- `30–54`: LOW CONCERN
- `55–74`: REVIEW
- `75–100`: HIGH ANOMALY
