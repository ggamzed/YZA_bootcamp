from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, answers, questions, statistics

app = FastAPI()


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