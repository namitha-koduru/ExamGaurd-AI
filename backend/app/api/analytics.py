from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..core.database import get_db
from ..models.models import ExamSession, Exam, User

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/overview")
def get_analytics_overview(db: Session = Depends(get_db)):
    sessions = db.query(ExamSession).all()
    total_sessions = len(sessions)
    normal = sum(1 for s in sessions if s.risk_level == "NORMAL")
    low_concern = sum(1 for s in sessions if s.risk_level == "LOW_CONCERN")
    review = sum(1 for s in sessions if s.risk_level == "REVIEW")
    high_anomaly = sum(1 for s in sessions if s.risk_level == "HIGH_ANOMALY")

    avg_risk = round(sum(s.risk_score for s in sessions) / max(1, total_sessions))

    return {
        "metrics": {
            "total_sessions": total_sessions,
            "normal_sessions": normal,
            "low_concern_sessions": low_concern,
            "review_sessions": review,
            "high_anomaly_sessions": high_anomaly,
            "average_risk": avg_risk
        }
    }
