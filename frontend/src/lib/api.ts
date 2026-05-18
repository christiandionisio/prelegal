export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface SavedDocument {
  id: number;
  document_type: string;
  document_name: string;
  fields_json: string;
  created_at: string;
}

// ── Token helpers ─────────────────────────────────────────────────────────────

const TOKEN_KEY = "prelegal_token";

export function getToken(): string | null {
  if (typeof localStorage === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export function isTokenValid(): boolean {
  const token = getToken();
  if (!token) return false;
  try {
    // JWT uses URL-safe base64 (- and _ instead of + and /), no padding.
    // atob only handles standard base64, so normalise before decoding.
    const b64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = b64.padEnd(b64.length + (4 - (b64.length % 4)) % 4, "=");
    const payload = JSON.parse(atob(padded));
    return typeof payload.exp === "number" && payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  return token
    ? { "Content-Type": "application/json", Authorization: `Bearer ${token}` }
    : { "Content-Type": "application/json" };
}

// ── Auth endpoints ────────────────────────────────────────────────────────────

export async function signUp(email: string, password: string): Promise<void> {
  const res = await fetch("/api/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail ?? "Sign up failed");
  }
  const { token } = await res.json();
  setToken(token);
}

export async function signIn(email: string, password: string): Promise<void> {
  const res = await fetch("/api/auth/signin", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail ?? "Sign in failed");
  }
  const { token } = await res.json();
  setToken(token);
}

// ── Document persistence ──────────────────────────────────────────────────────

export async function saveDocument(
  documentType: string,
  documentName: string,
  fields: object,
): Promise<number> {
  const res = await fetch("/api/documents", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      document_type: documentType,
      document_name: documentName,
      fields_json: JSON.stringify(fields),
    }),
  });
  if (!res.ok) throw new Error("Failed to save document");
  const { id } = await res.json();
  return id;
}

export async function getDocuments(): Promise<SavedDocument[]> {
  const res = await fetch("/api/documents", { headers: authHeaders() });
  if (!res.ok) return [];
  return res.json();
}

export async function deleteDocument(id: number): Promise<void> {
  const res = await fetch(`/api/documents/${id}`, { method: "DELETE", headers: authHeaders() });
  if (!res.ok) throw new Error("Failed to delete document");
}

// ── Chat ──────────────────────────────────────────────────────────────────────

export async function streamChat(
  messages: ChatMessage[],
  currentFields: object,
  documentType: string,
  onChunk: (chunk: string) => void,
  onFields: (fields: Record<string, unknown>) => void,
  onRedirect?: (slug: string) => void,
): Promise<void> {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      messages,
      current_fields: currentFields,
      document_type: documentType,
    }),
  });

  if (!response.ok || !response.body) {
    throw new Error(`Chat request failed: ${response.status}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const data = line.slice(6);
      if (data === "[DONE]") return;
      try {
        const parsed = JSON.parse(data);
        if (parsed.chunk !== undefined) onChunk(parsed.chunk);
        if (parsed.fields !== undefined) onFields(parsed.fields);
        if (parsed.redirect !== undefined && onRedirect) onRedirect(parsed.redirect);
      } catch {
        // skip malformed lines
      }
    }
  }
}
