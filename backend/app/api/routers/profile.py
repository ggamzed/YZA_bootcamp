import random
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from datetime import datetime, timezone, timedelta
from jose import JWTError

from app.services import crud
from app.core import schemas, models
from app.core.database import get_db
from app.services.auth_def import decode_token

router = APIRouter(prefix="/profile", tags=["profile"])
bearer = HTTPBearer()

TURKEY_TIMEZONE = timezone(timedelta(hours=3))

profile_pictures = [
    "kurbaga.jpeg",
    "gs.jpeg", 
    "arı.jpeg",
    "fil.jpeg",

]

@router.get("/level")
def get_user_level(
    creds: HTTPAuthorizationCredentials = Depends(bearer),
    db: Session = Depends(get_db)
):
    try:
        payload = decode_token(creds.credentials)
        user_id = int(payload.get("sub"))
    except JWTError:
        raise HTTPException(status_code=401, detail="Geçersiz token.")

    try:
        # Sadece id sütununu kullan
        total_questions = db.query(models.Submission.id).filter(models.Submission.user_id == user_id).count()
        
        if total_questions <= 450:
            level_id = 1
            level = "🐘 Tembel Fil"
        elif total_questions <= 900:
            level_id = 2
            level = "🐜 Hızlı Karınca"
        elif total_questions <= 1200:
            level_id = 3
            level = "🦗 Zıplayan Çekirge"
        else:
            level_id = 4
            level = "🐝 Çalışkan Arı"
        
        return {
            "level_info": {
                "level_id": level_id,
                "level": level,
                "total_questions": total_questions
            }
        }
        
    except Exception as e:
        print(f"Kullanıcı seviyesi hesaplama hatası: {e}")
        raise HTTPException(status_code=500, detail="Kullanıcı seviyesi hesaplanırken hata oluştu")

@router.put("/picture")
def update_profile_picture(
    picture_name: str,
    creds: HTTPAuthorizationCredentials = Depends(bearer),
    db: Session = Depends(get_db)
):
    try:
        payload = decode_token(creds.credentials)
        user_id = int(payload.get("sub"))
    except JWTError:
        raise HTTPException(status_code=401, detail="Geçersiz token.")

    if picture_name not in profile_pictures:
        raise HTTPException(status_code=400, detail="Geçersiz profil resmi")

    try:
        user = db.query(models.User).filter(models.User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı")
        
        user.profile_picture = picture_name
        db.commit()
        
        return {"message": "Profil resmi güncellendi", "profile_picture": picture_name}
        
    except Exception as e:
        print(f"Profil resmi güncelleme hatası: {e}")
        raise HTTPException(status_code=500, detail="Profil resmi güncellenirken hata oluştu")

@router.get("/pictures")
def get_profile_pictures():
    return {"profile_pictures": profile_pictures}

@router.post("/picture/random")
def set_random_profile_picture(
    creds: HTTPAuthorizationCredentials = Depends(bearer),
    db: Session = Depends(get_db)
):
    try:
        payload = decode_token(creds.credentials)
        user_id = int(payload.get("sub"))
    except JWTError:
        raise HTTPException(status_code=401, detail="Geçersiz token.")

    try:
        user = db.query(models.User).filter(models.User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı")
        
        # Rastgele bir profil resmi seç
        random_picture = random.choice(profile_pictures)
        user.profile_picture = random_picture
        db.commit()
        
        return {"message": "Rastgele profil resmi atandı", "profile_picture": random_picture}
        
    except Exception as e:
        print(f"Rastgele profil resmi atama hatası: {e}")
        raise HTTPException(status_code=500, detail="Rastgele profil resmi atanırken hata oluştu") 