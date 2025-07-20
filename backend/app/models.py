# backend/app/models.py
from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime
from backend.app.database import Base

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
    tags = Column(String)
    altbaslik_id = Column(Integer)
    gorsel_url = Column(String, nullable=True)
    zorluk = Column(Integer)
    soru_metin = Column(String, nullable=False)
    choice_a = Column(String, nullable=False)
    choice_b = Column(String, nullable=False)
    choice_c = Column(String, nullable=False)
    choice_d = Column(String, nullable=False)
    choice_e = Column(String, nullable=False)
    correct_choice = Column(String(1), nullable=False)

class Submission(Base):
    __tablename__ = "submissions"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    question_id = Column(Integer, ForeignKey("questions.soru_id"))
    selected = Column(String(1))
    is_correct = Column(Boolean)
    answered_at = Column(DateTime)