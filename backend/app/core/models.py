from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime
from app.core.database import Base
from datetime import datetime

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    username = Column(String)
    first_name = Column(String, nullable=True)
    last_name = Column(String, nullable=True)
    birth_date = Column(DateTime, nullable=True)
    role = Column(String)
    hashed_password = Column(String)
    profile_picture = Column(String, default="kurbaga.jpeg")
    reset_token = Column(String, nullable=True)
    reset_token_expires = Column(DateTime, nullable=True)
    show_profile = Column(Boolean, default=True)
    show_stats = Column(Boolean, default=True)
    hide_ai_recommendations = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

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

class TestSession(Base):
    __tablename__ = "test_sessions"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    ders_id = Column(Integer)
    etiket = Column(String, nullable=True)
    started_at = Column(DateTime)
    ended_at = Column(DateTime, nullable=True)
    is_completed = Column(Boolean, default=False)
    total_questions = Column(Integer, default=0)
    correct_answers = Column(Integer, default=0)
    incorrect_answers = Column(Integer, default=0)

class Submission(Base):
    __tablename__ = "submissions"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    question_id = Column(Integer, ForeignKey("questions.soru_id"))
    test_session_id = Column(Integer, ForeignKey("test_sessions.id"), nullable=True)
    selected = Column(String, nullable=True)
    is_correct = Column(Boolean, nullable=True)
    is_skipped = Column(Boolean, default=False)
    answered_at = Column(DateTime)