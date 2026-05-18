export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

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
    headers: { "Content-Type": "application/json" },
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
