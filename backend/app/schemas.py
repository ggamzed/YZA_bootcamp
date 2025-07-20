from pydantic import BaseModel

class UserCreate(BaseModel):
    email: str
    username: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class UserOut(BaseModel):
    id: int
    email: str
    username: str
    class Config:
        orm_mode = True

class AnswerIn(BaseModel):
    soru_id: int
    selected: str
    ders_id: int
    konu_id: int
    zorluk: int
    altbaslik_id: int
    is_correct: int

class PredictIn(BaseModel):
    user_id: int
    ders_id: int
    konu_id: int
    altbaslik_id: int
    zorluk: int

# ✅ Yeni eklenen şema
class QuestionOut(BaseModel):
    soru_id: int
    ders_id: int
    konu_id: int
    altbaslik_id: int
    zorluk: int
    soru_metin: str
    correct_choice: str
    dogru_cevap_aciklamasi: str | None = None
    class Config:
        orm_mode = True
