from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from datetime import datetime, timezone, timedelta
from jose import JWTError
from app.auth_def import decode_token
from app.database import get_db
from app.models import Submission
from app.simple_ai_model import SimpleAIModel
from app.schemas import AnswerIn

router = APIRouter(prefix="/answers", tags=["answers"])
bearer = HTTPBearer()
model = SimpleAIModel()

@router.post("/submit")
def submit(answer: AnswerIn, creds: HTTPAuthorizationCredentials = Depends(bearer), db: Session = Depends(get_db)):
    try:
        user_id = int(decode_token(creds.credentials).get("sub"))
    except JWTError:
        raise HTTPException(status_code=401, detail="Geçersiz token.")
    
    # Eğer soru boş bırakıldıysa (is_skipped=True), AI modelini güncelleme
    if not answer.is_skipped and answer.selected and answer.is_correct is not None:
        X = {
            "ders_id": answer.ders_id,
            "konu_id": answer.konu_id,
            "altbaslik_id": answer.altbaslik_id,
            "zorluk": answer.zorluk,
            "user_id": user_id
        }
        model.update(X, answer.is_correct)
    
    # Veritabanına kaydet
    sub = Submission(
        user_id=user_id,
        question_id=answer.soru_id,
        selected=answer.selected,
        is_correct=answer.is_correct,
        is_skipped=answer.is_skipped,
        answered_at=datetime.now(timezone(timedelta(hours=3)))  # Türkiye saati (UTC+3)
    )
    db.add(sub)
    db.commit()
    
    return {"message": "OK"}
