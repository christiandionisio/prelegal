"use client";

import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { streamChat, ChatMessage } from "@/lib/api";

interface Props {
  formData: object;
  documentType: string;
  onFieldsUpdate: (fields: Record<string, unknown>) => void;
  onRedirect?: (slug: string) => void;
  placeholder?: string;
}

function storageKey(docType: string) {
  return `prelegal_chat_${docType}`;
}

function loadMessages(docType: string): ChatMessage[] {
  try {
    const raw = sessionStorage.getItem(storageKey(docType));
    return raw ? (JSON.parse(raw) as ChatMessage[]) : [];
  } catch {
    return [];
  }
}

function saveMessages(docType: string, msgs: ChatMessage[]) {
  try {
    sessionStorage.setItem(storageKey(docType), JSON.stringify(msgs));
  } catch {}
}

export default function ChatPanel({ formData, documentType, onFieldsUpdate, onRedirect, placeholder }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>(() => loadMessages(documentType));
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // Keep a ref so async callbacks always see the latest messages
  const messagesRef = useRef(messages);

  useEffect(() => {
    messagesRef.current = messages;
    saveMessages(documentType, messages);
  }, [messages, documentType]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send() {
    if (!input.trim() || streaming) return;

    const userMsg: ChatMessage = { role: "user", content: input.trim() };
    const next = [...messages, userMsg];
    setMessages([...next, { role: "assistant", content: "" }]);
    setInput("");
    setStreaming(true);

    try {
      await streamChat(
        next,
        formData,
        documentType,
        (chunk) => {
          setMessages((prev) => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            if (last.role === "assistant") {
              updated[updated.length - 1] = { ...last, content: last.content + chunk };
            }
            return updated;
          });
        },
        (fields) => onFieldsUpdate(fields),
        (slug) => {
          // Carry the full conversation history to the new document page
          saveMessages(slug, messagesRef.current);
          onRedirect?.(slug);
        },
      );
    } catch {
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "assistant",
          content: "Sorry, something went wrong. Please try again.",
        };
        return updated;
      });
    } finally {
      setStreaming(false);
      textareaRef.current?.focus();
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-center max-w-[240px]" style={{ color: "#888888" }}>
              {placeholder ?? "Tell me about the document you need — who are the parties and what's the purpose?"}
            </p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === "user"
                  ? "text-white rounded-br-sm"
                  : "bg-white border border-gray-200 text-gray-800 rounded-bl-sm shadow-sm"
              }`}
              style={msg.role === "user" ? { backgroundColor: "#753991" } : {}}
            >
              {msg.content === "" && streaming ? (
                <span className="flex gap-1 items-center py-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:0ms]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:150ms]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:300ms]" />
                </span>
              ) : (
                msg.content
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="px-4 py-3 border-t border-gray-200 bg-white shrink-0">
        <div className="flex gap-2 items-end">
          <textarea
            ref={textareaRef}
            className="flex-1 border border-gray-300 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 min-h-[40px] max-h-[120px]"
            style={{ "--tw-ring-color": "#209dd7" } as React.CSSProperties}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder ?? "Type a message… (Enter to send)"}
            disabled={streaming}
          />
          <button
            onClick={send}
            disabled={!input.trim() || streaming}
            className="shrink-0 px-4 py-2 rounded-xl text-white text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-40"
            style={{ backgroundColor: "#753991" }}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
