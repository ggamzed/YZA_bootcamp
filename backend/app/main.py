from fastapi import FastAPI
from backend.app.routers import auth,answers
from backend.app.models import Base
from backend.app.database import engine

Base.metadata.create_all(bind=engine)


app = FastAPI()

app.include_router(auth.router)
app.include_router(answers.router)
