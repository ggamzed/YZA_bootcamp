#!/usr/bin/env python3
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app.models import User
from app.auth_def import hash_password

def create_demo_user():
    db = SessionLocal()
    try:
        # Demo kullanıcısı var mı kontrol et
        existing_user = db.query(User).filter(User.email == "demo@example.com").first()
        if existing_user:
            print("Demo kullanıcısı zaten mevcut!")
            return
        
        # Demo kullanıcısı oluştur
        hashed_password = hash_password("demo123")
        demo_user = User(
            email="demo@example.com",
            username="Demo User",
            hashed_password=hashed_password
        )
        
        db.add(demo_user)
        db.commit()
        print("Demo kullanıcısı başarıyla oluşturuldu!")
        print("Email: demo@example.com")
        print("Şifre: demo123")
        
    except Exception as e:
        print(f"Hata: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_demo_user() 