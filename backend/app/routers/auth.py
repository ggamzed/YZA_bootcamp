from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app import crud, schemas, models
from app import auth_def as auth
from app.database import get_db
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

router = APIRouter(prefix="/auth", tags=["auth"])

bearer_scheme = HTTPBearer()

@router.post("/register")
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    if crud.get_user_by_email(db, user.email):
        raise HTTPException(status_code=400, detail="Zaten kayıtlı.")
    crud.create_user(db, user)
    return {"message": "Kayıt başarılı!"}

@router.post("/login")
def login(user: schemas.UserLogin, db: Session = Depends(get_db)):
    auth_user = crud.authenticate_user(db, user.email, user.password)
    if not auth_user:
        raise HTTPException(status_code=400, detail="Hatalı giriş.")
    token = auth.create_access_token(data={"sub": str(auth_user.id)})
    return {"access_token": token}

@router.get("/me", response_model=schemas.UserOut)
def read_users_me(credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme), db: Session = Depends(get_db)):
    payload = auth.decode_token(credentials.credentials)
    user_id = int(payload.get("sub"))
    user = db.query(models.User).get(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Kullanıcı yok.")
    return user
