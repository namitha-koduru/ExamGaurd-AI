import unittest
import sys
import os

# Ensure backend package can be imported
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from backend.app.services.risk_engine import compute_risk_score

class TestRiskEngine(unittest.TestCase):
    def test_normal_baseline_session(self):
        features = {
            "typing_speed": 42.0,
            "average_answer_time": 65.0,
            "focus_loss_count": 0,
            "focus_loss_duration": 0.0,
            "copy_count": 0,
            "paste_count": 0,
            "mouse_activity_score": 50.0,
            "back_navigation_count": 1,
        }
        report = compute_risk_score(features)
        self.assertEqual(report["risk_level"], "NORMAL")
        self.assertLess(report["risk_score"], 30)
        self.assertTrue(len(report["detected_patterns"]) > 0 or len(report["contributing_factors"]) == 0)

    def test_anomalous_clipboard_and_focus(self):
        features = {
            "typing_speed": 18.0,
            "average_answer_time": 12.0,
            "focus_loss_count": 8,
            "focus_loss_duration": 85.0,
            "copy_count": 4,
            "paste_count": 5,
            "mouse_activity_score": 10.0,
            "back_navigation_count": 14,
        }
        report = compute_risk_score(features)
        self.assertGreaterEqual(report["risk_score"], 55)
        self.assertIn(report["risk_level"], ["REVIEW", "HIGH_ANOMALY"])
        self.assertIn("review recommended", report["recommendation"].lower())

if __name__ == "__main__":
    unittest.main()
