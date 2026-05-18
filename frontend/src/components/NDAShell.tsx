"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import NDAForm from "@/components/NDAForm";
import NDAPreview from "@/components/NDAPreview";
import ChatPanel from "@/components/ChatPanel";
import DocHeader from "@/components/DocHeader";
import { defaultFormData, NDAFormData, PartyInfo } from "@/types/nda";
import { isTokenValid, saveDocument } from "@/lib/api";

type Tab = "chat" | "fields";

function mergeFields(current: NDAFormData, updates: Record<string, unknown>): NDAFormData {
  const result = { ...current };
  for (const key of Object.keys(updates) as (keyof NDAFormData)[]) {
    if (key === "party1" || key === "party2") {
      if (updates[key] != null) {
        result[key] = { ...current[key], ...(updates[key] as Partial<PartyInfo>) };
      }
    } else if (updates[key] != null) {
      (result as Record<string, unknown>)[key] = updates[key];
    }
  }
  return result;
}

const DOC_SLUG = "mutual-nda";
const DOC_NAME = "Mutual Non-Disclosure Agreement";
const LOAD_KEY = `prelegal_load_${DOC_SLUG}`;

export default function NDAShell() {
  const router = useRouter();
  const [ready, setReady] = useState(() => isTokenValid());
  const [formData, setFormData] = useState<NDAFormData>(defaultFormData);
  const [activeTab, setActiveTab] = useState<Tab>("chat");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [disclaimerVisible, setDisclaimerVisible] = useState(true);

  useEffect(() => {
    if (!isTokenValid()) {
      router.replace("/login");
      return;
    }
    const stored = sessionStorage.getItem(LOAD_KEY);
    if (stored) {
      try {
        setFormData(JSON.parse(stored));
      } catch {}
      sessionStorage.removeItem(LOAD_KEY);
    }
    if (!ready) setReady(true);
  }, [router]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!ready) return null;

  function handleFieldsUpdate(fields: Record<string, unknown>) {
    setSaved(false);
    setFormData((prev) => mergeFields(prev, fields));
  }

  async function handleSave() {
    setSaving(true);
    try {
      await saveDocument(DOC_SLUG, DOC_NAME, formData);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      // silently fail; user can retry
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <DocHeader
        docName={DOC_NAME}
        onSave={handleSave}
        saving={saving}
        saved={saved}
      />

      {disclaimerVisible && (
        <div
          className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm shrink-0"
          style={{ backgroundColor: "#fef3c7", borderBottom: "1px solid #fde68a" }}
        >
          <span style={{ color: "#92400e" }}>
            ⚠️ This is an AI-generated draft. It should be reviewed by a qualified legal professional before use.
          </span>
          <button
            onClick={() => setDisclaimerVisible(false)}
            className="shrink-0 text-xs font-medium hover:opacity-70 transition-opacity"
            style={{ color: "#92400e" }}
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-[420px] shrink-0 border-r border-gray-200 bg-white flex flex-col overflow-hidden">
          <div className="flex border-b border-gray-200 shrink-0">
            {(["chat", "fields"] as Tab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab ? "" : "text-gray-500 hover:text-gray-700"
                }`}
                style={
                  activeTab === tab
                    ? { borderBottom: "2px solid #209dd7", color: "#209dd7" }
                    : {}
                }
              >
                {tab === "chat" ? "Chat" : "Fields"}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-hidden">
            {activeTab === "chat" ? (
              <ChatPanel
                formData={formData}
                documentType={DOC_SLUG}
                onFieldsUpdate={handleFieldsUpdate}
                onRedirect={(slug) => router.push(`/doc/${slug}`)}
                placeholder="Tell me about the NDA you need — who are the two parties, and what's the purpose?"
              />
            ) : (
              <div className="overflow-y-auto h-full">
                <NDAForm data={formData} onChange={setFormData} />
              </div>
            )}
          </div>
        </aside>

        <main className="flex-1 overflow-hidden">
          <NDAPreview data={formData} />
        </main>
      </div>
    </div>
  );
}
