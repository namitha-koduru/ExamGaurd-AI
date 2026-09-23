from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field

class UserBase(BaseModel):
    name: str
    email: EmailStr
    role: str = "STUDENT"

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: str
    created_at: datetime
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class QuestionBase(BaseModel):
    question_text: str
    question_type: str = "MULTIPLE_CHOICE"
    options: List[str]
    marks: int = 5
    order_index: int = 0

class QuestionCreate(QuestionBase):
    correct_answer: int

class QuestionStudentResponse(QuestionBase):
    id: str
    exam_id: str
    class Config:
        from_attributes = True

class QuestionAdminResponse(QuestionBase):
    id: str
    exam_id: str
    correct_answer: int
    class Config:
        from_attributes = True

class ExamBase(BaseModel):
    title: str
    description: Optional[str] = None
    duration: int # minutes
    status: str = "ACTIVE"

class ExamCreate(ExamBase):
    questions: Optional[List[QuestionCreate]] = None

class ExamResponse(ExamBase):
    id: str
    created_by: str
    total_questions: int = 0
    created_at: datetime
    class Config:
        from_attributes = True

class BehavioralEventIn(BaseModel):
    event_type: str
    timestamp: float
    metadata: Dict[str, Any] = Field(default_factory=dict)

class BehavioralEventBatch(BaseModel):
    session_id: str
    events: List[BehavioralEventIn]

class BehavioralFeaturesResponse(BaseModel):
    typing_speed: float
    typing_variance: float
    average_answer_time: float
    answer_time_variance: float
    focus_loss_count: int
    focus_loss_duration: float
    copy_count: int
    paste_count: int
    mouse_activity_score: float
    idle_duration: float
    question_navigation_count: int
    back_navigation_count: int

class AnomalyReportResponse(BaseModel):
    anomaly_score: float
    risk_score: int
    risk_level: str
    model_used: str = "Isolation Forest ML v1.2"
    detected_patterns: List[str]
    explanation: str

class ExamSessionResponse(BaseModel):
    id: str
    exam_id: str
    student_id: str
    started_at: datetime
    submitted_at: Optional[datetime] = None
    status: str
    risk_score: int
    risk_level: str
    answers: Dict[str, Any] = Field(default_factory=dict)
    features: Optional[BehavioralFeaturesResponse] = None
    anomaly_report: Optional[AnomalyReportResponse] = None
    proctor_notes: Optional[str] = None
    class Config:
        from_attributes = True
