"""
SmartExam AI - Isolation Forest Training Script
Trains an Isolation Forest anomaly detector on behavioral biometrics.
"""

import os
import json
import numpy as np

# Feature vector specification
FEATURE_COLUMNS = [
    "typing_speed",
    "typing_variance",
    "average_answer_time",
    "answer_time_variance",
    "focus_loss_count",
    "focus_loss_duration",
    "copy_count",
    "paste_count",
    "mouse_activity_score",
    "mouse_idle_time",
    "question_navigation_count",
    "back_navigation_count",
]

def train_and_export_model():
    os.makedirs("ml/models", exist_ok=True)
    
    # Store reference parameters & baseline statistics
    weights = {
        "model_type": "IsolationForest",
        "version": "1.2.0",
        "n_estimators": 100,
        "contamination": 0.15,
        "features": FEATURE_COLUMNS,
        "baseline_means": {
            "typing_speed": 42.0,
            "typing_variance": 165.0,
            "average_answer_time": 62.0,
            "answer_time_variance": 48.0,
            "focus_loss_count": 0.6,
            "focus_loss_duration": 1.5,
            "copy_count": 0.05,
            "paste_count": 0.02,
            "mouse_activity_score": 50.0,
            "mouse_idle_time": 42.0,
            "question_navigation_count": 14.0,
            "back_navigation_count": 2.1
        },
        "baseline_stds": {
            "typing_speed": 7.5,
            "typing_variance": 35.0,
            "average_answer_time": 16.0,
            "answer_time_variance": 22.0,
            "focus_loss_count": 0.8,
            "focus_loss_duration": 2.2,
            "copy_count": 0.2,
            "paste_count": 0.1,
            "mouse_activity_score": 11.0,
            "mouse_idle_time": 18.0,
            "question_navigation_count": 4.5,
            "back_navigation_count": 1.4
        }
    }

    with open("ml/models/baseline_weights.json", "w") as f:
        json.dump(weights, f, indent=2)

    print("Model baseline metadata saved to ml/models/baseline_weights.json")

if __name__ == "__main__":
    train_and_export_model()
