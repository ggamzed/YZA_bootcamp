from pydantic import BaseModel, validator
from datetime import datetime
import re

class UserCreate(BaseModel):
    email: str
    username: str
    password: str
    first_name: str
    last_name: str
    birth_date: str  # ISO format string
    
    @validator('username')
    def validate_username(cls, v):
        if len(v) < 5:
            raise ValueError('Kullanıcı adı en az 5 karakter olmalıdır')
        
        # Kullanıcı adı politikaları: sadece harf, rakam, alt çizgi ve tire
        if not re.match(r'^[a-zA-Z0-9_-]+$', v):
            raise ValueError('Kullanıcı adı sadece harf, rakam, alt çizgi (_) ve tire (-) içerebilir')
        
        # Ardışık özel karakterler kontrolü
        if re.search(r'[_-]{2,}', v):
            raise ValueError('Kullanıcı adında ardışık özel karakterler olamaz')
        
        # Başlangıç ve bitiş kontrolü
        if v.startswith(('_', '-')) or v.endswith(('_', '-')):
            raise ValueError('Kullanıcı adı alt çizgi veya tire ile başlayamaz veya bitemez')
        
        return v
    
    @validator('password')
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Şifre en az 8 karakter olmalıdır')
        return v
    
    @validator('first_name')
    def validate_first_name(cls, v):
        if v is not None:
            # Maksimum 30 karakter kontrolü
            if len(v) > 30:
                raise ValueError('Ad maksimum 30 karakter olabilir')
            
            # Maksimum 2 boşluk kontrolü
            if v.count(' ') > 2:
                raise ValueError('Ad maksimum 2 boşluk içerebilir')
            
            # Sadece harf ve boşluk kontrolü
            if not re.match(r'^[a-zA-ZğüşıöçĞÜŞİÖÇ\s]+$', v):
                raise ValueError('Ad sadece harf ve boşluk içerebilir')
            
            # Baş harfleri büyük yap
            return ' '.join(word.capitalize() for word in v.split())
        return v
    
    @validator('last_name')
    def validate_last_name(cls, v):
        if not v or not v.strip():
            raise ValueError('Soyad alanı zorunludur')
        
        # Maksimum 30 karakter kontrolü
        if len(v) > 30:
            raise ValueError('Soyad maksimum 30 karakter olabilir')
        
        # Maksimum 2 boşluk kontrolü
        if v.count(' ') > 2:
            raise ValueError('Soyad maksimum 2 boşluk içerebilir')
        
        # Sadece harf ve boşluk kontrolü
        if not re.match(r'^[a-zA-ZğüşıöçĞÜŞİÖÇ\s]+$', v):
            raise ValueError('Soyad sadece harf ve boşluk içerebilir')
        
        # Baş harfleri büyük yap
        return ' '.join(word.capitalize() for word in v.split())
    
    @validator('birth_date')
    def validate_birth_date(cls, v):
        if not v:
            raise ValueError('Doğum tarihi alanı zorunludur')
        
        try:
            from datetime import datetime
            import pytz
            
            # ISO format string'i datetime'a çevir
            birth_date = datetime.fromisoformat(v.replace('Z', '+00:00'))
            
            # Bugünün tarihini timezone-aware olarak al
            utc = pytz.UTC
            today = datetime.now(utc)
            
            # Eğer birth_date timezone-naive ise, UTC olarak kabul et
            if birth_date.tzinfo is None:
                birth_date = utc.localize(birth_date)
            
            if birth_date > today:
                raise ValueError('Doğum tarihi gelecek bir tarih olamaz')
            
            if birth_date.year < 1900:
                raise ValueError('Geçerli bir doğum tarihi giriniz')
                
        except ValueError as e:
            if 'Doğum tarihi' in str(e):
                raise e
            raise ValueError('Geçerli bir doğum tarihi formatı giriniz')
        
        return v

class UserLogin(BaseModel):
    email: str
    password: str

class ForgotPassword(BaseModel):
    email: str

class ResetPassword(BaseModel):
    token: str
    new_password: str
    
    @validator('new_password')
    def validate_new_password(cls, v):
        if len(v) < 8:
            raise ValueError('Şifre en az 8 karakter olmalıdır')
        return v

class ChangePassword(BaseModel):
    current_password: str
    new_password: str
    
    @validator('current_password')
    def validate_current_password(cls, v):
        if not v:
            raise ValueError('Mevcut şifre alanı zorunludur')
        return v
    
    @validator('new_password')
    def validate_new_password(cls, v):
        if len(v) < 8:
            raise ValueError('Yeni şifre en az 8 karakter olmalıdır')
        return v

class PrivacySettings(BaseModel):
    show_profile: bool
    show_stats: bool
    hide_ai_recommendations: bool

class ProfileUpdate(BaseModel):
    username: str | None = None
    email: str | None = None
    first_name: str | None = None
    last_name: str | None = None
    birth_date: str | None = None  # ISO format string
    
    @validator('username')
    def validate_username(cls, v):
        if v is not None:
            if len(v) < 5:
                raise ValueError('Kullanıcı adı en az 5 karakter olmalıdır')
            
            # Kullanıcı adı politikaları: sadece harf, rakam, alt çizgi ve tire
            if not re.match(r'^[a-zA-Z0-9_-]+$', v):
                raise ValueError('Kullanıcı adı sadece harf, rakam, alt çizgi (_) ve tire (-) içerebilir')
            
            # Ardışık özel karakterler kontrolü
            if re.search(r'[_-]{2,}', v):
                raise ValueError('Kullanıcı adında ardışık özel karakterler olamaz')
            
            # Başlangıç ve bitiş kontrolü
            if v.startswith(('_', '-')) or v.endswith(('_', '-')):
                raise ValueError('Kullanıcı adı alt çizgi veya tire ile başlayamaz veya bitemez')
        
        return v
    
    @validator('first_name')
    def validate_first_name(cls, v):
        if v is not None:
            # Maksimum 30 karakter kontrolü
            if len(v) > 30:
                raise ValueError('Ad maksimum 30 karakter olabilir')
            
            # Maksimum 2 boşluk kontrolü
            if v.count(' ') > 2:
                raise ValueError('Ad maksimum 2 boşluk içerebilir')
            
            # Sadece harf ve boşluk kontrolü
            if not re.match(r'^[a-zA-ZğüşıöçĞÜŞİÖÇ\s]+$', v):
                raise ValueError('Ad sadece harf ve boşluk içerebilir')
            
            # Baş harfleri büyük yap
            return ' '.join(word.capitalize() for word in v.split())
        return v
    
    @validator('last_name')
    def validate_last_name(cls, v):
        if v is not None:
            # Maksimum 30 karakter kontrolü
            if len(v) > 30:
                raise ValueError('Soyad maksimum 30 karakter olabilir')
            
            # Maksimum 2 boşluk kontrolü
            if v.count(' ') > 2:
                raise ValueError('Soyad maksimum 2 boşluk içerebilir')
            
            # Sadece harf ve boşluk kontrolü
            if not re.match(r'^[a-zA-ZğüşıöçĞÜŞİÖÇ\s]+$', v):
                raise ValueError('Soyad sadece harf ve boşluk içerebilir')
            
            # Baş harfleri büyük yap
            return ' '.join(word.capitalize() for word in v.split())
        return v
    
    @validator('birth_date')
    def validate_birth_date(cls, v):
        if v is not None:
            try:
                from datetime import datetime
                import pytz
                
                # ISO format string'i datetime'a çevir
                birth_date = datetime.fromisoformat(v.replace('Z', '+00:00'))
                
                # Bugünün tarihini timezone-aware olarak al
                utc = pytz.UTC
                today = datetime.now(utc)
                
                # Eğer birth_date timezone-naive ise, UTC olarak kabul et
                if birth_date.tzinfo is None:
                    birth_date = utc.localize(birth_date)
                
                if birth_date > today:
                    raise ValueError('Doğum tarihi gelecek bir tarih olamaz')
                
                if birth_date.year < 1900:
                    raise ValueError('Geçerli bir doğum tarihi giriniz')
                    
            except ValueError as e:
                if 'Doğum tarihi' in str(e):
                    raise e
                raise ValueError('Geçerli bir doğum tarihi formatı giriniz')
        
        return v

class UserOut(BaseModel):
    id: int
    email: str
    username: str
    first_name: str | None = None
    last_name: str | None = None
    birth_date: datetime | None = None
    profile_picture: str
    show_profile: bool | None = None
    show_stats: bool | None = None
    hide_ai_recommendations: bool | None = None
    created_at: datetime
    class Config:
        orm_mode = True

class AnswerIn(BaseModel):
    soru_id: int
    selected: str | None = None
    ders_id: int
    konu_id: int
    zorluk: int
    altbaslik_id: int
    is_correct: int | None = None
    is_skipped: bool = False
    test_session_id: int | None = None

class PredictIn(BaseModel):
    user_id: int
    ders_id: int
    konu_id: int
    altbaslik_id: int
    zorluk: int
    is_correct: bool | None = None

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
