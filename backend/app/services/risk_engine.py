from typing import Dict, Any, List
from .ml_service import ml_detector

def compute_risk_score(features: Dict[str, Any]) -> Dict[str, Any]:
    """
    Computes explainable, transparent risk score (0-100) and structured anomaly report.
    Principle: 'Detect behavior, not the person.'
    """
    anomaly_score, model_used = ml_detector.predict_anomaly(features)

    focus_loss_count = features.get("focus_loss_count", 0)
    focus_loss_duration = features.get("focus_loss_duration", 0.0)
    copy_count = features.get("copy_count", 0)
    paste_count = features.get("paste_count", 0)
    avg_answer_time = features.get("average_answer_time", 60.0)
    back_nav_count = features.get("back_navigation_count", 0)
    mouse_score = features.get("mouse_activity_score", 50.0)

    contributing_factors = []
    detected_patterns = []

    # 1. Focus anomaly points (max 30)
    focus_points = 0
    if focus_loss_count > 1 or focus_loss_duration > 4.0:
        excess_count = max(0, focus_loss_count - 1)
        excess_dur = max(0.0, focus_loss_duration - 4.0)
        focus_points = min(30, int(excess_count * 7 + excess_dur * 1.5))
        if focus_points > 5:
            contributing_factors.append(f"Significant focus loss deviation ({focus_loss_count} events, {round(focus_loss_duration)}s away)")
            detected_patterns.append("Unusual exam window focus departures")

    # 2. Clipboard manipulation (max 30)
    clip_points = 0
    if copy_count > 0 or paste_count > 0:
        clip_points = min(30, copy_count * 10 + paste_count * 15)
        contributing_factors.append(f"Clipboard interaction ({copy_count} copies, {paste_count} pastes)")
        detected_patterns.append("Anomalous clipboard activity on question interface")

    # 3. Timing anomaly (max 18)
    timing_points = 0
    if avg_answer_time < 20:
        timing_points = 16
        contributing_factors.append(f"Rapid answer cadence ({round(avg_answer_time)}s avg per question)")
        detected_patterns.append("Sub-reading answer submission cadence")
    elif avg_answer_time > 180:
        timing_points = 8
        contributing_factors.append(f"Extended answer latency ({round(avg_answer_time)}s avg)")

    # 4. Navigation pattern anomaly (max 15)
    nav_points = 0
    if back_nav_count > 7:
        nav_points = min(15, int(back_nav_count * 1.4))
        contributing_factors.append(f"Erratic question switching ({back_nav_count} reverse transitions)")
        detected_patterns.append("Non-linear reverse question jumping")

    # 5. ML model contribution (max 25)
    ml_points = max(0, int((anomaly_score - 0.4) * 35))
    if ml_points > 5:
        contributing_factors.append(f"Multivariate behavioral vector deviation (ML anomaly probability {round(anomaly_score * 100, 1)}%)")

    total_risk = min(100, max(0, focus_points + clip_points + timing_points + nav_points + ml_points))

    # Risk level categorization
    if total_risk >= 75:
        risk_level = "HIGH_ANOMALY"
        recommendation = "High behavioral anomaly detected. Human examiner review recommended. Check timeline logs."
    elif total_risk >= 55:
        risk_level = "REVIEW"
        recommendation = "Moderate behavioral deviation detected. Human review recommended to assess interaction context."
    elif total_risk >= 30:
        risk_level = "LOW_CONCERN"
        recommendation = "Minor interaction deviations observed. Routine human oversight recommended."
    else:
        risk_level = "NORMAL"
        recommendation = "Exam interactions align with expected behavioral baseline. No action required."

    explanation_text = "Risk Factors:\n" + "\n".join(f"• {f}" for f in contributing_factors) if contributing_factors else "Interactions within normal parameters."

    return {
        "anomaly_score": anomaly_score,
        "risk_score": total_risk,
        "risk_level": risk_level,
        "model_used": model_used,
        "detected_patterns": detected_patterns or ["Standard compliant examination pace"],
        "explanation": explanation_text,
        "recommendation": recommendation,
    }
