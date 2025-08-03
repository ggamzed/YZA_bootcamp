from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.services import crud
from app.core import schemas, models
from app.services import auth_def as auth
from app.core.database import get_db
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from datetime import datetime

router = APIRouter(prefix="/auth", tags=["auth"])

bearer_scheme = HTTPBearer()

@router.post("/register")
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    if crud.get_user_by_email(db, user.email):
        raise HTTPException(status_code=400, detail="Bu e-posta adresi zaten kayıtlı.")
    
    if crud.get_user_by_username(db, user.username):
        raise HTTPException(status_code=400, detail="Bu kullanıcı adı zaten kullanılıyor.")
    
    crud.create_user(db, user)
    return {"message": "Kayıt başarılı!"}

@router.post("/login")
def login(user: schemas.UserLogin, db: Session = Depends(get_db)):
    auth_user = crud.authenticate_user(db, user.email, user.password)
    if not auth_user:
        raise HTTPException(status_code=400, detail="Hatalı giriş.")
    token = auth.create_access_token(data={"sub": str(auth_user.id)})
    print(f"DEBUG: Login successful for user {auth_user.id}, token created")
    return {"access_token": token}

@router.post("/forgot-password")
def forgot_password(request: schemas.ForgotPassword, db: Session = Depends(get_db)):
    reset_token = crud.create_reset_token(db, request.email)
    if not reset_token:
        # Don't reveal if email exists or not for security
        return {"message": "Şifre sıfırlama bağlantısı e-posta adresinize gönderildi."}
    
    # In a real application, you would send an email here
    # For now, we'll just return the token and test URL (in production, this should be sent via email)
    test_url = f"http://localhost:3000/forgot-password?token={reset_token}"
    return {
        "message": "Şifre sıfırlama bağlantısı e-posta adresinize gönderildi.",
        "reset_token": reset_token,  # Remove this in production
        "test_url": test_url  # Remove this in production - Test için kullanıcı bu URL'yi kullanabilir
    }

@router.post("/reset-password")
def reset_password(request: schemas.ResetPassword, db: Session = Depends(get_db)):
    success = crud.reset_password(db, request.token, request.new_password)
    if not success:
        raise HTTPException(status_code=400, detail="Geçersiz veya süresi dolmuş token.")
    return {"message": "Şifre başarıyla sıfırlandı."}

@router.get("/me", response_model=schemas.UserOut)
def read_users_me(credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme), db: Session = Depends(get_db)):
    payload = auth.decode_token(credentials.credentials)
    user_id = int(payload.get("sub"))
    print(f"DEBUG: /me endpoint called for user_id: {user_id}")
    user = db.query(models.User).get(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Kullanıcı yok.")
        print(f"DEBUG: User found: {user.username}, show_profile: {user.show_profile}, show_stats: {user.show_stats}, hide_ai_recommendations: {user.hide_ai_recommendations}")
    return user

@router.put("/update-profile")
def update_profile(
    profile_data: schemas.ProfileUpdate, 
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme), 
    db: Session = Depends(get_db)
):
    """Kullanıcı profil bilgilerini güncelle"""
    try:
        payload = auth.decode_token(credentials.credentials)
        user_id = int(payload.get("sub"))
        
        # Kullanıcıyı bul
        user = db.query(models.User).get(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı.")
        
        # E-posta değişikliği varsa kontrol et
        if profile_data.email and profile_data.email != user.email:
            existing_user = crud.get_user_by_email(db, profile_data.email)
            if existing_user and existing_user.id != user_id:
                raise HTTPException(status_code=400, detail="Bu e-posta adresi başka bir kullanıcı tarafından kullanılıyor.")
        
        # Kullanıcı adı değişikliği varsa kontrol et
        if profile_data.username and profile_data.username != user.username:
            existing_user = crud.get_user_by_username(db, profile_data.username)
            if existing_user and existing_user.id != user_id:
                raise HTTPException(status_code=400, detail="Bu kullanıcı adı başka bir kullanıcı tarafından kullanılıyor.")
        
        # Bilgileri güncelle
        if profile_data.username:
            user.username = profile_data.username
        if profile_data.email:
            user.email = profile_data.email
        if profile_data.first_name is not None:
            user.first_name = profile_data.first_name
        if profile_data.last_name is not None:
            user.last_name = profile_data.last_name
        if profile_data.birth_date:
            try:
                user.birth_date = datetime.fromisoformat(profile_data.birth_date.replace('Z', '+00:00'))
            except ValueError:
                pass  # Invalid date format, skip
        
        db.commit()
        
        print(f"DEBUG: Profile updated for user {user_id}: username={user.username}, email={user.email}")
        
        return {
            "message": "Profil bilgileri başarıyla güncellendi.",
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "birth_date": user.birth_date.isoformat() if user.birth_date else None
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"ERROR: Profile update failed: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Profil güncellenirken bir hata oluştu.")

@router.post("/change-password")
def change_password(
    password_data: schemas.ChangePassword, 
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme), 
    db: Session = Depends(get_db)
):
    """Kullanıcı şifresini değiştir"""
    try:
        payload = auth.decode_token(credentials.credentials)
        user_id = int(payload.get("sub"))
        
        # Kullanıcıyı bul
        user = db.query(models.User).get(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı.")
        
        # Mevcut şifreyi kontrol et
        if not crud.verify_password(password_data.current_password, user.hashed_password):
            raise HTTPException(status_code=400, detail="Mevcut şifre hatalı.")
        
        # Yeni şifreyi hash'le ve kaydet
        user.hashed_password = crud.get_password_hash(password_data.new_password)
        db.commit()
        
        print(f"DEBUG: Password changed for user {user_id}")
        
        return {"message": "Şifre başarıyla değiştirildi."}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"ERROR: Password change failed: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Şifre değiştirilirken bir hata oluştu.")

@router.put("/update-privacy")
def update_privacy_settings(
    privacy_settings: schemas.PrivacySettings, 
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme), 
    db: Session = Depends(get_db)
):
    """Kullanıcı gizlilik ayarlarını güncelle"""
    try:
        payload = auth.decode_token(credentials.credentials)
        user_id = int(payload.get("sub"))
        
        # Kullanıcıyı bul
        user = db.query(models.User).get(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı.")
        
        # Gizlilik ayarlarını güncelle
        user.show_profile = privacy_settings.show_profile
        user.show_stats = privacy_settings.show_stats
        user.hide_ai_recommendations = privacy_settings.hide_ai_recommendations
        
        db.commit()
        
        print(f"DEBUG: Privacy settings updated for user {user_id}: show_profile={user.show_profile}, show_stats={user.show_stats}, hide_ai_recommendations={user.hide_ai_recommendations}")
        
        return {
            "message": "Gizlilik ayarları başarıyla güncellendi.",
            "privacy_settings": {
                "show_profile": user.show_profile,
                "show_stats": user.show_stats,
                "hide_ai_recommendations": user.hide_ai_recommendations
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"ERROR: Privacy settings update failed: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Gizlilik ayarları güncellenirken bir hata oluştu.")
