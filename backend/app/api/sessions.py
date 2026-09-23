from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from typing import List, Optional
from ..core.database import get_db
from ..models.models import ExamSession, Exam, User, UserRole, AnomalyReport, BehavioralFeatures
from ..schemas.schemas import ExamSessionResponse, QuestionStudentResponse
from ..services.risk_engine import compute_risk_score
from .auth import get_current_user

router = APIRouter(prefix="", tags=["Sessions"])

@router.post("/exams/{exam_id}/start")
def start_exam_session(
    exam_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")

    # Check for existing active session
    existing = db.query(ExamSession).filter(
        ExamSession.exam_id == exam_id,
        ExamSession.student_id == current_user.id,
        ExamSession.status == "ACTIVE"
    ).first()

    if existing:
        questions = [QuestionStudentResponse.from_orm(q) for q in exam.questions]
        return {"session": existing, "exam": exam, "questions": questions}

    new_session = ExamSession(
        exam_id=exam.id,
        student_id=current_user.id,
        started_at=datetime.now(timezone.utc),
        status="ACTIVE",
        answers={}
    )
    db.add(new_session)
    db.commit()
    db.refresh(new_session)

    questions = [QuestionStudentResponse.from_orm(q) for q in exam.questions]
    return {"session": new_session, "exam": exam, "questions": questions}

@router.post("/sessions/{session_id}/answers")
def autosave_answers(
    session_id: str,
    payload: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    session = db.query(ExamSession).filter(ExamSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.student_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")

    answers = payload.get("answers", {})
    session.answers = {**(session.answers or {}), **answers}
    db.commit()
    return {"success": True, "saved_count": len(session.answers)}

@router.post("/sessions/{session_id}/submit")
def submit_exam_session(
    session_id: str,
    payload: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    session = db.query(ExamSession).filter(ExamSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.student_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")

    answers = payload.get("answers", {})
    if answers:
        session.answers = {**(session.answers or {}), **answers}

    session.submitted_at = datetime.now(timezone.utc)
    session.status = "SUBMITTED"

    # Compute risk score from features if available
    features_dict = {}
    if session.features:
        f = session.features
        features_dict = {
            "typing_speed": f.typing_speed,
            "average_answer_time": f.average_answer_time,
            "focus_loss_count": f.focus_loss_count,
            "focus_loss_duration": f.focus_loss_duration,
            "copy_count": f.copy_count,
            "paste_count": f.paste_count,
            "mouse_activity_score": f.mouse_activity_score,
            "back_navigation_count": f.back_navigation_count
        }

    report = compute_risk_score(features_dict)
    session.risk_score = report["risk_score"]
    session.risk_level = report["risk_level"]

    db_report = AnomalyReport(
        session_id=session.id,
        anomaly_score=report["anomaly_score"],
        risk_score=report["risk_score"],
        risk_level=report["risk_level"],
        detected_patterns=report["detected_patterns"],
        explanation=report["explanation"]
    )
    db.add(db_report)
    db.commit()

    return {"session": session, "report": report}

@router.get("/sessions")
def list_sessions(
    exam_id: Optional[str] = None,
    risk_level: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role not in [UserRole.EXAMINER, UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Examiner privilege required")

    query = db.query(ExamSession)
    if exam_id:
        query = query.filter(ExamSession.exam_id == exam_id)
    if risk_level and risk_level != "ALL":
        query = query.filter(ExamSession.risk_level == risk_level)

    return query.order_by(ExamSession.started_at.desc()).all()

@router.get("/sessions/{session_id}")
def get_session(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    session = db.query(ExamSession).filter(ExamSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session
