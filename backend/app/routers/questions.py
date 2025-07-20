from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from random import shuffle
from backend.app.database import get_db
from backend.app.auth_def import decode_token
from backend.app.models import Questions, Submission
from backend.app.ml_model import PracticeModel

router = APIRouter(prefix="/questions", tags=["questions"])
bearer = HTTPBearer()
model = PracticeModel()

@router.get("/batch")
def get_batch_questions(
    ders_id: int,
    etiket: str = None,
    creds: HTTPAuthorizationCredentials = Depends(bearer),
    db: Session = Depends(get_db)
):
    user_id = int(decode_token(creds.credentials).get("sub"))
    total = db.query(Submission).filter(Submission.user_id == user_id).count()
    wrong = db.query(Submission).filter(Submission.user_id == user_id, Submission.is_correct == False).count()
    ratio = wrong / total if total else 0
    targeted_percent = 0.8 if ratio >= 0.6 else 0.6 if ratio >= 0.3 else 0.4

    query = db.query(Questions).filter(Questions.ders_id == ders_id)
    if etiket:
        query = query.filter(Questions.tags.ilike(f"%{etiket}%"))
    qs = query.all()
    if len(qs) < 30:
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
        p = model.predict(X).get(1, 0)
        scored.append((q, p))

    scored.sort(key=lambda tup: tup[1])
    targeted_count = int(30 * targeted_percent)
    general_count = 30 - targeted_count
    targeted = [q for q, _ in scored[:targeted_count]]
    remaining = [q for q, _ in scored[targeted_count:]]
    shuffle(remaining)
    randoms = remaining[:general_count]
    final_batch = targeted + randoms
    shuffle(final_batch)

    return [
        {
            "soru_id": q.soru_id,
            "ders_id": q.ders_id,
            "konu_id": q.konu_id,
            "altbaslik_id": q.altbaslik_id,
            "image_url": q.gorsel_url,
            "zorluk": q.zorluk,
            "soru_metin": q.soru_metin,
            "choices": {
                "A": q.choice_a,
                "B": q.choice_b,
                "C": q.choice_c,
                "D": q.choice_d,
                "E": q.choice_e
            },
            "correct_choice": q.correct_choice,
            "dogru_cevap_aciklamasi": q.dogru_cevap_aciklamasi
        }
        for q in final_batch
    ]
