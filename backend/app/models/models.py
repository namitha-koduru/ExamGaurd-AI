import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column,
    String,
    Integer,
    Float,
    DateTime,
    ForeignKey,
    JSON,
    Text,
    Enum,
)
from sqlalchemy.orm import relationship
from ..core.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class UserRole(str):
    STUDENT = "STUDENT"
    EXAMINER = "EXAMINER"
    ADMIN = "ADMIN"

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String(120), nullable=False)
    email = Column(String(120), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), default=UserRole.STUDENT, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    sessions = relationship("ExamSession", back_populates="student")

class Exam(Base):
    __tablename__ = "exams"

    id = Column(String, primary_key=True, default=generate_uuid)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    duration = Column(Integer, nullable=False) # minutes
    status = Column(String(20), default="ACTIVE", nullable=False)
    created_by = Column(String(120), nullable=False)
    start_time = Column(DateTime, nullable=True)
    end_time = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    questions = relationship("Question", back_populates="exam", cascade="all, delete-orphan")
    sessions = relationship("ExamSession", back_populates="exam")

class Question(Base):
    __tablename__ = "questions"

    id = Column(String, primary_key=True, default=generate_uuid)
    exam_id = Column(String, ForeignKey("exams.id"), nullable=False)
    question_text = Column(Text, nullable=False)
    question_type = Column(String(30), default="MULTIPLE_CHOICE")
    options = Column(JSON, nullable=False) # list of options
    correct_answer = Column(Integer, nullable=False)
    marks = Column(Integer, default=5)
    order_index = Column(Integer, default=0)

    exam = relationship("Exam", back_populates="questions")

class ExamSession(Base):
    __tablename__ = "exam_sessions"

    id = Column(String, primary_key=True, default=generate_uuid)
    exam_id = Column(String, ForeignKey("exams.id"), nullable=False)
    student_id = Column(String, ForeignKey("users.id"), nullable=False)
    started_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    submitted_at = Column(DateTime, nullable=True)
    status = Column(String(20), default="ACTIVE") # ACTIVE, SUBMITTED, EXPIRED
    risk_score = Column(Integer, default=0)
    risk_level = Column(String(30), default="NORMAL") # NORMAL, LOW_CONCERN, REVIEW, HIGH_ANOMALY
    answers = Column(JSON, default=dict)
    proctor_notes = Column(Text, nullable=True)

    exam = relationship("Exam", back_populates="sessions")
    student = relationship("User", back_populates="sessions")
    events = relationship("BehavioralEvent", back_populates="session", cascade="all, delete-orphan")
    features = relationship("BehavioralFeatures", uselist=False, back_populates="session", cascade="all, delete-orphan")
    anomaly_report = relationship("AnomalyReport", uselist=False, back_populates="session", cascade="all, delete-orphan")

class BehavioralEvent(Base):
    __tablename__ = "behavioral_events"

    id = Column(String, primary_key=True, default=generate_uuid)
    session_id = Column(String, ForeignKey("exam_sessions.id"), nullable=False, index=True)
    event_type = Column(String(50), nullable=False)
    timestamp = Column(Float, nullable=False)
    event_metadata = Column("metadata", JSON, default=dict)

    session = relationship("ExamSession", back_populates="events")

class BehavioralFeatures(Base):
    __tablename__ = "behavioral_features"

    id = Column(String, primary_key=True, default=generate_uuid)
    session_id = Column(String, ForeignKey("exam_sessions.id"), unique=True, nullable=False)
    typing_speed = Column(Float, default=0.0)
    typing_variance = Column(Float, default=0.0)
    average_answer_time = Column(Float, default=0.0)
    answer_time_variance = Column(Float, default=0.0)
    focus_loss_count = Column(Integer, default=0)
    focus_loss_duration = Column(Float, default=0.0)
    copy_count = Column(Integer, default=0)
    paste_count = Column(Integer, default=0)
    mouse_activity_score = Column(Float, default=50.0)
    idle_duration = Column(Float, default=0.0)
    question_navigation_count = Column(Integer, default=0)
    back_navigation_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    session = relationship("ExamSession", back_populates="features")

class AnomalyReport(Base):
    __tablename__ = "anomaly_reports"

    id = Column(String, primary_key=True, default=generate_uuid)
    session_id = Column(String, ForeignKey("exam_sessions.id"), unique=True, nullable=False)
    anomaly_score = Column(Float, default=0.0)
    risk_score = Column(Integer, default=0)
    risk_level = Column(String(30), default="NORMAL")
    detected_patterns = Column(JSON, default=list)
    explanation = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    session = relationship("ExamSession", back_populates="anomaly_report")

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String, primary_key=True, default=generate_uuid)
    actor_id = Column(String, nullable=False)
    actor_name = Column(String(120), nullable=False)
    actor_role = Column(String(30), nullable=False)
    action = Column(String(100), nullable=False)
    target_id = Column(String, nullable=True)
    details = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))
