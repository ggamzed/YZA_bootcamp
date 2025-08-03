from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from datetime import datetime, timezone, timedelta
from random import shuffle, sample
import json
import traceback
from jose import JWTError
from app.core.database import get_db
from app.services.auth_def import decode_token
from app.core.models import Questions, Submission, TestSession
from app.services.enhanced_ml_model import EnhancedPracticeModel


router = APIRouter(prefix="/questions", tags=["questions"])
bearer = HTTPBearer()

TURKEY_TIMEZONE = timezone(timedelta(hours=3))
model = EnhancedPracticeModel()

@router.post("/start-test")
def start_test(
    ders_id: int,
    etiket: str = None,
    creds: HTTPAuthorizationCredentials = Depends(bearer),
    db: Session = Depends(get_db)
):
    try:
        user_id = int(decode_token(creds.credentials).get("sub"))
    except JWTError:
        raise HTTPException(status_code=401, detail="Geçersiz token.")
    
    try:
        test_session = TestSession(
            user_id=user_id,
            ders_id=ders_id,
            etiket=etiket,
            started_at=datetime.now(TURKEY_TIMEZONE),
            is_completed=False
        )
        db.add(test_session)
        db.commit()
        db.refresh(test_session)
        
        return {
            "test_session_id": test_session.id,
            "message": "Test oturumu başlatıldı"
        }
        
    except Exception as e:
        print(f"Test başlatma hatası: {e}")
        raise HTTPException(status_code=500, detail="Test başlatılırken hata oluştu")

@router.post("/end-test")
def end_test(
    test_session_id: int,
    creds: HTTPAuthorizationCredentials = Depends(bearer),
    db: Session = Depends(get_db)
):
    try:
        user_id = int(decode_token(creds.credentials).get("sub"))
    except JWTError:
        raise HTTPException(status_code=401, detail="Geçersiz token.")
    
    try:
        test_session = db.query(TestSession).filter(
            TestSession.id == test_session_id,
            TestSession.user_id == user_id
        ).first()
        
        if not test_session:
            raise HTTPException(status_code=404, detail="Test oturumu bulunamadı")
        
        test_session.ended_at = datetime.now(TURKEY_TIMEZONE)
        test_session.is_completed = True
        
        submissions = db.query(Submission).filter(
            Submission.test_session_id == test_session_id
        ).all()
        
        test_session.total_questions = len(submissions)
        test_session.correct_answers = sum(1 for s in submissions if s.is_correct)
        test_session.incorrect_answers = sum(1 for s in submissions if not s.is_correct and not s.is_skipped)
        
        db.commit()
        
        return {
            "message": "Test oturumu tamamlandı",
            "total_questions": test_session.total_questions,
            "correct_answers": test_session.correct_answers,
            "incorrect_answers": test_session.incorrect_answers
        }
        
    except Exception as e:
        print(f"Test bitirme hatası: {e}")
        raise HTTPException(status_code=500, detail="Test bitirilirken hata oluştu")

@router.get("/batch")
def get_batch_questions(
    ders_id: int,
    etiket: str = None,
    creds: HTTPAuthorizationCredentials = Depends(bearer),
    db: Session = Depends(get_db)
):
    print(f"DEBUG: Starting get_batch_questions with ders_id={ders_id}, etiket={etiket}")
    
    try:
        user_id = int(decode_token(creds.credentials).get("sub"))
        print(f"DEBUG: User ID extracted: {user_id}")
    except JWTError as e:
        print(f"JWT Error: {e}")
        raise HTTPException(status_code=401, detail="Geçersiz token.")
    except (ValueError, TypeError) as e:
        print(f"Token decode error: {e}")
        raise HTTPException(status_code=401, detail="Geçersiz token formatı.")
    
    try:
        print(f"DEBUG: Querying database for user {user_id}")
        
        # Sadece gerekli sütunları seç
        answered_questions = db.query(Submission.question_id).filter(
            Submission.user_id == user_id
        ).subquery()
        
        print(f"DEBUG: Found answered questions subquery")

        # Sadece gerekli sütunları kullan
        total = db.query(Submission.id).filter(Submission.user_id == user_id).count()
        wrong = db.query(Submission.id).filter(
            Submission.user_id == user_id, 
            Submission.is_correct == False
        ).count()
        ratio = wrong / total if total else 0
        targeted_percent = 0.8 if ratio >= 0.6 else 0.6 if ratio >= 0.3 else 0.4
        
        print(f"DEBUG: Performance analysis - total: {total}, wrong: {wrong}, ratio: {ratio}")

        all_questions = db.query(Questions).filter(Questions.ders_id == ders_id).all()
        print(f"DEBUG: Total questions for ders_id={ders_id}: {len(all_questions)}")
        
        if etiket:
            filtered_questions = [q for q in all_questions if etiket.lower() in q.etiket.lower()]
            print(f"DEBUG: Questions with etiket '{etiket}': {len(filtered_questions)}")
        else:
            filtered_questions = all_questions
            print(f"DEBUG: No etiket filter applied")
        
        # Sadece question_id sütununu seç
        answered_ids = db.query(Submission.question_id).filter(Submission.user_id == user_id).all()
        answered_ids = [id[0] for id in answered_ids]
        print(f"DEBUG: Answered question IDs: {answered_ids}")
        
        unanswered_questions = [q for q in filtered_questions if q.soru_id not in answered_ids]
        print(f"DEBUG: Unanswered questions: {len(unanswered_questions)}")
        
        if len(unanswered_questions) < 30:
            print(f"DEBUG: Not enough unanswered questions ({len(unanswered_questions)}), showing all questions")
            qs = filtered_questions
        else:
            qs = unanswered_questions
            
        if len(qs) < 30:
            print(f"ERROR: Not enough questions found. Total: {len(qs)}")
            raise HTTPException(status_code=400, detail=f"Ders ID {ders_id} için yeterli soru bulunamadı. Toplam {len(qs)} soru mevcut.")

        # AI model her zaman çalışır, sadece 30 soru sonrası kullanıcıya gösterilir
        print(f"DEBUG: Processing {len(qs)} questions with AI model")
        scored = []
        for q in qs:
            try:
                X = {
                    "ders_id": q.ders_id,
                    "konu_id": q.konu_id,
                    "altbaslik_id": q.altbaslik_id,
                    "zorluk": q.zorluk,
                    "user_id": user_id
                }
                p = model.predict(X)
                scored.append((q, p))
            except Exception as e:
                print(f"AI model prediction error for question {q.soru_id}: {e}")
                print(f"Traceback: {traceback.format_exc()}")
                scored.append((q, 0.5))

        # Kullanıcının bu dersten çözdüğü soru sayısını kontrol et
        user_question_count = db.query(Submission.id).join(Questions, Submission.question_id == Questions.soru_id).filter(
            Submission.user_id == user_id,
            Questions.ders_id == ders_id
        ).count()
        
        print(f"DEBUG: User has solved {user_question_count} questions in this subject")
        
        selected_questions = []
        
        if user_question_count < 30:
            # YENİ KULLANICI: İlk 30 soru - %100 rastgele, eşit dağılım
            print("DEBUG: New user - 100% random selection with equal distribution")
            
            # Zorluk seviyelerine göre grupla
            easy_questions = [q for q, _ in scored if q.zorluk <= 2]
            medium_questions = [q for q, _ in scored if 3 <= q.zorluk <= 4]
            hard_questions = [q for q, _ in scored if q.zorluk >= 5]
            
            # Her zorluk seviyesinden eşit sayıda soru seç (10'ar tane)
            easy_count = min(10, len(easy_questions))
            medium_count = min(10, len(medium_questions))
            hard_count = min(10, len(hard_questions))
            
            # Rastgele seç
            shuffle(easy_questions)
            shuffle(medium_questions)
            shuffle(hard_questions)
            
            selected_questions.extend(easy_questions[:easy_count])
            selected_questions.extend(medium_questions[:medium_count])
            selected_questions.extend(hard_questions[:hard_count])
            
            # Kalan sorulardan rastgele tamamla
            remaining = [q for q, _ in scored if q not in selected_questions]
            shuffle(remaining)
            selected_questions.extend(remaining[:30 - len(selected_questions)])
            
        else:
            # DENEYİMLİ KULLANICI: %70 zayıf noktalar + %30 rastgele çeşitlilik
            print("DEBUG: Experienced user - 70% weak points + 30% random diversity")
            
            # AI skoruna göre sırala (düşük skor = zayıf konu)
            scored.sort(key=lambda x: x[1])
            
            # %70 zayıf noktalar (21 soru)
            weak_questions_count = int(30 * 0.7)
            weak_questions = [q for q, _ in scored[:weak_questions_count]]
            selected_questions.extend(weak_questions)
            
            # %30 rastgele çeşitlilik (9 soru)
            remaining_questions = [q for q, _ in scored[weak_questions_count:]]
            shuffle(remaining_questions)
            diversity_count = 30 - len(selected_questions)
            selected_questions.extend(remaining_questions[:diversity_count])
        
        # Son kontrol - 30 soru olacak şekilde ayarla
        if len(selected_questions) > 30:
            selected_questions = selected_questions[:30]
        elif len(selected_questions) < 30:
            remaining = [q for q, _ in scored if q not in selected_questions]
            shuffle(remaining)
            selected_questions.extend(remaining[:30 - len(selected_questions)])
        
        print(f"DEBUG: Final selection - Total: {len(selected_questions)}")
        print(f"DEBUG: Final selection - Easy: {len([q for q in selected_questions if q.zorluk <= 2])}")
        print(f"DEBUG: Final selection - Medium: {len([q for q in selected_questions if 3 <= q.zorluk <= 4])}")
        print(f"DEBUG: Final selection - Hard: {len([q for q in selected_questions if q.zorluk >= 5])}")
        print(f"DEBUG: Final selection - Topics: {list(set(q.konu_id for q in selected_questions))}")
        
        for q in selected_questions:
            try:
                q.secenekler = json.loads(q.secenekler) if q.secenekler else {}
            except (json.JSONDecodeError, TypeError) as e:
                print(f"JSON parse error for question {q.soru_id}: {e}")
                q.secenekler = {}
        
        print(f"DEBUG: Successfully returning {len(selected_questions)} questions")
        return selected_questions
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Unexpected error in get_batch_questions: {e}")
        print(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail="Soru yükleme sırasında bir hata oluştu.")
