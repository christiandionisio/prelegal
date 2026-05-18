"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import NDAForm from "@/components/NDAForm";
import NDAPreview from "@/components/NDAPreview";
import ChatPanel from "@/components/ChatPanel";
import { defaultFormData, NDAFormData, PartyInfo } from "@/types/nda";

type Tab = "chat" | "fields";

function mergeFields(current: NDAFormData, updates: Record<string, unknown>): NDAFormData {
  const result = { ...current };
  for (const key of Object.keys(updates) as (keyof NDAFormData)[]) {
    if (key === "party1" || key === "party2") {
      result[key] = { ...current[key], ...(updates[key] as Partial<PartyInfo>) };
    } else {
      (result as Record<string, unknown>)[key] = updates[key];
    }
  }
  return result;
}

export default function NDAShell() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [formData, setFormData] = useState<NDAFormData>(defaultFormData);
  const [activeTab, setActiveTab] = useState<Tab>("chat");

  useEffect(() => {
    if (!localStorage.getItem("prelegal_user")) {
      router.replace("/login");
    } else {
      setReady(true);
    }
  }, [router]);

  if (!ready) return null;

  function handleFieldsUpdate(fields: Record<string, unknown>) {
    setFormData((prev) => mergeFields(prev, fields));
  }

  return (
    <div className="flex h-screen overflow-hidden">
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
            <ChatPanel formData={formData} onFieldsUpdate={handleFieldsUpdate} />
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
  );
}
