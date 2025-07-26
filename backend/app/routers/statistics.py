from fastapi import APIRouter, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from collections import defaultdict
from datetime import datetime, timezone, timedelta

from backend.app.auth_def import decode_token
from backend.app.database import get_db
from backend.app.models import Submission, Questions

router = APIRouter(prefix="/stats", tags=["statistics"])
bearer = HTTPBearer()

TURKEY_TIMEZONE = timezone(timedelta(hours=3))

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

@router.get("/completed-tests")
def get_completed_tests(
    creds: HTTPAuthorizationCredentials = Depends(bearer),
    db: Session = Depends(get_db)
):
    payload = decode_token(creds.credentials)
    user_id = int(payload.get("sub"))
 # Kullanıcının çözdüğü testleri grupla
    results = (
        db.query(
            Questions.ders_id,
            Submission.answered_at,
            Submission.is_correct,
            Questions.konu_id,
            Questions.zorluk
        )
        .join(Submission, Submission.question_id == Questions.soru_id)
        .filter(Submission.user_id == user_id)
        .order_by(Submission.answered_at.desc())
        .all()
    )

    # Testleri tarih bazında grupla
    test_sessions = {}
    for ders_id, answered_at, is_correct, konu_id, zorluk in results:
        if answered_at.tzinfo is None:
            turkey_time = answered_at.replace(tzinfo=timezone.utc).astimezone(TURKEY_TIMEZONE)
        else:
            turkey_time = answered_at.astimezone(TURKEY_TIMEZONE)
          # Tarihi Türkiye saatine göre formatla
        date_key = turkey_time.strftime('%d.%m.%Y %H:%M')
        
        if date_key not in test_sessions:
            test_sessions[date_key] = {
                "date": turkey_time,
                "ders_id": ders_id,
                "total": 0,
                "correct": 0,
                "incorrect": 0,
                "konu_stats": {},
                "zorluk_stats": {}
            }
        
        session = test_sessions[date_key]
        session["total"] += 1
        if is_correct:
            session["correct"] += 1
        else:
            session["incorrect"] += 1
        
        if konu_id not in session["konu_stats"]:
            session["konu_stats"][konu_id] = {"total": 0, "correct": 0}
        session["konu_stats"][konu_id]["total"] += 1
        if is_correct:
            session["konu_stats"][konu_id]["correct"] += 1

        if zorluk not in session["zorluk_stats"]:
            session["zorluk_stats"][zorluk] = {"total": 0, "correct": 0}
        session["zorluk_stats"][zorluk]["total"] += 1
        if is_correct:
            session["zorluk_stats"][zorluk]["correct"] += 1

    response = []
    for date_key, session in test_sessions.items():
        accuracy = round((session["correct"] / session["total"]) * 100, 1) if session["total"] > 0 else 0
        
        konu_bazli = []
        for konu_id, stats in session["konu_stats"].items():
            konu_accuracy = round((stats["correct"] / stats["total"]) * 100, 1) if stats["total"] > 0 else 0
            konu_bazli.append({
                "konu_id": konu_id,
                "total": stats["total"],
                "correct": stats["correct"],
                "accuracy": konu_accuracy
            })
        
        zorluk_bazli = []
        for zorluk, stats in session["zorluk_stats"].items():
            zorluk_accuracy = round((stats["correct"] / stats["total"]) * 100, 1) if stats["total"] > 0 else 0
            zorluk_bazli.append({
                "zorluk": zorluk,
                "total": stats["total"],
                "correct": stats["correct"],
                "accuracy": zorluk_accuracy
            })
        
        response.append({
            "test_date": date_key,
            "ders_id": session["ders_id"],
            "total_questions": session["total"],
            "correct_answers": session["correct"],
            "incorrect_answers": session["incorrect"],
            "accuracy": accuracy,
            "konu_bazli": konu_bazli,
            "zorluk_bazli": zorluk_bazli
        })

    return response

@router.get("/topic-stats")
def get_topic_statistics(
    time_filter: str,
    creds: HTTPAuthorizationCredentials = Depends(bearer),
    db: Session = Depends(get_db)
):
    payload = decode_token(creds.credentials)
    user_id = int(payload.get("sub"))

    now = datetime.now(TURKEY_TIMEZONE)

    week_start = now - timedelta(days=now.weekday())
    week_start = week_start.replace(hour=0, minute=0, second=0, microsecond=0)

    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    results = (
        db.query(
            Questions.ders_id,
            Questions.konu_id,
            Submission.answered_at,
            Submission.is_correct
        )
        .join(Submission, Submission.question_id == Questions.soru_id)
        .filter(Submission.user_id == user_id)
        .all()
    )

    topic_stats = {}
    
    for ders_id, konu_id, answered_at, is_correct in results:
        if answered_at.tzinfo is None:
            turkey_time = answered_at.replace(tzinfo=timezone.utc).astimezone(TURKEY_TIMEZONE)
        else:
            turkey_time = answered_at.astimezone(TURKEY_TIMEZONE)
        
        include_in_stats = False
        if time_filter == 'week':
            include_in_stats = turkey_time >= week_start
        elif time_filter == 'month':
            include_in_stats = turkey_time >= month_start
        elif time_filter == 'all':
            include_in_stats = True
        
        if not include_in_stats:
            continue
        
        key = (ders_id, konu_id)
        if key not in topic_stats:
            topic_stats[key] = {
                "ders_id": ders_id,
                "konu_id": konu_id,
                "total": 0,
                "correct": 0
            }
        
        topic_stats[key]["total"] += 1
        if is_correct:
            topic_stats[key]["correct"] += 1

    response = []
    for (ders_id, konu_id), stats in topic_stats.items():
        accuracy = round((stats["correct"] / stats["total"]) * 100, 1) if stats["total"] > 0 else 0
        
        response.append({
            "ders_id": ders_id,
            "konu_id": konu_id,
            "total": stats["total"],
            "correct": stats["correct"],
            "accuracy": accuracy
        })

    return response

@router.get("/subject-stats")
def get_subject_statistics(
    creds: HTTPAuthorizationCredentials = Depends(bearer),
    db: Session = Depends(get_db)
):
    payload = decode_token(creds.credentials)
    user_id = int(payload.get("sub"))

    now = datetime.now(TURKEY_TIMEZONE)

    week_start = now - timedelta(days=now.weekday())
    week_start = week_start.replace(hour=0, minute=0, second=0, microsecond=0)

    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    year_start = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)

    results = (
        db.query(
            Questions.ders_id,
            Submission.answered_at,
            Submission.is_correct,
            Questions.zorluk
        )
        .join(Submission, Submission.question_id == Questions.soru_id)
        .filter(Submission.user_id == user_id)
        .all()
    )

    subject_stats = {}
    
    for ders_id, answered_at, is_correct, zorluk in results:
        if answered_at.tzinfo is None:
            turkey_time = answered_at.replace(tzinfo=timezone.utc).astimezone(TURKEY_TIMEZONE)
        else:
            turkey_time = answered_at.astimezone(TURKEY_TIMEZONE)
        
        if ders_id not in subject_stats:
            subject_stats[ders_id] = {
                "total": 0,
                "correct": 0,
                "week_total": 0,
                "week_correct": 0,
                "month_total": 0,
                "month_correct": 0,
                "year_total": 0,
                "year_correct": 0,
                "difficulty_stats": {1: 0, 2: 0, 3: 0},
                "first_answer_date": turkey_time,
                "last_answer_date": turkey_time
            }
        
        stats = subject_stats[ders_id]
        stats["total"] += 1
        if is_correct:
            stats["correct"] += 1

        if zorluk in stats["difficulty_stats"]:
            stats["difficulty_stats"][zorluk] += 1

        if turkey_time >= week_start:
            stats["week_total"] += 1
            if is_correct:
                stats["week_correct"] += 1
        
        if turkey_time >= month_start:
            stats["month_total"] += 1
            if is_correct:
                stats["month_correct"] += 1
        
        if turkey_time >= year_start:
            stats["year_total"] += 1
            if is_correct:
                stats["year_correct"] += 1

        if turkey_time < stats["first_answer_date"]:
            stats["first_answer_date"] = turkey_time
        if turkey_time > stats["last_answer_date"]:
            stats["last_answer_date"] = turkey_time

    response = []
    for ders_id, stats in subject_stats.items():
        overall_accuracy = round((stats["correct"] / stats["total"]) * 100, 1) if stats["total"] > 0 else 0
        week_accuracy = round((stats["week_correct"] / stats["week_total"]) * 100, 1) if stats["week_total"] > 0 else 0
        month_accuracy = round((stats["month_correct"] / stats["month_total"]) * 100, 1) if stats["month_total"] > 0 else 0
        year_accuracy = round((stats["year_correct"] / stats["year_total"]) * 100, 1) if stats["year_total"] > 0 else 0

        total_time_minutes = stats["total"] * 2
        total_time_hours = total_time_minutes // 60
        total_time_minutes_remainder = total_time_minutes % 60
        
        week_time_minutes = stats["week_total"] * 2
        week_time_hours = week_time_minutes // 60
        week_time_minutes_remainder = week_time_minutes % 60
        
        response.append({
            "ders_id": ders_id,
            "total_questions": stats["total"],
            "total_correct": stats["correct"],
            "overall_accuracy": overall_accuracy,
            "week_total": stats["week_total"],
            "week_correct": stats["week_correct"],
            "week_accuracy": week_accuracy,
            "month_total": stats["month_total"],
            "month_correct": stats["month_correct"],
            "month_accuracy": month_accuracy,
            "year_total": stats["year_total"],
            "year_correct": stats["year_correct"],
            "year_accuracy": year_accuracy,
            "total_time": f"{total_time_hours}s {total_time_minutes_remainder}dk",
            "week_time": f"{week_time_hours}s {week_time_minutes_remainder}dk",
            "difficulty_stats": stats["difficulty_stats"],
            "first_answer_date": stats["first_answer_date"].strftime('%d.%m.%Y'),
            "last_answer_date": stats["last_answer_date"].strftime('%d.%m.%Y')
        })

    return response
