"""
SmartExam AI - Standalone Inference Service
"""

import sys
from typing import Dict, Any

def score_session_biometrics(features: Dict[str, float]) -> Dict[str, Any]:
    from backend.app.services.risk_engine import compute_risk_score
    return compute_risk_score(features)

if __name__ == "__main__":
    test_sample = {
        "typing_speed": 44.0,
        "average_answer_time": 58.0,
        "focus_loss_count": 0,
        "focus_loss_duration": 0.0,
        "copy_count": 0,
        "paste_count": 0,
        "mouse_activity_score": 52.0,
        "back_navigation_count": 1
    }
    print(score_session_biometrics(test_sample))
