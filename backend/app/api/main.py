from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.api.routers import auth, answers, questions, statistics, profile
from app.core.database import create_tables
import os

app = FastAPI()

@app.on_event("startup")
async def startup_event():
    create_tables()

frontend_img_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "..", "frontend", "src", "img")
if os.path.exists(frontend_img_path):
    app.mount("/img", StaticFiles(directory=frontend_img_path), name="img")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(answers.router)
app.include_router(questions.router)
app.include_router(statistics.router)
app.include_router(profile.router)