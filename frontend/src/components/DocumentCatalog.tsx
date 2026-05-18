"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DOCUMENT_CONFIGS } from "@/lib/document-configs";
import { isTokenValid, clearToken, getDocuments, deleteDocument, SavedDocument } from "@/lib/api";

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

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 bg-gray-200 rounded shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-3.5 bg-gray-200 rounded w-3/4" />
          <div className="h-3 bg-gray-100 rounded w-full" />
          <div className="h-3 bg-gray-100 rounded w-2/3" />
        </div>
      </div>
    </div>
  );
}

function HistorySkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse flex items-center gap-3">
      <div className="w-8 h-8 bg-gray-200 rounded shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3.5 bg-gray-200 rounded w-1/2" />
        <div className="h-3 bg-gray-100 rounded w-1/4" />
      </div>
    </div>
  );
}

export default function DocumentCatalog() {
  const router = useRouter();
  const [ready, setReady] = useState(() => isTokenValid());
  const [history, setHistory] = useState<SavedDocument[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  useEffect(() => {
    if (!isTokenValid()) {
      router.replace("/login");
      return;
    }
    setReady(true);
    getDocuments()
      .then(setHistory)
      .finally(() => setHistoryLoading(false));
  }, [router]);

  function handleSignOut() {
    clearToken();
    router.replace("/login");
  }

  async function handleDeleteDocument(id: number, e: React.MouseEvent) {
    e.stopPropagation();
    const prev = history;
    setHistory((h) => h.filter((d) => d.id !== id));
    try {
      await deleteDocument(id);
    } catch {
      setHistory(prev); // revert on failure
    }
  }

  function openSavedDocument(doc: SavedDocument) {
    // Write saved fields to sessionStorage so the shell can restore them on mount
    sessionStorage.setItem(`prelegal_load_${doc.document_type}`, doc.fields_json);
    router.push(`/doc/${doc.document_type}`);
  }

  if (!ready) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
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
            onClick={handleSignOut}
            className="text-sm font-medium px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            style={{ color: "#888888" }}
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-8 py-10 space-y-12">
        {/* New document */}
        <section>
          <div className="mb-6">
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
        </section>

        {/* My Documents */}
        <section>
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-1" style={{ color: "#032147" }}>
              My Documents
            </h2>
            <p className="text-sm" style={{ color: "#888888" }}>
              Previously saved drafts. Note: documents are reset when the server restarts.
            </p>
          </div>

          {historyLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => <HistorySkeletonCard key={i} />)}
            </div>
          ) : history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 bg-white rounded-xl border border-gray-200 border-dashed">
              <span className="text-3xl mb-3">📂</span>
              <p className="text-sm font-medium mb-1" style={{ color: "#032147" }}>
                No saved documents yet
              </p>
              <p className="text-xs" style={{ color: "#888888" }}>
                Use the Save button on any document page to store your progress here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {history.map((doc) => (
                <button
                  key={doc.id}
                  onClick={() => openSavedDocument(doc)}
                  className="text-left bg-white rounded-xl border border-gray-200 p-4 hover:border-[#209dd7] hover:shadow-md transition-all group relative"
                >
                  <div className="flex items-start gap-3 pr-6">
                    <span className="text-xl shrink-0 mt-0.5">{ICONS[doc.document_type] ?? "📄"}</span>
                    <div className="min-w-0">
                      <p
                        className="font-semibold text-sm mb-0.5 group-hover:text-[#209dd7] transition-colors truncate"
                        style={{ color: "#032147" }}
                      >
                        {doc.document_name}
                      </p>
                      <p className="text-xs" style={{ color: "#888888" }}>
                        {formatDate(doc.created_at)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => handleDeleteDocument(doc.id, e)}
                    className="absolute top-3 right-3 text-gray-300 hover:text-red-400 transition-colors p-1 rounded"
                    title="Delete"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </button>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
