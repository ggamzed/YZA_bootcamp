from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from random import shuffle
import json
from jose import JWTError
from app.database import get_db
from app.auth_def import decode_token
from app.models import Questions, Submission
from app.simple_ai_model import SimpleAIModel


router = APIRouter(prefix="/questions", tags=["questions"])
bearer = HTTPBearer()
model = SimpleAIModel()

@router.get("/batch")
def get_batch_questions(
    ders_id: int,
    etiket: str = None,
    creds: HTTPAuthorizationCredentials = Depends(bearer),
    db: Session = Depends(get_db)
):
    try:
        user_id = int(decode_token(creds.credentials).get("sub"))
    except JWTError:
        raise HTTPException(status_code=401, detail="Geçersiz token.")
    
    # Kullanıcının daha önce çözdüğü soruları al
    answered_questions = db.query(Submission.question_id).filter(
        Submission.user_id == user_id
    ).subquery()
    
    # Performans analizi
    total = db.query(Submission).filter(Submission.user_id == user_id).count()
    wrong = db.query(Submission).filter(
        Submission.user_id == user_id, 
        Submission.is_correct == False
    ).count()
    ratio = wrong / total if total else 0
    targeted_percent = 0.8 if ratio >= 0.6 else 0.6 if ratio >= 0.3 else 0.4

    # Çözülmemiş soruları filtrele
    query = db.query(Questions).filter(
        Questions.ders_id == ders_id,
        ~Questions.soru_id.in_(answered_questions)  # Çözülmemiş sorular
    )
    
    if etiket:
        # Make the search case-insensitive and more flexible
        query = query.filter(Questions.etiket.ilike(f"%{etiket.lower()}%"))
    
    qs = query.all()
    
    print(f"DEBUG: Found {len(qs)} questions for ders_id={ders_id}, etiket={etiket}")
    
    # Eğer çözülmemiş soru yoksa, tüm soruları göster
    if len(qs) < 5:
        query = db.query(Questions).filter(Questions.ders_id == ders_id)
        if etiket:
            # Make the search case-insensitive and more flexible
            query = query.filter(Questions.etiket.ilike(f"%{etiket.lower()}%"))
        qs = query.all()
        
        if len(qs) < 5:
            raise HTTPException(status_code=400, detail="Yeterli soru yok")

    scored = []
    for q in qs:
        X = {
            "ders_id": q.ders_id,
            "konu_id": q.konu_id,
            "altbaslik_id": q.altbaslik_id,
            "zorluk": q.zorluk,
            "user_id": user_id
        }
        p = model.predict(X)
        scored.append((q, p))

    # AI skorlarına göre sırala (düşük skor = önerilen soru)
    scored.sort(key=lambda tup: tup[1])
    
    # Performans analizi ile hedefleme
    if ratio >= 0.6:
        # Zayıf performans - kolay sorular
        easy_questions = [q for q, _ in scored if q.zorluk <= 2]
        if len(easy_questions) >= 5:
            # secenekler alanını JSON'dan parse et
            for q in easy_questions[:5]:
                try:
                    q.secenekler = json.loads(q.secenekler) if q.secenekler else {}
                except (json.JSONDecodeError, TypeError):
                    q.secenekler = {}
            return easy_questions[:5]
    
    # Normal seçim - AI skoruna göre
    selected_questions = [q for q, _ in scored[:5]]
    # secenekler alanını JSON'dan parse et
    for q in selected_questions:
        try:
            q.secenekler = json.loads(q.secenekler) if q.secenekler else {}
        except (json.JSONDecodeError, TypeError):
            q.secenekler = {}
    return selected_questions
