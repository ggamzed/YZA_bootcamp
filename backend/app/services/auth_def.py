from passlib.context import CryptContext
from jose import jwt
from datetime import datetime, timedelta, timezone

SECRET_KEY = "secret_key"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 240

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password):
    return pwd_context.hash(password)

def verify_password(raw_pass, hashed):
    return pwd_context.verify(raw_pass, hashed)

def create_access_token(data: dict):
    data_to_sign = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    data_to_sign.update({"exp": expire})
    return jwt.encode(data_to_sign, SECRET_KEY, algorithm=ALGORITHM)

def decode_token(token: str):
    try:
        decoded = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        print(f"DEBUG: Token decoded successfully, user_id: {decoded.get('sub')}")
        return decoded
    except Exception as e:
        print(f"DEBUG: Token decode failed: {e}")
        raise e
