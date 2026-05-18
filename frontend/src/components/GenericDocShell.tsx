"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ChatPanel from "@/components/ChatPanel";
import GenericDocPreview from "@/components/GenericDocPreview";
import { DocumentConfig } from "@/lib/document-configs";
import { PartyInfo, defaultFormData } from "@/types/nda";

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

export default function GenericDocShell({ config }: Props) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [formData, setFormData] = useState<GenericFormData>(defaultGenericData);
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
    <div className="flex flex-col h-screen overflow-hidden">
      <header className="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-200 shrink-0">
        <Link href="/" className="text-sm font-medium hover:underline" style={{ color: "#209dd7" }}>
          ← Documents
        </Link>
        <span className="text-gray-300">|</span>
        <span className="text-sm font-semibold" style={{ color: "#032147" }}>
          {config.name}
        </span>
      </header>

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
  const labelClass = "block text-xs font-medium mb-1" ;

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
