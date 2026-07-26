from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from database import engine, Base
from routers import auth, files, folders, shares, notifications
import os

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Archivos Multired API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:3001", "http://127.0.0.1:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api")
app.include_router(files.router, prefix="/api")
app.include_router(folders.router, prefix="/api")
app.include_router(shares.router, prefix="/api")
app.include_router(notifications.router, prefix="/api")


@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "Archivos Multired API"}
