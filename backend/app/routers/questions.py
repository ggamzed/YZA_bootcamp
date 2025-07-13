from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from random import sample, shuffle
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
    creds: HTTPAuthorizationCredentials = Depends(bearer),
    db: Session = Depends(get_db)
):
    payload = decode_token(creds.credentials)
    user_id = int(payload.get("sub"))


    total = db.query(Submission).filter(Submission.user_id == user_id).count()
    wrong = db.query(Submission).filter(Submission.user_id == user_id, Submission.is_correct == False).count()
    ratio = wrong / total if total else 0

    if ratio >= 0.6:
        targeted_percent = 0.8
    elif ratio >= 0.3:
        targeted_percent = 0.6
    else:
        targeted_percent = 0.4

    qs = db.query(Questions).filter(Questions.ders_id == ders_id).all()
    if len(qs) < 30:
        raise HTTPException(status_code=400, detail="Yeterli soru yok")

    scored = []
    for q in qs:
        x = {
            "ders_id": q.ders_id,
            "konu_id": q.konu_id,
            "zorluk": q.zorluk,
            "user_id": user_id
        }
        p = model.predict(x).get(1, 0)
        scored.append((q, p))

    scored.sort(key=lambda tup: tup[1])
    targeted_count = int(30 * targeted_percent)
    general_count = 30 - targeted_count

    targeted = [q for q, _ in scored[:targeted_count]]
    remaining_pool = [q for q, _ in scored[targeted_count:]]
    shuffle(remaining_pool)
    randoms = remaining_pool[:general_count]

    final_batch = targeted + randoms
    shuffle(final_batch)

    return [
        {
            "soru_id": q.soru_id,
            "ders_id": q.ders_id,
            "konu_id": q.konu_id,
            "zorluk": q.zorluk,
            "soru_metin": q.soru_metin,
            "choices": {
                "A": q.choice_a,
                "B": q.choice_b,
                "C": q.choice_c,
                "D": q.choice_d,
                "E": q.choice_e
            },
            "correct_choice": q.correct_choice
        }
        for q in final_batch
    ]
