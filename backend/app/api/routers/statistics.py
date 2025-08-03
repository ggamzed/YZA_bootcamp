from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from collections import defaultdict
from datetime import datetime, timezone, timedelta
from jose import JWTError

from app.services.auth_def import decode_token
from app.core.database import get_db
from app.core.models import Submission, Questions, TestSession
from app.services.enhanced_ml_model import EnhancedPracticeModel

router = APIRouter(prefix="/stats", tags=["statistics"])
bearer = HTTPBearer()

TURKEY_TIMEZONE = timezone(timedelta(hours=3))
model = EnhancedPracticeModel()

def get_topic_name(ders_id, konu_id):
    topic_names = {
        1: {
            1: "Basit Eşitsizlikler",
            2: "Fonksiyonlar", 
            3: "Olasılık"
        },
        2: {
            1: "Basit Makineler",
            2: "İş, Güç ve Enerji",
            3: "Atom Modelleri"
        },
        3: {
            1: "Kimyasal Türler Arası Etkileşimler",
            2: "Karışımlar",
            3: "Gazlar"
        },
        4: {
            1: "Sinir Sistemi",
            2: "Sindirim Sistemi", 
            3: "Solunum Sistemi"
        },
        5: {
            1: "Sözcükte Anlam",
            2: "Cümlede Anlam",
            3: "Ses Bilgisi"
        },
        6: {
            1: "İlk Türk Devletleri",
            2: "Türk-İslam Devletleri",
            3: "Kurtuluş Savaşı'nda Cepheler"
        }
    }
    
    return topic_names.get(ders_id, {}).get(konu_id, f"Konu {konu_id}")

def get_difficulty_name(zorluk):
    difficulty_names = {
        1: "Kolay",
        2: "Orta",
        3: "Zor",
        4: "Çok Zor",
        5: "İleri Seviye"
    }
    return difficulty_names.get(zorluk, f"Seviye {zorluk}")

@router.get("/summary")
def get_user_stats(
    creds: HTTPAuthorizationCredentials = Depends(bearer),
    db: Session = Depends(get_db)
):
    try:
        payload = decode_token(creds.credentials)
        user_id = int(payload.get("sub"))
    except JWTError:
        raise HTTPException(status_code=401, detail="Geçersiz token.")

    results = (
        db.query(
            Questions.ders_id,
            Questions.altbaslik_id,
            Questions.konu_id,
            Questions.zorluk,
            Submission.is_correct,
            Submission.is_skipped,
            Submission.answered_at
        )
        .join(Submission, Submission.question_id == Questions.soru_id)
        .filter(Submission.user_id == user_id)
        .all()
    )

    ders_stats = defaultdict(lambda: {"correct": 0, "total": 0, "skipped": 0})
    konu_stats = defaultdict(lambda: {"correct": 0, "total": 0, "skipped": 0})
    zorluk_stats = defaultdict(lambda: {"correct": 0, "total": 0, "skipped": 0})
    
    for ders_id, altbaslik_id, konu_id, zorluk, is_correct, is_skipped, answered_at in results:
        ders_stats[ders_id]["total"] += 1
        if is_skipped:
            ders_stats[ders_id]["skipped"] += 1
        elif is_correct:
            ders_stats[ders_id]["correct"] += 1
        
        konu_key = (ders_id, konu_id)
        konu_stats[konu_key]["total"] += 1
        if is_skipped:
            konu_stats[konu_key]["skipped"] += 1
        elif is_correct:
            konu_stats[konu_key]["correct"] += 1
            
        zorluk_stats[zorluk]["total"] += 1
        if is_skipped:
            zorluk_stats[zorluk]["skipped"] += 1
        elif is_correct:
            zorluk_stats[zorluk]["correct"] += 1

    response = []

    for ders_id, val in ders_stats.items():
        percent = round(100 * val["correct"] / val["total"], 1) if val["total"] > 0 else 0
        response.append({
            "ders_id": ders_id,
            "konu_id": 0,
            "altbaslik_id": 0,
            "zorluk": 0,
            "correct": val["correct"],
            "total": val["total"],
            "skipped": val["skipped"],
            "accuracy": percent,
            "is_correct": True, 
            "answered_at": datetime.now(TURKEY_TIMEZONE).isoformat()
        })
    

    for (ders_id, konu_id), val in konu_stats.items():
        percent = round(100 * val["correct"] / val["total"], 1) if val["total"] > 0 else 0
        response.append({
            "ders_id": ders_id,
            "konu_id": konu_id,
            "altbaslik_id": 0,
            "zorluk": 0,
            "correct": val["correct"],
            "total": val["total"],
            "skipped": val["skipped"],
            "accuracy": percent,
            "is_correct": True,
            "answered_at": datetime.now(TURKEY_TIMEZONE).isoformat()
        })

    return response

@router.get("/completed-tests")
def get_completed_tests(
    creds: HTTPAuthorizationCredentials = Depends(bearer),
    db: Session = Depends(get_db)
):
    try:
        payload = decode_token(creds.credentials)
        user_id = int(payload.get("sub"))
    except JWTError:
        raise HTTPException(status_code=401, detail="Geçersiz token.")

    test_sessions = (
        db.query(TestSession)
        .filter(TestSession.user_id == user_id)
        .order_by(TestSession.started_at.desc())
        .all()
    )

    response = []
    for session in test_sessions:
        submissions = (
            db.query(
                Questions.ders_id,
                Questions.konu_id,
                Questions.zorluk,
                Submission.is_correct,
                Submission.answered_at
            )
            .join(Submission, Submission.question_id == Questions.soru_id)
            .filter(Submission.test_session_id == session.id)
            .all()
        )

        if not submissions:
            continue

        konu_stats = {}
        zorluk_stats = {}
        correct_count = 0
        incorrect_count = 0

        for ders_id, konu_id, zorluk, is_correct, answered_at in submissions:
            if is_correct:
                correct_count += 1
            else:
                incorrect_count += 1

            if konu_id not in konu_stats:
                konu_stats[konu_id] = {"total": 0, "correct": 0}
            konu_stats[konu_id]["total"] += 1
            if is_correct:
                konu_stats[konu_id]["correct"] += 1

            if zorluk not in zorluk_stats:
                zorluk_stats[zorluk] = {"total": 0, "correct": 0}
            zorluk_stats[zorluk]["total"] += 1
            if is_correct:
                zorluk_stats[zorluk]["correct"] += 1

        total_questions = len(submissions)
        accuracy = round((correct_count / total_questions) * 100, 1) if total_questions > 0 else 0

        if session.ended_at:
            duration_minutes = (session.ended_at - session.started_at).total_seconds() / 60
        else:
            last_submission = max(submissions, key=lambda x: x[4] if x[4] else session.started_at)
            duration_minutes = (last_submission[4] - session.started_at).total_seconds() / 60 if last_submission[4] else 1
        
        duration_minutes = max(1, round(duration_minutes, 1))

        test_date = session.started_at.strftime('%d.%m.%Y %H:%M')

        konu_bazli = []
        for konu_id, stats in konu_stats.items():
            konu_accuracy = round((stats["correct"] / stats["total"]) * 100, 1) if stats["total"] > 0 else 0
            konu_bazli.append({
                "konu_id": konu_id,
                "konu_name": get_topic_name(session.ders_id, konu_id),
                "total": stats["total"],
                "correct": stats["correct"],
                "accuracy": konu_accuracy
            })

        zorluk_bazli = []
        for zorluk, stats in zorluk_stats.items():
            zorluk_accuracy = round((stats["correct"] / stats["total"]) * 100, 1) if stats["total"] > 0 else 0
            zorluk_bazli.append({
                "zorluk": zorluk,
                "zorluk_name": get_difficulty_name(zorluk),
                "total": stats["total"],
                "correct": stats["correct"],
                "accuracy": zorluk_accuracy
            })

        response.append({
            "test_date": test_date,
            "ders_id": session.ders_id,
            "total_questions": total_questions,
            "correct_answers": correct_count,
            "incorrect_answers": incorrect_count,
            "accuracy": accuracy,
            "duration_minutes": duration_minutes,
            "konu_bazli": konu_bazli,
            "zorluk_bazli": zorluk_bazli,
            "is_completed": session.is_completed,
            "etiket": session.etiket
        })

    return response

@router.get("/topic-stats")
def get_topic_statistics(
    time_filter: str,
    creds: HTTPAuthorizationCredentials = Depends(bearer),
    db: Session = Depends(get_db)
):
    try:
        payload = decode_token(creds.credentials)
        user_id = int(payload.get("sub"))
    except JWTError:
        raise HTTPException(status_code=401, detail="Geçersiz token.")

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
        if answered_at is None:
            turkey_time = datetime.now(TURKEY_TIMEZONE)
        else:
            turkey_time = answered_at
        
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
    try:
        payload = decode_token(creds.credentials)
        user_id = int(payload.get("sub"))
    except JWTError:
        raise HTTPException(status_code=401, detail="Geçersiz token.")

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
        if answered_at is None:
            turkey_time = datetime.now(TURKEY_TIMEZONE)
        else:
            turkey_time = answered_at
        
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

@router.get("/ai-recommendations")
def get_ai_recommendations(
    creds: HTTPAuthorizationCredentials = Depends(bearer),
    db: Session = Depends(get_db)
):
    try:
        payload = decode_token(creds.credentials)
        user_id = int(payload.get("sub"))
    except JWTError:
        raise HTTPException(status_code=401, detail="Geçersiz token.")
    
    try:

        recommendations = model.get_recommendations(user_id, ders_id=1)
        

        user_stats = model.user_stats.get(user_id, {
            'total_questions': 0,
            'correct_answers': 0,
            'recent_performance': [],
            'last_activity': None
        })
        

        default_recommendations = {
            "recommended_difficulty": 2, 
            "weak_topics": [],
            "strong_topics": []
        }
        

        if recommendations is None:
            recommendations = default_recommendations
        
        response = {
            "recommendations": recommendations,
            "user_stats": {
                "total_questions": user_stats.get('total_questions', 0),
                "correct_answers": user_stats.get('correct_answers', 0),
                "overall_accuracy": user_stats.get('correct_answers', 0) / user_stats.get('total_questions', 1) if user_stats.get('total_questions', 0) > 0 else 0,
                "recent_performance": user_stats.get('recent_performance', [])[-5:] if len(user_stats.get('recent_performance', [])) > 0 else [],
                "last_activity": user_stats.get('last_activity').isoformat() if user_stats.get('last_activity') else None
            }
        }
        
        return response
        
    except Exception as e:
        print(f"DEBUG: Error getting AI recommendations for user {user_id}: {e}")

        return {
            "recommendations": {
                "recommended_difficulty": 2,
                "weak_topics": [],
                "strong_topics": []
            },
            "user_stats": {
                "total_questions": 0,
                "correct_answers": 0,
                "overall_accuracy": 0,
                "recent_performance": [],
                "last_activity": None
            }
        }

@router.get("/time-stats")
def get_time_statistics(
    creds: HTTPAuthorizationCredentials = Depends(bearer),
    db: Session = Depends(get_db)
):
    try:
        payload = decode_token(creds.credentials)
        user_id = int(payload.get("sub"))
    except JWTError:
        raise HTTPException(status_code=401, detail="Geçersiz token.")

    results = (
        db.query(
            Questions.ders_id,
            Submission.answered_at,
            Submission.is_correct
        )
        .join(Submission, Submission.question_id == Questions.soru_id)
        .filter(Submission.user_id == user_id)
        .order_by(Submission.answered_at.asc())
        .all()
    )

    subject_sessions = {}
    current_session = None
    
    for ders_id, answered_at, is_correct in results:
        if answered_at is None:
            continue
            
        turkey_time = answered_at
        
        if current_session is None:
            current_session = {
                'ders_id': ders_id,
                'start_time': turkey_time,
                'end_time': turkey_time,
                'question_count': 1
            }
        elif current_session['ders_id'] == ders_id:
            current_session['end_time'] = turkey_time
            current_session['question_count'] += 1
        else:
            if current_session['question_count'] >= 3:
                session_duration = (current_session['end_time'] - current_session['start_time']).total_seconds() / 60
                ders_id_key = current_session['ders_id']
                
                if ders_id_key not in subject_sessions:
                    subject_sessions[ders_id_key] = {
                        'total_minutes': 0,
                        'session_count': 0,
                        'total_questions': 0
                    }
                
                subject_sessions[ders_id_key]['total_minutes'] += session_duration
                subject_sessions[ders_id_key]['session_count'] += 1
                subject_sessions[ders_id_key]['total_questions'] += current_session['question_count']
            
            current_session = {
                'ders_id': ders_id,
                'start_time': turkey_time,
                'end_time': turkey_time,
                'question_count': 1
            }
    
    if current_session and current_session['question_count'] >= 3:
        session_duration = (current_session['end_time'] - current_session['start_time']).total_seconds() / 60
        ders_id_key = current_session['ders_id']
        
        if ders_id_key not in subject_sessions:
            subject_sessions[ders_id_key] = {
                'total_minutes': 0,
                'session_count': 0,
                'total_questions': 0
            }
        
        subject_sessions[ders_id_key]['total_minutes'] += session_duration
        subject_sessions[ders_id_key]['session_count'] += 1
        subject_sessions[ders_id_key]['total_questions'] += current_session['question_count']

    response = []
    for ders_id, stats in subject_sessions.items():
        response.append({
            'ders_id': ders_id,
            'total_minutes': round(stats['total_minutes'], 1),
            'session_count': stats['session_count'],
            'total_questions': stats['total_questions'],
            'average_minutes_per_session': round(stats['total_minutes'] / stats['session_count'], 1) if stats['session_count'] > 0 else 0
        })

    return response
