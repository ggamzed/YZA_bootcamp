from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import SessionLocal, engine
from app.models import Base
from app.models import User
from app.schemas import UserCreate, UserLogin, UserOut
from app.crud import create_user, authenticate_user, get_user_by_email
from app.auth import create_access_token, decode_token
from fastapi import Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi import Depends, HTTPException

bearer_scheme = HTTPBearer()
Base.metadata.create_all(bind=engine)
app = FastAPI()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.post("/register")
def register(user: UserCreate, db: Session = Depends(get_db)):
    if get_user_by_email(db, user.email):
        raise HTTPException(status_code=400, detail="Kullanıcı zaten var.")
    user = create_user(db, user)
    return {"message": "Kayıt başarılı!"}

@app.post("/login")
def login(user: UserLogin, db: Session = Depends(get_db)):
    auth_user = authenticate_user(db, user.email, user.password)
    if not auth_user:
        raise HTTPException(status_code=400, detail="Giriş başarısız.")
    token = create_access_token(data={"sub": str(auth_user.id)})
    return {"access_token": token, "token_type": "bearer"}

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme), db: Session = Depends(get_db)):
    token = credentials.credentials
    try:
        payload = decode_token(token)
        user_id = int(payload.get("sub"))
    except:
        raise HTTPException(status_code=401, detail="Geçersiz token")

    user = db.query(User).get(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı.")
    return user

@app.get("/me", response_model=UserOut)
def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user


# TODO: En son sil.
@app.get("/users")
def read_all_users(db: Session = Depends(get_db)):
    users = db.query(User).all()
    return [{"email": u.email, "username": u.username} for u in users]
