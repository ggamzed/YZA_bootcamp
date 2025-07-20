from fastapi import APIRouter, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from collections import defaultdict

from backend.app.auth_def import decode_token
from backend.app.database import get_db
from backend.app.models import Submission, Questions

router = APIRouter(prefix="/stats", tags=["statistics"])
bearer = HTTPBearer()

@router.get("/summary")
def get_user_stats(
    creds: HTTPAuthorizationCredentials = Depends(bearer),
    db: Session = Depends(get_db)
):
    payload = decode_token(creds.credentials)
    user_id = int(payload.get("sub"))

    results = (
        db.query(
            Questions.ders_id,
            Questions.altbaslik_id,
            Questions.konu_id,
            Submission.is_correct
        )
        .join(Submission, Submission.question_id == Questions.soru_id)
        .filter(Submission.user_id == user_id)
        .all()
    )


    stats = defaultdict(lambda: {"correct": 0, "total": 0})
    for ders_id, altbaslik_id, konu_id, is_correct in results:
        key = (ders_id, altbaslik_id, konu_id)
        stats[key]["total"] += 1
        if is_correct:
            stats[key]["correct"] += 1

    response = []
    for (ders_id, altbaslik_id, konu_id), val in stats.items():
        percent = round(100 * val["correct"] / val["total"], 1)
        response.append({
            "ders_id":       ders_id,
            "altbaslik_id":  altbaslik_id,
            "konu_id":       konu_id,
            "correct":       val["correct"],
            "total":         val["total"],
            "accuracy":      percent
        })

    return response
