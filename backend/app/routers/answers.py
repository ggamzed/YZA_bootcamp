from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.app import models, database
from backend.app.ml_model import PracticeModel
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from backend.app import auth_def  # auth.py token işleri için

router = APIRouter(prefix="/answers", tags=["answers"])

bearer_scheme = HTTPBearer()
model = PracticeModel()

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ✅ Cevabı kaydet ve modeli güncelle
@router.post("/submit")
def submit_answer(
    answer: dict,
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db)
):
    payload = auth_def.decode_token(credentials.credentials)
    user_id = int(payload.get("sub"))

    X = {
        "ders_id": answer["ders_id"],
        "konu_id": answer["konu_id"],
        "zorluk": answer["zorluk"]
    }
    y = answer["is_correct"]

    model.update(X, y)

    return {"message": "Cevap işlendi, model güncellendi."}

@router.post("/predict")
def predict_next(
    request: dict,
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)
):
    X = {
        "ders_id": request["ders_id"],
        "konu_id": request["konu_id"],
        "zorluk": request["zorluk"]
    }

    proba = model.predict(X)  # Doğru method adı!

    return {"correct_probability": [[proba.get(0, 0), proba.get(1, 0)]]}
