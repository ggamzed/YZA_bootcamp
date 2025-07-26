from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# Windows için
# DATABASE_URL = "sqlite:///D:/python_projeler/YZA_bootcamp/YZA_bootcamp/backend/app/database.db"
# MacOS için
# DATABASE_URL = "sqlite:///backend/app/database.db"
DATABASE_URL = "sqlite:///backend/app/database.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()