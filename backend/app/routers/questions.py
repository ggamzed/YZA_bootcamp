from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from random import shuffle
import json
import traceback
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
        
        answered_questions = db.query(Submission.question_id).filter(
            Submission.user_id == user_id
        ).subquery()
        
        print(f"DEBUG: Found answered questions subquery")

        total = db.query(Submission).filter(Submission.user_id == user_id).count()
        wrong = db.query(Submission).filter(
            Submission.user_id == user_id, 
            Submission.is_correct == False
        ).count()
        ratio = wrong / total if total else 0
        targeted_percent = 0.8 if ratio >= 0.6 else 0.6 if ratio >= 0.3 else 0.4
        
        print(f"DEBUG: Performance analysis - total: {total}, wrong: {wrong}, ratio: {ratio}")

        query = db.query(Questions).filter(
            Questions.ders_id == ders_id,
            ~Questions.soru_id.in_(answered_questions)
        )
        
        if etiket:
            query = query.filter(Questions.etiket.ilike(f"%{etiket.lower()}%"))
        
        qs = query.all()
        
        print(f"DEBUG: Found {len(qs)} questions for ders_id={ders_id}, etiket={etiket}")
        
        if len(qs) < 5:
            print(f"DEBUG: Not enough unanswered questions ({len(qs)}), showing all questions")
            query = db.query(Questions).filter(Questions.ders_id == ders_id)
            if etiket:
                query = query.filter(Questions.etiket.ilike(f"%{etiket.lower()}%"))
            qs = query.all()
            
            if len(qs) < 5:
                print(f"ERROR: Not enough questions found. Total: {len(qs)}")
                raise HTTPException(status_code=400, detail=f"Ders ID {ders_id} için yeterli soru bulunamadı. Toplam {len(qs)} soru mevcut.")

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

        scored.sort(key=lambda tup: tup[1])

        if ratio >= 0.6:
            easy_questions = [q for q, _ in scored if q.zorluk <= 2]
            if len(easy_questions) >= 5:
                print(f"DEBUG: Using {len(easy_questions[:5])} easy questions for weak performance")
                for q in easy_questions[:5]:
                    try:
                        q.secenekler = json.loads(q.secenekler) if q.secenekler else {}
                    except (json.JSONDecodeError, TypeError) as e:
                        print(f"JSON parse error for question {q.soru_id}: {e}")
                        q.secenekler = {}
                return easy_questions[:5]
        
        selected_questions = [q for q, _ in scored[:5]]
        print(f"DEBUG: Returning {len(selected_questions)} questions based on AI scores")
        
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
