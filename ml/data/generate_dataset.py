"""
SmartExam AI - Synthetic Behavioral Biometric Dataset Generator
ED-02 - AI-Based Exam Malpractice Detection

NOTICE: This dataset contains synthetic simulation records generated with a fixed random seed
for prototype development, algorithm benchmarking, and feature engineering.
It is explicitly labeled as synthetic prototype data.
"""

import os
import json
import random
import csv

RANDOM_SEED = 42
random.seed(RANDOM_SEED)

def generate_synthetic_sessions(n_samples=500):
    dataset = []

    for i in range(n_samples):
        # 75% normal, 15% mild anomaly, 10% strong anomaly
        scenario_rand = random.random()

        if scenario_rand < 0.75:
            # Normal Session
            label = "NORMAL"
            typing_speed = round(random.gauss(43.0, 6.0), 1)
            typing_variance = round(random.gauss(165.0, 30.0), 1)
            avg_answer_time = round(random.gauss(62.0, 14.0), 1)
            answer_time_variance = round(random.gauss(45.0, 15.0), 1)
            focus_loss_count = random.choices([0, 1, 2], weights=[0.75, 0.20, 0.05])[0]
            focus_loss_duration = round(focus_loss_count * random.uniform(1.0, 3.5), 1)
            copy_count = 0
            paste_count = 0
            mouse_activity_score = round(random.gauss(52.0, 8.0), 1)
            mouse_idle_time = round(random.gauss(40.0, 15.0), 1)
            question_nav_count = random.randint(8, 20)
            back_nav_count = random.randint(0, 4)
            is_anomaly = 0
        elif scenario_rand < 0.90:
            # Mild Anomaly (Review)
            label = "REVIEW"
            typing_speed = round(random.gauss(32.0, 10.0), 1)
            typing_variance = round(random.gauss(240.0, 50.0), 1)
            avg_answer_time = round(random.gauss(28.0, 10.0), 1)
            answer_time_variance = round(random.gauss(95.0, 25.0), 1)
            focus_loss_count = random.randint(3, 6)
            focus_loss_duration = round(random.uniform(25.0, 60.0), 1)
            copy_count = random.choices([0, 1, 2], weights=[0.4, 0.4, 0.2])[0]
            paste_count = random.choices([0, 1, 2], weights=[0.3, 0.5, 0.2])[0]
            mouse_activity_score = round(random.gauss(30.0, 12.0), 1)
            mouse_idle_time = round(random.uniform(60.0, 140.0), 1)
            question_nav_count = random.randint(22, 38)
            back_nav_count = random.randint(6, 12)
            is_anomaly = 1
        else:
            # Strong Anomaly (High Anomaly)
            label = "HIGH_ANOMALY"
            typing_speed = round(random.gauss(20.0, 8.0), 1)
            typing_variance = round(random.gauss(380.0, 80.0), 1)
            avg_answer_time = round(random.uniform(10.0, 18.0), 1) # rapid sub-reading pace
            answer_time_variance = round(random.gauss(180.0, 40.0), 1)
            focus_loss_count = random.randint(7, 18)
            focus_loss_duration = round(random.uniform(70.0, 240.0), 1)
            copy_count = random.randint(2, 8)
            paste_count = random.randint(3, 9)
            mouse_activity_score = round(random.gauss(18.0, 6.0), 1)
            mouse_idle_time = round(random.uniform(120.0, 320.0), 1)
            question_nav_count = random.randint(35, 65)
            back_nav_count = random.randint(12, 28)
            is_anomaly = 1

        record = {
            "session_id": f"syn-sess-{i+1:04d}",
            "typing_speed": max(5.0, typing_speed),
            "typing_variance": max(10.0, typing_variance),
            "average_answer_time": max(5.0, avg_answer_time),
            "answer_time_variance": max(5.0, answer_time_variance),
            "focus_loss_count": focus_loss_count,
            "focus_loss_duration": max(0.0, focus_loss_duration),
            "copy_count": copy_count,
            "paste_count": paste_count,
            "mouse_activity_score": min(100.0, max(0.0, mouse_activity_score)),
            "mouse_idle_time": max(0.0, mouse_idle_time),
            "question_navigation_count": question_nav_count,
            "back_navigation_count": back_nav_count,
            "is_anomaly": is_anomaly,
            "ground_truth_label": label
        }
        dataset.append(record)

    return dataset

def save_dataset():
    os.makedirs("ml/data", exist_ok=True)
    dataset = generate_synthetic_sessions(600)
    
    csv_file = "ml/data/synthetic_behavioral_dataset.csv"
    with open(csv_file, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=list(dataset[0].keys()))
        writer.writeheader()
        writer.writerows(dataset)
        
    json_file = "ml/data/synthetic_behavioral_dataset.json"
    with open(json_file, "w") as f:
        json.dump(dataset, f, indent=2)

    print(f"Generated {len(dataset)} synthetic session records in {csv_file}")

if __name__ == "__main__":
    save_dataset()
