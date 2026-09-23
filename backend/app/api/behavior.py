from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..core.database import get_db
from ..models.models import BehavioralEvent, BehavioralFeatures, ExamSession
from ..schemas.schemas import BehavioralEventBatch
from ..services.risk_engine import compute_risk_score

router = APIRouter(prefix="/behavior", tags=["Behavioral Telemetry"])

@router.post("/events")
def ingest_events(batch: BehavioralEventBatch, db: Session = Depends(get_db)):
    session = db.query(ExamSession).filter(ExamSession.id == batch.session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    for ev in batch.events:
        db_ev = BehavioralEvent(
            session_id=batch.session_id,
            event_type=ev.event_type,
            timestamp=ev.timestamp,
            event_metadata=ev.metadata
        )
        db.add(db_ev)

    db.commit()
    return {"success": True, "ingested_count": len(batch.events)}
