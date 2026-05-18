# Prelegal Project

## Overview

This is a SaaS product to allow users to draft legal agreements based on templates in the templates directory.
The user can carry out AI chat in order to establish what document they want and how to fill in the fields.
The available documents are covered in the catalog.json file in the project root, included here:

@catalog.json

The current implementation has a Docker setup with a FastAPI backend, a fake login screen, and an AI chat interface for all 12 supported legal document types. Real authentication is not yet implemented.

## Development process

When instructed to build a feature:
1. Use your Atlassian tools to read the feature instructions from Jira
2. Develop the feature - do not skip any step from the feature-dev 7 step process
3. Thoroughly test the feature with unit tests and integration tests and fix any issues
4. Submit a PR using your github tools

## AI design

When writing code to make calls to LLMs, use your Cerebras skill to use LiteLLM via OpenRouter to the `openrouter/openai/gpt-oss-120b` model with Cerebras as the inference provider. You should use Structured Outputs so that you can interpret the results and populate fields in the legal document.

There is an OPENROUTER_API_KEY in the .env file in the project root.

## Technical design

The entire project should be packaged into a Docker container.  
The backend should be in backend/ and be a uv project, using FastAPI.  
The frontend should be in frontend/  
The database should use SQLite and be created from scratch each time the Docker container is brought up, allowing for a users table with sign up and sign in.  
The frontend is statically built (`next build` with `output: "export"`) and served by FastAPI via `StaticFiles`.  
There should be scripts in scripts/ for:  
```bash
# Mac
scripts/start-mac.sh    # Start
scripts/stop-mac.sh     # Stop

# Linux
scripts/start-linux.sh
scripts/stop-linux.sh

# Windows
scripts/start-windows.ps1
scripts/stop-windows.ps1
```
Backend available at http://localhost:8000

## Color Scheme
- Accent Yellow: `#ecad0a`
- Blue Primary: `#209dd7`
- Purple Secondary: `#753991` (submit buttons)
- Dark Navy: `#032147` (headings)
- Gray Text: `#888888`

## Implementation Status

### Completed (PL-3)
- Mutual NDA form with live preview and PDF download (client-side, html2canvas + jsPDF)
- Single-page Next.js prototype at `frontend/`

### Completed (PL-4)
- Docker multi-stage build (Node 20 builds frontend → Python 3.12 runs backend)
- FastAPI backend (`backend/prelegal_backend/main.py`) as a `uv` project
- SQLite DB initialised fresh on each container start; `users` table ready for future auth
- Next.js static export (`output: "export"`) served by FastAPI `StaticFiles` at localhost:8000
- Fake login page (`/login`) — any credentials accepted, session stored in localStorage
- Main app redirects to `/login` if not logged in
- Start/stop scripts for Mac, Linux, Windows in `scripts/`

### Completed (PL-5)
- AI chat interface replacing the question-series form (left panel, "Chat" tab)
- Freeform chat with streaming SSE responses (LiteLLM → OpenRouter → Cerebras, `openai/gpt-oss-120b`)
- Structured outputs extract NDA field values from conversation and populate the live preview in real time
- "Fields" tab keeps the manual form accessible for overrides
- `POST /api/chat` SSE endpoint in the backend
- Start scripts updated with `--env-file .env` to pass `OPENROUTER_API_KEY` to Docker

### Completed (PL-6)
- Document catalog home page (`/`) listing all 12 supported document types
- All document pages moved to `/doc/[slug]` (e.g. `/doc/mutual-nda`)
- AI chat supports all 12 document types with per-type system prompts and structured field extraction
- `GenericDocShell` + `GenericDocPreview` render any document type from its `.md` template
- `GET /api/templates/{filename}` endpoint converts Markdown templates to HTML (Python `markdown` lib)
- `DOCUMENT_CONFIGS` in both backend and frontend drive per-document prompts, fields, and extraction models
- Dynamic Pydantic extraction models created at runtime via `pydantic.create_model()`
- AI detects when the user wants a different document type and emits a `redirect` SSE event to navigate
- Chat history persists in `sessionStorage` across document type navigation
- Chat textarea auto-focuses after each AI response
- AI always asks a follow-up question when more information is needed
- XSS-safe token substitution in preview (`esc()` applied to all user-supplied values)

### Not yet implemented
- PL-7: Real authentication (JWT, bcrypt, document persistence)

### Current API Endpoints
- `GET /api/health` - Health check
- `POST /api/chat` - SSE stream: text chunks + `fields` event with extracted values + optional `redirect` event
- `GET /api/templates/{filename}` - Returns a Markdown template rendered as HTML