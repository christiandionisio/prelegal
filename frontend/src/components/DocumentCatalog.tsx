"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DOCUMENT_CONFIGS } from "@/lib/document-configs";

const ICONS: Record<string, string> = {
  "mutual-nda": "🤝",
  "mutual-nda-cover-page": "📋",
  "cloud-service-agreement": "☁️",
  "design-partner-agreement": "🎨",
  "service-level-agreement": "📊",
  "professional-services-agreement": "💼",
  "data-processing-agreement": "🔒",
  "software-license-agreement": "💻",
  "partnership-agreement": "🤝",
  "pilot-agreement": "🚀",
  "business-associate-agreement": "🏥",
  "ai-addendum": "🤖",
};

export default function DocumentCatalog() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("prelegal_user")) {
      router.replace("/login");
    } else {
      setReady(true);
    }
  }, [router]);

  if (!ready) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-8 py-5">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "#032147" }}>
              Prelegal
            </h1>
            <p className="text-sm mt-0.5" style={{ color: "#888888" }}>
              AI-powered legal agreements
            </p>
          </div>
          <button
            onClick={() => {
              localStorage.removeItem("prelegal_user");
              router.replace("/login");
            }}
            className="text-sm font-medium px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            style={{ color: "#888888" }}
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-8 py-10">
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-1" style={{ color: "#032147" }}>
            Choose a document
          </h2>
          <p className="text-sm" style={{ color: "#888888" }}>
            Select a legal agreement type to get started. Our AI will guide you through the process.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {DOCUMENT_CONFIGS.map((doc) => (
            <button
              key={doc.slug}
              onClick={() => router.push(`/doc/${doc.slug}`)}
              className="text-left bg-white rounded-xl border border-gray-200 p-5 hover:border-[#209dd7] hover:shadow-md transition-all group"
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl shrink-0 mt-0.5">{ICONS[doc.slug] ?? "📄"}</span>
                <div className="min-w-0">
                  <h3
                    className="font-semibold text-sm mb-1 group-hover:text-[#209dd7] transition-colors"
                    style={{ color: "#032147" }}
                  >
                    {doc.name}
                  </h3>
                  <p className="text-xs leading-relaxed line-clamp-3" style={{ color: "#888888" }}>
                    {doc.description}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}
