from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from backend.app.auth_def import decode_token
from backend.app.ml_model import PracticeModel
from pydantic import BaseModel

router = APIRouter(prefix="/answers", tags=["answers"])
bearer_scheme = HTTPBearer()
model = PracticeModel()


class SubmitAnswerIn(BaseModel):
    ders_id: int
    konu_id: int
    zorluk: int
    is_correct: int

class PredictIn(BaseModel):
    ders_id: int
    konu_id: int
    zorluk: int


@router.post("/submit")
def submit_answer(
    answer: SubmitAnswerIn,
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
):
    # token’dan user_id falan gerekiyorsa:
    payload = decode_token(credentials.credentials)

    X = {
        "ders_id": answer.ders_id,
        "konu_id": answer.konu_id,
        "zorluk": answer.zorluk
    }
    y = answer.is_correct

    model.update(X, y)
    return {"message": "Cevap işlendi, model güncellendi."}


@router.post("/predict")
def predict_next(
    req: PredictIn,
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
):
    payload = decode_token(credentials.credentials)

    X = {
        "ders_id": req.ders_id,
        "konu_id": req.konu_id,
        "zorluk": req.zorluk
    }
    proba = model.predict(X)
    return {
        "correct_probability": [
            [proba.get(0, 0), proba.get(1, 0)]
        ]
    }
