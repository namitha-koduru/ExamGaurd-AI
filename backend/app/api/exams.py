from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ..core.database import get_db
from ..models.models import Exam, Question, User, UserRole
from ..schemas.schemas import ExamCreate, ExamResponse, QuestionStudentResponse, QuestionAdminResponse
from .auth import get_current_user

router = APIRouter(prefix="/exams", tags=["Exams"])

@router.get("", response_model=List[ExamResponse])
def get_all_exams(db: Session = Depends(get_db)):
    exams = db.query(Exam).all()
    results = []
    for e in exams:
        res = ExamResponse(
            id=e.id,
            title=e.title,
            description=e.description,
            duration=e.duration,
            status=e.status,
            created_by=e.created_by,
            total_questions=len(e.questions),
            created_at=e.created_at
        )
        results.append(res)
    return results

@router.post("", response_model=ExamResponse, status_code=status.HTTP_201_CREATED)
def create_exam(
    exam_in: ExamCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role not in [UserRole.EXAMINER, UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Examiner authorization required")

    exam = Exam(
        title=exam_in.title,
        description=exam_in.description,
        duration=exam_in.duration,
        status=exam_in.status,
        created_by=current_user.name
    )
    db.add(exam)
    db.flush()

    if exam_in.questions:
        for idx, q_data in enumerate(exam_in.questions):
            q = Question(
                exam_id=exam.id,
                question_text=q_data.question_text,
                question_type=q_data.question_type,
                options=q_data.options,
                correct_answer=q_data.correct_answer,
                marks=q_data.marks,
                order_index=idx
            )
            db.add(q)

    db.commit()
    db.refresh(exam)
    return ExamResponse(
        id=exam.id,
        title=exam.title,
        description=exam.description,
        duration=exam.duration,
        status=exam.status,
        created_by=exam.created_by,
        total_questions=len(exam.questions),
        created_at=exam.created_at
    )

@router.get("/{id}")
def get_exam(
    id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    exam = db.query(Exam).filter(Exam.id == id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")

    is_examiner = current_user.role in [UserRole.EXAMINER, UserRole.ADMIN]

    if is_examiner:
        questions = [QuestionAdminResponse.from_orm(q) for q in exam.questions]
    else:
        # Strip correct answers for students
        questions = [QuestionStudentResponse.from_orm(q) for q in exam.questions]

    return {
        "exam": exam,
        "questions": questions
    }
