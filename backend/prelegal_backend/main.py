from contextlib import asynccontextmanager
import os
import sqlite3

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from prelegal_backend.auth import (
    create_token,
    get_current_user_id,
    hash_password,
    verify_password,
)
from prelegal_backend.chat import stream_chat, DOCUMENT_CONFIGS

DB_PATH = os.environ.get("DB_PATH", "/app/data/prelegal.db")
STATIC_DIR = os.environ.get("STATIC_DIR", "/app/static")
TEMPLATES_DIR = os.environ.get("TEMPLATES_DIR", "/app/templates")

_ALLOWED_TEMPLATES = {cfg["template_file"] for cfg in DOCUMENT_CONFIGS.values()}


def _conn():
    return sqlite3.connect(DB_PATH)


def init_db():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = _conn()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id            INTEGER PRIMARY KEY AUTOINCREMENT,
            email         TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS documents (
            id            INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id       INTEGER NOT NULL REFERENCES users(id),
            document_type TEXT NOT NULL,
            document_name TEXT NOT NULL,
            fields_json   TEXT NOT NULL,
            created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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


# ── Pydantic models ──────────────────────────────────────────────────────────

class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage]
    current_fields: dict = {}
    document_type: str = "mutual-nda"


class AuthRequest(BaseModel):
    email: str
    password: str


class SaveDocumentRequest(BaseModel):
    document_type: str
    document_name: str
    fields_json: str


# ── Health ───────────────────────────────────────────────────────────────────

@app.get("/api/health")
def health():
    return {"status": "ok"}


# ── Auth endpoints ────────────────────────────────────────────────────────────

@app.post("/api/auth/signup")
def signup(req: AuthRequest):
    conn = _conn()
    try:
        conn.execute(
            "INSERT INTO users (email, password_hash) VALUES (?, ?)",
            (req.email, hash_password(req.password)),
        )
        conn.commit()
        row = conn.execute("SELECT id FROM users WHERE email = ?", (req.email,)).fetchone()
        token = create_token(row[0], req.email)
    except sqlite3.IntegrityError:
        raise HTTPException(status_code=409, detail="Email already registered")
    finally:
        conn.close()
    return {"token": token}


@app.post("/api/auth/signin")
def signin(req: AuthRequest):
    conn = _conn()
    row = conn.execute(
        "SELECT id, password_hash FROM users WHERE email = ?", (req.email,)
    ).fetchone()
    conn.close()
    if not row or not verify_password(req.password, row[1]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    return {"token": create_token(row[0], req.email)}


# ── Document persistence endpoints ───────────────────────────────────────────

@app.post("/api/documents")
def save_document(req: SaveDocumentRequest, user_id: int = Depends(get_current_user_id)):
    conn = _conn()
    cursor = conn.execute(
        "INSERT INTO documents (user_id, document_type, document_name, fields_json) VALUES (?, ?, ?, ?)",
        (user_id, req.document_type, req.document_name, req.fields_json),
    )
    conn.commit()
    doc_id = cursor.lastrowid
    conn.close()
    return {"id": doc_id}


@app.get("/api/documents")
def list_documents(user_id: int = Depends(get_current_user_id)):
    conn = _conn()
    rows = conn.execute(
        "SELECT id, document_type, document_name, fields_json, created_at FROM documents "
        "WHERE user_id = ? ORDER BY created_at DESC",
        (user_id,),
    ).fetchall()
    conn.close()
    return [
        {"id": r[0], "document_type": r[1], "document_name": r[2], "fields_json": r[3], "created_at": r[4]}
        for r in rows
    ]


@app.delete("/api/documents/{doc_id}")
def delete_document(doc_id: int, user_id: int = Depends(get_current_user_id)):
    conn = _conn()
    result = conn.execute(
        "DELETE FROM documents WHERE id = ? AND user_id = ?", (doc_id, user_id)
    )
    conn.commit()
    conn.close()
    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="Document not found")
    return {"ok": True}


# ── Templates ─────────────────────────────────────────────────────────────────

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


# ── Chat ──────────────────────────────────────────────────────────────────────

@app.post("/api/chat")
def chat(request: ChatRequest):
    messages = [{"role": m.role, "content": m.content} for m in request.messages]
    return StreamingResponse(
        stream_chat(messages, request.document_type),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


# ── Static files (must be last) ───────────────────────────────────────────────

if os.path.exists(STATIC_DIR):
    app.mount("/", StaticFiles(directory=STATIC_DIR, html=True), name="static")
