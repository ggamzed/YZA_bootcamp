from fastapi import APIRouter, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from datetime import datetime

from backend.app.auth_def import decode_token
from backend.app.database import get_db
from backend.app.models import Submission
from backend.app.ml_model import PracticeModel
from backend.app.schemas import AnswerIn, PredictIn

router = APIRouter(prefix="/answers", tags=["answers"])
bearer = HTTPBearer()
model = PracticeModel()


@router.post("/submit")
def submit(
    answer: AnswerIn,
    creds: HTTPAuthorizationCredentials = Depends(bearer),
    db: Session = Depends(get_db),
):
    payload = decode_token(creds.credentials)
    user_id = int(payload.get("sub"))


    X = {
        "ders_id": answer.ders_id,
        "konu_id": answer.konu_id,
        "zorluk": answer.zorluk,
        "user_id": user_id,
    }
    model.update(X, answer.is_correct)


    sub = Submission(
        user_id=user_id,
        question_id=answer.soru_id,
        selected=answer.selected,
        is_correct=bool(answer.is_correct),
        answered_at=datetime.utcnow(),
    )
    db.add(sub)
    db.commit()

    return {"message": "OK"}


@router.post("/predict")
def predict(
    req: PredictIn,
    creds: HTTPAuthorizationCredentials = Depends(bearer),
    db: Session = Depends(get_db),
):
    payload = decode_token(creds.credentials)
    user_id = int(payload.get("sub"))


    X = {
        "ders_id": req.ders_id,
        "konu_id": req.konu_id,
        "zorluk": req.zorluk,
        "user_id": user_id,
    }
    p = model.predict(X)


    return {
        "correct_probability": [
            p.get(0, 0) * 100,
            p.get(1, 0) * 100
        ]
    }
