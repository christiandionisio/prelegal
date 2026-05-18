# Prelegal Project

## Overview

This is a SaaS product to allow users to draft legal agreements based on templates in the templates directory.
The user can carry out AI chat in order to establish what document they want and how to fill in the fields.
The available documents are covered in the catalog.json file in the project root, included here:

@catalog.json

The current implementation has a foundational Docker setup with a FastAPI backend, a fake login screen, and the original Mutual NDA prototype from PL-3. AI chat, multi-document support, and real authentication are not yet implemented.

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

### Not yet implemented
- PL-5: AI chat interface (LiteLLM / OpenRouter / Cerebras)
- PL-6: Multi-document support (all 11 catalog types)
- PL-7: Real authentication (JWT, bcrypt, document persistence)

### Current API Endpoints
- `GET /api/health` - Health check