from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from datetime import datetime, timezone, timedelta
import traceback
from jose import JWTError
from app.auth_def import decode_token
from app.database import get_db
from app.models import Submission
from app.simple_ai_model import SimpleAIModel
from app.schemas import AnswerIn, PredictIn

router = APIRouter(prefix="/answers", tags=["answers"])
bearer = HTTPBearer()
model = SimpleAIModel()

@router.post("/predict")
def predict_answer(predict_data: PredictIn, creds: HTTPAuthorizationCredentials = Depends(bearer), db: Session = Depends(get_db)):
    print(f"DEBUG: Starting predict answer for user {predict_data.user_id}")
    
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
        X = {
            "ders_id": predict_data.ders_id,
            "konu_id": predict_data.konu_id,
            "altbaslik_id": predict_data.altbaslik_id,
            "zorluk": predict_data.zorluk,
            "user_id": user_id
        }
        
        print(f"DEBUG: Making prediction with data: {X}")
        prediction_probability = model.predict(X)

        prediction_percentage = round(prediction_probability * 100)

        is_correct = getattr(predict_data, 'is_correct', None)

        if is_correct is not None:
            print(f"DEBUG: Updating AI model with result: {is_correct}")
            try:
                model.update(X, is_correct)
                print(f"DEBUG: AI model updated successfully")
            except Exception as e:
                print(f"AI model update error: {e}")
                print(f"Traceback: {traceback.format_exc()}")
        
        motivational_message = generate_motivational_message(prediction_percentage, is_correct)
        
        print(f"DEBUG: Prediction completed - probability: {prediction_percentage}%, is_correct: {is_correct}")
        
        return {
            "prediction_percentage": prediction_percentage,
            "motivational_message": motivational_message,
            "confidence_level": get_confidence_level(prediction_percentage)
        }
        
    except Exception as e:
        print(f"Unexpected error in predict answer: {e}")
        print(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail="Tahmin yapılırken bir hata oluştu.")

def generate_motivational_message(prediction_percentage, is_correct=None):
    """Tahmin yüzdesine ve sonuca göre motivasyonel mesaj oluştur"""
    
    if is_correct is None:
        if prediction_percentage >= 80:
            return {
                "title": "🎯 Çok Yüksek Seviye!",
                "message": f"Bu soruyu çözme ihtimalin çok yüksek! Sen bu konuda gerçekten çok iyisin. Bu soru senin için çok kolay olmalı.",
                "type": "excellent",
                "emoji": "🚀",
                "level": "Çok Yüksek"
            }
        elif prediction_percentage >= 65:
            return {
                "title": "💪 Yüksek Seviye!",
                "message": f"Bu soruyu çözme ihtimalin yüksek. Bu konuda oldukça iyisin. Odaklan ve başar!",
                "type": "strong",
                "emoji": "💪",
                "level": "Yüksek"
            }
        elif prediction_percentage >= 50:
            return {
                "title": "👍 Ortalama Seviye",
                "message": f"Bu soruyu çözme ihtimalin ortalama. Bu konuda iyi durumdasın. Dikkatli ol ve başaracaksın!",
                "type": "good",
                "emoji": "👍",
                "level": "Ortalama"
            }
        elif prediction_percentage >= 35:
            return {
                "title": "🤔 Düşük Seviye",
                "message": f"Bu soruyu çözme ihtimalin düşük. Bu konuda biraz daha pratik yapman gerekebilir. Endişelenme, her soru seni daha iyiye götürür!",
                "type": "medium",
                "emoji": "🤔",
                "level": "Düşük"
            }
        else:
            return {
                "title": "📚 Çok Düşük Seviye",
                "message": f"Bu soruyu çözme ihtimalin çok düşük. Bu konu senin için zorlayıcı olabilir. Ama unutma, her zorluk seni daha güçlü yapar!",
                "type": "challenging",
                "emoji": "📚",
                "level": "Çok Düşük"
            }
    
    if is_correct:
        if prediction_percentage >= 80:
            return {
                "title": "🎯 Mükemmel!",
                "message": f"Tahminimiz doğruydu! %{prediction_percentage} ihtimalle başaracağını düşünmüştük ve sen gerçekten başardın! Bu konuda gerçekten çok iyisin.",
                "type": "excellent",
                "emoji": "🎉",
                "level": "Çok Yüksek"
            }
        elif prediction_percentage >= 65:
            return {
                "title": "💪 Harika!",
                "message": f"Yüksek ihtimalle başaracağını düşünmüştük (%{prediction_percentage}) ve sen başardın! Bu konuda gerçekten iyisin.",
                "type": "strong",
                "emoji": "💪",
                "level": "Yüksek"
            }
        elif prediction_percentage >= 50:
            return {
                "title": "👍 Güzel!",
                "message": f"Ortalama ihtimalle başaracağını düşünmüştük (%{prediction_percentage}) ve sen başardın! Bu konuda iyi durumdasın.",
                "type": "good",
                "emoji": "👍",
                "level": "Ortalama"
            }
        elif prediction_percentage >= 35:
            return {
                "title": "🤔 Süpriz!",
                "message": f"Düşük ihtimalle başaracağını düşünmüştük (%{prediction_percentage}) ama sen başardın! Bu konuda potansiyelin var.",
                "type": "medium",
                "emoji": "🤔",
                "level": "Düşük"
            }
        else:
            return {
                "title": "📚 Muhteşem!",
                "message": f"Çok düşük ihtimalle başaracağını düşünmüştük (%{prediction_percentage}) ama sen başardın! Bu konuda gerçekten gelişiyorsun!",
                "type": "challenging",
                "emoji": "📚",
                "level": "Çok Düşük"
            }
    else:
        if prediction_percentage >= 80:
            return {
                "title": "😅 Beklenmedik!",
                "message": f"Çok yüksek ihtimalle başaracağını düşünmüştük (%{prediction_percentage}) ama bu sefer olmadı. Endişelenme, herkes hata yapar. Bu konuda hala çok iyisin!",
                "type": "excellent",
                "emoji": "😅",
                "level": "Çok Yüksek"
            }
        elif prediction_percentage >= 65:
            return {
                "title": "💪 Endişelenme!",
                "message": f"Yüksek ihtimalle başaracağını düşünmüştük (%{prediction_percentage}) ama bu sefer olmadı. Bu konuda hala iyisin, sadece dikkatli olman gerekiyor.",
                "type": "strong",
                "emoji": "💪",
                "level": "Yüksek"
            }
        elif prediction_percentage >= 50:
            return {
                "title": "🤔 Normal!",
                "message": f"Ortalama ihtimalle başaracağını düşünmüştük (%{prediction_percentage}) ve bu sefer olmadı. Bu konuda biraz daha pratik yapman gerekebilir.",
                "type": "good",
                "emoji": "🤔",
                "level": "Ortalama"
            }
        elif prediction_percentage >= 35:
            return {
                "title": "📚 Beklenen!",
                "message": f"Düşük ihtimalle başaracağını düşünmüştük (%{prediction_percentage}) ve bu sefer olmadı. Bu konuda daha fazla çalışman gerekiyor. Endişelenme, her zorluk seni daha güçlü yapar!",
                "type": "medium",
                "emoji": "📚",
                "level": "Düşük"
            }
        else:
            return {
                "title": "📚 Zorlayıcı!",
                "message": f"Çok düşük ihtimalle başaracağını düşünmüştük (%{prediction_percentage}) ve bu sefer olmadı. Bu konu senin için gerçekten zorlayıcı. Ama unutma, her başarısızlık başarıya giden yoldur!",
                "type": "challenging",
                "emoji": "📚",
                "level": "Çok Düşük"
            }

def get_confidence_level(prediction_percentage):
    """Tahmin güvenilirlik seviyesini belirle"""
    if prediction_percentage >= 80 or prediction_percentage <= 20:
        return "high"
    elif prediction_percentage >= 65 or prediction_percentage <= 35:
        return "medium"
    else:
        return "low"

@router.post("/submit")
def submit(answer: AnswerIn, creds: HTTPAuthorizationCredentials = Depends(bearer), db: Session = Depends(get_db)):
    print(f"DEBUG: Starting submit answer for question {answer.soru_id}")
    
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
        print(f"DEBUG: Processing answer - selected: {answer.selected}, is_correct: {answer.is_correct}, is_skipped: {answer.is_skipped}")
        
        if not answer.is_skipped and answer.selected and answer.is_correct is not None:
            try:
                X = {
                    "ders_id": answer.ders_id,
                    "konu_id": answer.konu_id,
                    "altbaslik_id": answer.altbaslik_id,
                    "zorluk": answer.zorluk,
                    "user_id": user_id
                }
                print(f"DEBUG: Updating AI model with data: {X}")
                model.update(X, answer.is_correct)
                print(f"DEBUG: AI model updated successfully")
            except Exception as e:
                print(f"AI model update error: {e}")
                print(f"Traceback: {traceback.format_exc()}")
        
        print(f"DEBUG: Saving to database")
        sub = Submission(
            user_id=user_id,
            question_id=answer.soru_id,
            selected=answer.selected,
            is_correct=answer.is_correct,
            is_skipped=answer.is_skipped,
            answered_at=datetime.now(timezone(timedelta(hours=3)))
        )
        db.add(sub)
        db.commit()
        
        print(f"DEBUG: Answer saved successfully")
        return {"message": "OK"}
        
    except Exception as e:
        print(f"Unexpected error in submit answer: {e}")
        print(f"Traceback: {traceback.format_exc()}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Cevap kaydedilirken bir hata oluştu.")
