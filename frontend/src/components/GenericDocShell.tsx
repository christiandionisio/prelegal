"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ChatPanel from "@/components/ChatPanel";
import DocHeader from "@/components/DocHeader";
import GenericDocPreview from "@/components/GenericDocPreview";
import { DocumentConfig } from "@/lib/document-configs";
import { PartyInfo, defaultFormData } from "@/types/nda";
import { isTokenValid, saveDocument } from "@/lib/api";

interface GenericFormData {
  fields: Record<string, string>;
  party1: PartyInfo;
  party2: PartyInfo;
}

const defaultGenericData: GenericFormData = {
  fields: {},
  party1: { ...defaultFormData.party1 },
  party2: { ...defaultFormData.party2 },
};

function mergeFields(current: GenericFormData, updates: Record<string, unknown>): GenericFormData {
  const result = { ...current, fields: { ...current.fields } };
  for (const [key, val] of Object.entries(updates)) {
    if (key === "party1" && val) {
      result.party1 = { ...current.party1, ...(val as Partial<PartyInfo>) };
    } else if (key === "party2" && val) {
      result.party2 = { ...current.party2, ...(val as Partial<PartyInfo>) };
    } else if (val != null) {
      result.fields[key] = String(val);
    }
  }
  return result;
}

type Tab = "chat" | "fields";

interface Props {
  config: DocumentConfig;
}

const LOAD_KEY = (slug: string) => `prelegal_load_${slug}`;

export default function GenericDocShell({ config }: Props) {
  const router = useRouter();
  const [ready, setReady] = useState(() => isTokenValid());
  const [formData, setFormData] = useState<GenericFormData>(defaultGenericData);
  const [activeTab, setActiveTab] = useState<Tab>("chat");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [disclaimerVisible, setDisclaimerVisible] = useState(true);

  useEffect(() => {
    if (!isTokenValid()) {
      router.replace("/login");
      return;
    }
    // Load saved fields if navigated from history
    const stored = sessionStorage.getItem(LOAD_KEY(config.slug));
    if (stored) {
      try {
        setFormData(JSON.parse(stored));
      } catch {}
      sessionStorage.removeItem(LOAD_KEY(config.slug));
    }
    if (!ready) setReady(true);
  }, [router, config.slug]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!ready) return null;

  function handleFieldsUpdate(fields: Record<string, unknown>) {
    setSaved(false);
    setFormData((prev) => mergeFields(prev, fields));
  }

  async function handleSave() {
    setSaving(true);
    try {
      await saveDocument(config.slug, config.name, formData);
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
        docName={config.name}
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
                documentType={config.slug}
                onFieldsUpdate={handleFieldsUpdate}
                onRedirect={(slug) => router.push(`/doc/${slug}`)}
              />
            ) : (
              <div className="overflow-y-auto h-full p-4 space-y-4">
                <FieldsForm config={config} data={formData} onChange={setFormData} />
              </div>
            )}
          </div>
        </aside>

        <main className="flex-1 overflow-hidden">
          <GenericDocPreview config={config} data={formData} />
        </main>
      </div>
    </div>
  );
}

function FieldsForm({
  config,
  data,
  onChange,
}: {
  config: DocumentConfig;
  data: GenericFormData;
  onChange: (d: GenericFormData) => void;
}) {
  function setField(id: string, val: string) {
    onChange({ ...data, fields: { ...data.fields, [id]: val } });
  }

  function setParty(party: "party1" | "party2", key: keyof PartyInfo, val: string) {
    onChange({ ...data, [party]: { ...data[party], [key]: val } });
  }

  const inputClass =
    "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2";
  const inputStyle = { "--tw-ring-color": "#209dd7" } as React.CSSProperties;
  const labelClass = "block text-xs font-medium mb-1";

  const partySection = (label: string, key: "party1" | "party2") => (
    <section>
      <h3 className="text-sm font-semibold mb-3 pb-1 border-b border-gray-100" style={{ color: "#032147" }}>
        {label}
      </h3>
      {(["printName", "title", "company", "noticeAddress", "date", "signature"] as (keyof PartyInfo)[]).map((field) => (
        <div key={field} className="mb-3">
          <label className={labelClass} style={{ color: "#032147" }}>
            {field === "printName" ? "Print Name" : field === "noticeAddress" ? "Notice Address" : field.charAt(0).toUpperCase() + field.slice(1)}
          </label>
          <input
            type={field === "date" ? "date" : "text"}
            className={inputClass}
            style={inputStyle}
            value={data[key][field]}
            onChange={(e) => setParty(key, field, e.target.value)}
          />
        </div>
      ))}
    </section>
  );

  return (
    <div className="space-y-6">
      <section>
        <h3 className="text-sm font-semibold mb-3 pb-1 border-b border-gray-100" style={{ color: "#032147" }}>
          Document Fields
        </h3>
        {config.fields.map((f) => (
          <div key={f.id} className="mb-3">
            <label className={labelClass} style={{ color: "#032147" }}>
              {f.label}
              {f.description && (
                <span className="font-normal ml-1" style={{ color: "#888888" }}>
                  — {f.description}
                </span>
              )}
            </label>
            <input
              type={f.id.toLowerCase().includes("date") ? "date" : "text"}
              className={inputClass}
              style={inputStyle}
              value={data.fields[f.id] ?? ""}
              onChange={(e) => setField(f.id, e.target.value)}
            />
          </div>
        ))}
      </section>

      {partySection(config.party1Label, "party1")}
      {partySection(config.party2Label, "party2")}
    </div>
  );
}
