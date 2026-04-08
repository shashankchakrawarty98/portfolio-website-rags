from __future__ import annotations

import os
from pathlib import Path
from typing import List

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sentence_transformers import SentenceTransformer

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")

app = FastAPI(title="Portfolio Embedding API", version="1.0.0")

allowed_origins = [origin.strip() for origin in os.getenv("ALLOWED_ORIGINS", "*").split(",") if origin.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load model once at startup
# "all-MiniLM-L6-v2" produces 384-dimensional vectors
model = SentenceTransformer("all-MiniLM-L6-v2")

class EmbedRequest(BaseModel):
    text: str = Field(min_length=1)

class EmbedResponse(BaseModel):
    embedding: List[float]

@app.get("/api/health")
def health():
    return {"status": "ok", "model": "all-MiniLM-L6-v2"}

@app.post("/api/embed", response_model=EmbedResponse)
def embed(payload: EmbedRequest):
    try:
        embedding = model.encode(payload.text).tolist()
        return EmbedResponse(embedding=embedding)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Embedding failed: {exc}") from exc
