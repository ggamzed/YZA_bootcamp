from app.core.models import User
from sqlalchemy.orm import Session
from app.services.auth_def import hash_password, verify_password
import secrets
from datetime import datetime, timedelta

def get_user_by_email(db: Session, email: str):
    return db.query(User).filter_by(email=email).first()

def get_user_by_username(db: Session, username: str):
    return db.query(User).filter_by(username=username).first()

def create_user(db: Session, user_data):
    hashed = hash_password(user_data.password)
    
    # Parse birth_date if provided
    birth_date = None
    if user_data.birth_date:
        try:
            birth_date = datetime.fromisoformat(user_data.birth_date.replace('Z', '+00:00'))
        except ValueError:
            birth_date = None
    
    user = User(
        email=user_data.email, 
        username=user_data.username,
        first_name=user_data.first_name,
        last_name=user_data.last_name,
        birth_date=birth_date,
        hashed_password=hashed,
        created_at=datetime.utcnow()
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

def authenticate_user(db: Session, email: str, password: str):
    user = get_user_by_email(db, email)
    if not user or not verify_password(password, user.hashed_password):
        return None
    return user

def create_reset_token(db: Session, email: str):
    user = get_user_by_email(db, email)
    if not user:
        return None
    
    # Generate reset token
    reset_token = secrets.token_urlsafe(32)
    reset_token_expires = datetime.utcnow() + timedelta(hours=1)  # 1 hour expiry
    
    user.reset_token = reset_token
    user.reset_token_expires = reset_token_expires
    db.commit()
    
    return reset_token

def verify_reset_token(db: Session, token: str):
    user = db.query(User).filter(
        User.reset_token == token,
        User.reset_token_expires > datetime.utcnow()
    ).first()
    return user

def reset_password(db: Session, token: str, new_password: str):
    user = verify_reset_token(db, token)
    if not user:
        return False
    
    user.hashed_password = hash_password(new_password)
    user.reset_token = None
    user.reset_token_expires = None
    db.commit()
    return True
