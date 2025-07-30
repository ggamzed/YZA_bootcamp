# backend/app/models.py
from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime
from app.database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    username = Column(String)
    role = Column(String)
    hashed_password = Column(String)

class Questions(Base):
    __tablename__ = "questions"
    soru_id = Column(Integer, primary_key=True, index=True)
    ders_id = Column(Integer)
    konu_id = Column(Integer)
    altbaslik_id = Column(Integer)
    soru_metin = Column(String)
    secenekler = Column(String)
    dogru_cevap = Column(String)
    dogru_cevap_aciklamasi = Column(String)
    zorluk = Column(Integer)
    etiket = Column(String)

class Submission(Base):
    __tablename__ = "submissions"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    question_id = Column(Integer, ForeignKey("questions.soru_id"))
    selected = Column(String, nullable=True)  # Boş bırakılabilir
    is_correct = Column(Boolean, nullable=True)  # Boş bırakıldığında None olabilir
    is_skipped = Column(Boolean, default=False)  # Yeni alan: soru atlandı mı?
    answered_at = Column(DateTime)