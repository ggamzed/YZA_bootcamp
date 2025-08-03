from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from datetime import datetime, timezone, timedelta
import traceback
from jose import JWTError
from app.services.auth_def import decode_token
from app.core.database import get_db
from app.core.models import Submission
from app.services.simple_ai_model import SimpleAIModel
from app.services.enhanced_ml_model import EnhancedPracticeModel
from app.core.schemas import AnswerIn, PredictIn

router = APIRouter(prefix="/answers", tags=["answers"])
bearer = HTTPBearer()
simple_model = SimpleAIModel()
enhanced_model = EnhancedPracticeModel()

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
        
        # Her iki modelden tahmin al
        simple_prediction = get_simple_model_prediction(user_id, X)
        enhanced_prediction = get_enhanced_model_prediction(user_id, X)
        
        # Tahminleri birleştir (ağırlıklı ortalama)
        prediction_percentage = combine_predictions(simple_prediction, enhanced_prediction, user_id, X)
        
        is_correct = getattr(predict_data, 'is_correct', None)

        if is_correct is not None:
            print(f"DEBUG: Updating both AI models with result: {is_correct}")
            try:
                # Her iki modeli güncelle
                simple_model.update(X, is_correct)
                enhanced_model.update(X, is_correct)
                print(f"DEBUG: Both AI models updated successfully")
            except Exception as e:
                print(f"AI model update error: {e}")
                print(f"Traceback: {traceback.format_exc()}")
        
        motivational_message = generate_motivational_message(prediction_percentage, is_correct)
        
        print(f"DEBUG: Prediction completed - simple: {simple_prediction}%, enhanced: {enhanced_prediction}%, combined: {prediction_percentage}%")
        
        return {
            "prediction_percentage": prediction_percentage,
            "simple_prediction": simple_prediction,
            "enhanced_prediction": enhanced_prediction,
            "motivational_message": motivational_message,
            "confidence_level": get_confidence_level(prediction_percentage)
        }
        
    except Exception as e:
        print(f"Unexpected error in predict answer: {e}")
        print(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail="Tahmin yapılırken bir hata oluştu.")

def get_simple_model_prediction(user_id, X):
    """Simple AI Model'den tahmin al"""
    try:
        # Simple AI Model'in predict metodunu kullan
        prediction = simple_model.predict(X)
        # prediction zaten 0-1 arası, 100 ile çarp
        return round(prediction * 100)  # Yüzdeye çevir
    except Exception as e:
        print(f"Simple model prediction error: {e}")
        return 50  # Varsayılan değer

def get_enhanced_model_prediction(user_id, X):
    """Enhanced ML Model'den tahmin al"""
    try:
        # Enhanced model için veri formatını hazırla
        enhanced_X = {
            'ders_id': X['ders_id'],
            'konu_id': X['konu_id'],
            'altbaslik_id': X['altbaslik_id'],
            'zorluk': X['zorluk'],
            'user_id': X['user_id']
        }
        
        # Enhanced model tahmin yap
        prediction = enhanced_model.predict(enhanced_X)
        return round(prediction * 100)  # Yüzdeye çevir
    except Exception as e:
        print(f"Enhanced model prediction error: {e}")
        return 50  # Varsayılan değer

def combine_predictions(simple_pred, enhanced_pred, user_id, X):
    """Gelişmiş tahmin birleştirme algoritması"""
    try:
        # Kullanıcının soru sayısına göre dinamik ağırlık
        user_data = simple_model.user_stats.get(user_id, {})
        total_questions = user_data.get('total_questions', 0)
        
        # Zorluk seviyesine göre ağırlık ayarlama
        zorluk = X.get('zorluk', 3)
        
        if total_questions < 10:
            # İlk 10 soruda Simple model daha güvenilir
            simple_weight = 0.7
            enhanced_weight = 0.3
        elif total_questions < 30:
            # 10-30 arası eşit ağırlık
            simple_weight = 0.5
            enhanced_weight = 0.5
        else:
            # 30+ soruda Enhanced model daha güvenilir
            simple_weight = 0.3
            enhanced_weight = 0.7
        
        # Zorluk bazlı ek düzeltme
        if zorluk <= 2:  # Kolay sorular
            simple_weight += 0.1
            enhanced_weight -= 0.1
        elif zorluk >= 5:  # Zor sorular
            simple_weight -= 0.1
            enhanced_weight += 0.1
        
        # Ağırlıkları normalize et
        total_weight = simple_weight + enhanced_weight
        simple_weight /= total_weight
        enhanced_weight /= total_weight
        
        # Birleştirilmiş tahmin (simple_pred ve enhanced_pred zaten yüzde değeri)
        combined_pred = (simple_pred * simple_weight) + (enhanced_pred * enhanced_weight)
        
        # Konu bazlı düzeltme faktörü
        konu_id = X.get('konu_id', 1)
        konu_factor = 1.0
        
        # Konu bazlı performans düzeltmesi (opsiyonel)
        if user_id in simple_model.user_stats:
            user_data = simple_model.user_stats[user_id]
            topic_key = (X.get('ders_id', 1), konu_id)
            topic_data = user_data.get('topic_performance', {}).get(topic_key, {})
            
            if topic_data.get('total', 0) > 5:
                topic_accuracy = topic_data.get('correct', 0) / topic_data.get('total', 1)
                # Konu performansına göre küçük düzeltme
                if topic_accuracy < 0.3:
                    konu_factor = 0.95  # Zayıf konularda %5 azalış
                elif topic_accuracy > 0.7:
                    konu_factor = 1.05  # Güçlü konularda %5 artış
        
        # Final tahmin (yüzde değeri olarak)
        final_pred = combined_pred * konu_factor
        
        # 0-100 arasında sınırla
        final_pred = max(0, min(100, final_pred))
        
        return round(final_pred)
        
    except Exception as e:
        print(f"Tahmin birleştirme hatası: {e}")
        # Hata durumunda basit ortalama
        return round((simple_pred + enhanced_pred) / 2)

def calculate_prediction_based_on_weak_topics(user_data, X):
    
    ders_id = X['ders_id']
    konu_id = X['konu_id']
    zorluk = X['zorluk']
    
    topic_key = (ders_id, konu_id)
    topic_data = user_data['topic_performance'].get(topic_key, {'total': 0, 'correct': 0})
    
    if topic_data['total'] == 0:
        return 50
    
    topic_accuracy = topic_data['correct'] / topic_data['total']
    
    difficulty_data = user_data['difficulty_performance'].get(zorluk, {'total': 0, 'correct': 0})
    if difficulty_data['total'] == 0:
        difficulty_accuracy = 0.5
    else:
        difficulty_accuracy = difficulty_data['correct'] / difficulty_data['total']
    
    overall_accuracy = 0.5
    if user_data['total_questions'] > 0:
        overall_accuracy = user_data['correct_answers'] / user_data['total_questions']
    
    recent_accuracy = 0.5
    if len(user_data['recent_performance']) > 0:
        recent_accuracy = sum(user_data['recent_performance']) / len(user_data['recent_performance'])
    
    weights = {
        'topic': 0.5,
        'difficulty': 0.2,
        'overall': 0.15,
        'recent': 0.15
    }
    
    weighted_prediction = (
        topic_accuracy * weights['topic'] +
        difficulty_accuracy * weights['difficulty'] +
        overall_accuracy * weights['overall'] +
        recent_accuracy * weights['recent']
    )
    
    prediction_percentage = round(weighted_prediction * 100)
    
    return max(10, min(90, prediction_percentage))

def generate_motivational_message(prediction_percentage, is_correct=None):
    
    if is_correct is None:
        if prediction_percentage >= 80:
            return {
                "title": "🎯 Bu Konuda Çok İyisin!",
                "message": f"Bu konuda gerçekten çok başarılısın! %{prediction_percentage} ihtimalle doğru cevap vereceğini tahmin ediyoruz. Bu konu senin güçlü yanın!",
                "type": "excellent",
                "emoji": "🚀",
                "level": "Çok Yüksek"
            }
        elif prediction_percentage >= 65:
            return {
                "title": "💪 Bu Konuda İyisin!",
                "message": f"Bu konuda iyi durumdasın! %{prediction_percentage} ihtimalle doğru cevap vereceğini tahmin ediyoruz. Odaklan ve başar!",
                "type": "strong",
                "emoji": "💪",
                "level": "Yüksek"
            }
        elif prediction_percentage >= 50:
            return {
                "title": "👍 Bu Konuda Orta Seviyedesin",
                "message": f"Bu konuda orta seviyedesin. %{prediction_percentage} ihtimalle doğru cevap vereceğini tahmin ediyoruz. Biraz daha pratik yaparsan gelişeceksin!",
                "type": "good",
                "emoji": "👍",
                "level": "Ortalama"
            }
        elif prediction_percentage >= 35:
            return {
                "title": "🤔 Bu Konuda Zorlanıyorsun",
                "message": f"Bu konuda biraz zorlanıyorsun. %{prediction_percentage} ihtimalle doğru cevap vereceğini tahmin ediyoruz. Bu konuda daha fazla pratik yapman gerekiyor!",
                "type": "medium",
                "emoji": "🤔",
                "level": "Düşük"
            }
        else:
            return {
                "title": "📚 Bu Konu Senin İçin Zor",
                "message": f"Bu konu senin için zorlayıcı. %{prediction_percentage} ihtimalle doğru cevap vereceğini tahmin ediyoruz. Bu konuda daha fazla çalışman gerekiyor!",
                "type": "challenging",
                "emoji": "📚",
                "level": "Çok Düşük"
            }
    
    if is_correct:
        if prediction_percentage >= 80:
            return {
                "title": "🎯 Mükemmel! Tahminimiz Doğruydu!",
                "message": f"Bu konuda gerçekten çok iyisin! %{prediction_percentage} ihtimalle başaracağını düşünmüştük ve sen başardın! Bu konu senin güçlü yanın!",
                "type": "excellent",
                "emoji": "🎉",
                "level": "Çok Yüksek"
            }
        elif prediction_percentage >= 65:
            return {
                "title": "💪 Harika! Bu Konuda İyisin!",
                "message": f"Bu konuda iyi durumdasın! %{prediction_percentage} ihtimalle başaracağını düşünmüştük ve sen başardın! Bu konu senin güçlü yanın!",
                "type": "strong",
                "emoji": "💪",
                "level": "Yüksek"
            }
        elif prediction_percentage >= 50:
            return {
                "title": "👍 Güzel! Bu Konuda Gelişiyorsun!",
                "message": f"Bu konuda gelişiyorsun! %{prediction_percentage} ihtimalle başaracağını düşünmüştük ve sen başardın! Daha fazla pratik yaparak daha da iyileşebilirsin!",
                "type": "good",
                "emoji": "👍",
                "level": "Ortalama"
            }
        elif prediction_percentage >= 35:
            return {
                "title": "🤔 Süpriz! Bu Konuda Potansiyelin Var!",
                "message": f"Bu konuda potansiyelin var! %{prediction_percentage} ihtimalle başaracağını düşünmüştük ama sen başardın! Bu konuda daha fazla çalışarak gelişebilirsin!",
                "type": "medium",
                "emoji": "🤔",
                "level": "Düşük"
            }
        else:
            return {
                "title": "📚 Muhteşem! Bu Konuda Gerçekten Gelişiyorsun!",
                "message": f"Bu konuda gerçekten gelişiyorsun! %{prediction_percentage} ihtimalle başaracağını düşünmüştük ama sen başardın! Bu konuda daha fazla çalışarak daha da iyileşebilirsin!",
                "type": "challenging",
                "emoji": "📚",
                "level": "Çok Düşük"
            }
    else:
        if prediction_percentage >= 80:
            return {
                "title": "😅 Bu Konuda Biraz Dikkatli Ol!",
                "message": f"Bu konuda genelde çok iyisin ama bu sefer olmadı. %{prediction_percentage} ihtimalle başaracağını düşünmüştük. Bu konuda hala çok iyisin, sadece dikkatli olman gerekiyor!",
                "type": "excellent",
                "emoji": "😅",
                "level": "Çok Yüksek"
            }
        elif prediction_percentage >= 65:
            return {
                "title": "💪 Bu Konuda Biraz Daha Pratik Yap!",
                "message": f"Bu konuda iyi durumdasın ama bu sefer olmadı. %{prediction_percentage} ihtimalle başaracağını düşünmüştük. Bu konuda biraz daha pratik yapman gerekiyor!",
                "type": "strong",
                "emoji": "💪",
                "level": "Yüksek"
            }
        elif prediction_percentage >= 50:
            return {
                "title": "🤔 Bu Konuda Daha Fazla Çalışman Gerekiyor!",
                "message": f"Bu konuda orta seviyedesin ve bu sefer olmadı. %{prediction_percentage} ihtimalle başaracağını düşünmüştük. Bu konuda daha fazla çalışman gerekiyor!",
                "type": "good",
                "emoji": "🤔",
                "level": "Ortalama"
            }
        elif prediction_percentage >= 35:
            return {
                "title": "📚 Bu Konu Senin İçin Zor, Daha Fazla Çalış!",
                "message": f"Bu konu senin için zorlayıcı ve bu sefer olmadı. %{prediction_percentage} ihtimalle başaracağını düşünmüştük. Bu konuda çok daha fazla çalışman gerekiyor!",
                "type": "medium",
                "emoji": "📚",
                "level": "Düşük"
            }
        else:
            return {
                "title": "📚 Bu Konu Senin İçin Çok Zor, Temel Konulara Odaklan!",
                "message": f"Bu konu senin için çok zorlayıcı ve bu sefer olmadı. %{prediction_percentage} ihtimalle başaracağını düşünmüştük. Bu konuda temel konulara odaklanarak daha fazla çalışman gerekiyor!",
                "type": "challenging",
                "emoji": "📚",
                "level": "Çok Düşük"
            }

def get_confidence_level(prediction_percentage):
    if prediction_percentage >= 80 or prediction_percentage <= 20:
        return "high"
    elif prediction_percentage >= 65 or prediction_percentage <= 35:
        return "medium"
    else:
        return "low"

@router.post("/submit")
def submit(answer: AnswerIn, creds: HTTPAuthorizationCredentials = Depends(bearer), db: Session = Depends(get_db)):
    try:
        user_id = int(decode_token(creds.credentials).get("sub"))
    except JWTError:
        raise HTTPException(status_code=401, detail="Geçersiz token.")
    except (ValueError, TypeError):
        raise HTTPException(status_code=401, detail="Geçersiz token formatı.")
    
    try:
        submission = Submission(
            user_id=user_id,
            question_id=answer.soru_id,
            selected=answer.selected,
            is_correct=answer.is_correct,
            test_session_id=answer.test_session_id,
            answered_at=datetime.now(timezone(timedelta(hours=3)))
        )
        
        db.add(submission)
        db.commit()
        db.refresh(submission)
        
        # AI model güncellemesi
        try:
            X = {
                "ders_id": answer.ders_id,
                "konu_id": answer.konu_id,
                "altbaslik_id": answer.altbaslik_id,
                "zorluk": answer.zorluk,
                "user_id": user_id
            }
            simple_model.update(X, answer.is_correct)
            enhanced_model.update(X, answer.is_correct)
        except Exception as e:
            print(f"AI model güncelleme hatası: {e}")
        
        return {"message": "Cevap başarıyla kaydedildi", "submission_id": submission.id}
        
    except Exception as e:
        db.rollback()
        print(f"Cevap kaydetme hatası: {e}")
        raise HTTPException(status_code=500, detail="Cevap kaydedilirken bir hata oluştu.")

@router.get("/user-stats")
def get_user_stats(creds: HTTPAuthorizationCredentials = Depends(bearer)):
    """Kullanıcının AI model istatistiklerini getir"""
    try:
        user_id = int(decode_token(creds.credentials).get("sub"))
    except JWTError:
        raise HTTPException(status_code=401, detail="Geçersiz token.")
    except (ValueError, TypeError):
        raise HTTPException(status_code=401, detail="Geçersiz token formatı.")
    
    try:
        user_data = simple_model.user_stats[user_id]
        
        # Veri temizleme durumunu hesapla
        total_questions = user_data['total_questions']
        cleanup_threshold = simple_model.data_cleanup_threshold
        cleanup_percentage = simple_model.data_cleanup_percentage
        next_cleanup_at = ((total_questions // cleanup_threshold) + 1) * cleanup_threshold
        questions_until_cleanup = max(0, next_cleanup_at - total_questions)
        
        stats = {
            "total_questions": total_questions,
            "correct_answers": user_data['correct_answers'],
            "overall_accuracy": user_data['correct_answers'] / total_questions if total_questions > 0 else 0,
            "cleanup_threshold": cleanup_threshold,
            "cleanup_percentage": cleanup_percentage * 100,  # Yüzde olarak
            "questions_until_cleanup": questions_until_cleanup,
            "next_cleanup_at": next_cleanup_at,
            "will_cleanup_soon": questions_until_cleanup <= 50,  # 50 soru kala uyarı
            "last_activity": user_data['last_activity'].isoformat() if user_data['last_activity'] else None,
            "recent_performance_count": len(user_data['recent_performance']),
            "recent_accuracy": sum(user_data['recent_performance']) / len(user_data['recent_performance']) if user_data['recent_performance'] else 0,
            "last_cleanup_at": user_data.get('last_cleanup_at', 0)
        }
        
        return stats
        
    except Exception as e:
        print(f"Kullanıcı istatistikleri getirme hatası: {e}")
        raise HTTPException(status_code=500, detail="İstatistikler alınırken bir hata oluştu.")

@router.post("/manual-cleanup")
def manual_cleanup(creds: HTTPAuthorizationCredentials = Depends(bearer)):
    """Manuel veri temizleme (sadece test amaçlı)"""
    try:
        user_id = int(decode_token(creds.credentials).get("sub"))
    except JWTError:
        raise HTTPException(status_code=401, detail="Geçersiz token.")
    except (ValueError, TypeError):
        raise HTTPException(status_code=401, detail="Geçersiz token formatı.")
    
    try:
        # Veri temizleme işlemini manuel olarak tetikle
        simple_model.cleanup_old_data(user_id)
        
        user_data = simple_model.user_stats[user_id]
        
        return {
            "message": "Veri temizleme işlemi tamamlandı",
            "remaining_questions": user_data['total_questions'],
            "overall_accuracy": user_data['correct_answers'] / user_data['total_questions'] if user_data['total_questions'] > 0 else 0
        }
        
    except Exception as e:
        print(f"Manuel veri temizleme hatası: {e}")
        raise HTTPException(status_code=500, detail="Veri temizleme işlemi başarısız oldu.")

@router.get("/total-questions")
def get_total_questions(creds: HTTPAuthorizationCredentials = Depends(bearer), db: Session = Depends(get_db)):
    """Kullanıcının toplam çözdüğü soru sayısını getir"""
    try:
        user_id = int(decode_token(creds.credentials).get("sub"))
    except JWTError:
        raise HTTPException(status_code=401, detail="Geçersiz token.")
    except (ValueError, TypeError):
        raise HTTPException(status_code=401, detail="Geçersiz token formatı.")
    
    try:
        total_questions = db.query(Submission.id).filter(Submission.user_id == user_id).count()
        
        return {
            "total_questions": total_questions,
            "ai_enabled": total_questions >= 30
        }
        
    except Exception as e:
        print(f"Toplam soru sayısı getirme hatası: {e}")
        raise HTTPException(status_code=500, detail="Soru sayısı alınırken bir hata oluştu.")

@router.get("/total-questions-by-subject")
def get_total_questions_by_subject(creds: HTTPAuthorizationCredentials = Depends(bearer), db: Session = Depends(get_db)):
    """Her ders için ayrı ayrı çözülen soru sayısını getir"""
    try:
        user_id = int(decode_token(creds.credentials).get("sub"))
    except JWTError:
        raise HTTPException(status_code=401, detail="Geçersiz token.")
    except (ValueError, TypeError):
        raise HTTPException(status_code=401, detail="Geçersiz token formatı.")
    
    try:
        # Her ders için ayrı ayrı soru sayısını hesapla
        from app.core.models import Questions
        
        results = (
            db.query(Questions.ders_id, Submission.id)
            .join(Submission, Submission.question_id == Questions.soru_id)
            .filter(Submission.user_id == user_id)
            .all()
        )
        
        subject_counts = {}
        for ders_id, submission_id in results:
            if ders_id not in subject_counts:
                subject_counts[ders_id] = 0
            subject_counts[ders_id] += 1
        
        # Her ders için AI aktiflik durumunu kontrol et
        subject_ai_status = {}
        for ders_id, count in subject_counts.items():
            subject_ai_status[ders_id] = {
                "total_questions": count,
                "ai_enabled": count >= 30
            }
        
        return subject_ai_status
        
    except Exception as e:
        print(f"Ders bazlı soru sayısı getirme hatası: {e}")
        raise HTTPException(status_code=500, detail="Ders bazlı soru sayısı alınırken bir hata oluştu.")
