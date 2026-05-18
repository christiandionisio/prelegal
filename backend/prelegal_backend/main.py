from contextlib import asynccontextmanager
import os
import sqlite3

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from prelegal_backend.chat import stream_chat, DOCUMENT_CONFIGS

DB_PATH = os.environ.get("DB_PATH", "/app/data/prelegal.db")
STATIC_DIR = os.environ.get("STATIC_DIR", "/app/static")
TEMPLATES_DIR = os.environ.get("TEMPLATES_DIR", "/app/templates")

_ALLOWED_TEMPLATES = {cfg["template_file"] for cfg in DOCUMENT_CONFIGS.values()}


def init_db():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.commit()
    conn.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(title="Prelegal API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage]
    current_fields: dict = {}
    document_type: str = "mutual-nda"


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.get("/api/templates/{filename}", response_class=HTMLResponse)
def get_template(filename: str):
    if filename not in _ALLOWED_TEMPLATES:
        raise HTTPException(status_code=404, detail="Template not found")
    path = os.path.join(TEMPLATES_DIR, filename)
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Template not found")
    try:
        import markdown as md
        with open(path) as f:
            content = f.read()
        html = md.markdown(content, extensions=["tables"])
        return HTMLResponse(content=html)
    except ImportError:
        with open(path) as f:
            content = f.read()
        return HTMLResponse(content=f"<pre>{content}</pre>")


@app.post("/api/chat")
def chat(request: ChatRequest):
    messages = [{"role": m.role, "content": m.content} for m in request.messages]
    return StreamingResponse(
        stream_chat(messages, request.document_type),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


if os.path.exists(STATIC_DIR):
    app.mount("/", StaticFiles(directory=STATIC_DIR, html=True), name="static")
