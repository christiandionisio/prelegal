"use client";

import Link from "next/link";

interface Props {
  docName: string;
  onSave: () => void;
  saving: boolean;
  saved: boolean;
}

export default function DocHeader({ docName, onSave, saving, saved }: Props) {
  return (
    <header className="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-200 shrink-0">
      <Link
        href="/"
        className="text-sm font-medium hover:underline"
        style={{ color: "#209dd7" }}
      >
        ← Documents
      </Link>
      <span className="text-gray-300">|</span>
      <span className="text-sm font-semibold flex-1 truncate" style={{ color: "#032147" }}>
        {docName}
      </span>

      <button
        onClick={onSave}
        disabled={saving}
        className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors disabled:opacity-60"
        style={{
          borderColor: saved ? "#22c55e" : "#209dd7",
          color: saved ? "#22c55e" : "#209dd7",
        }}
      >
        {saving ? (
          <>
            <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Saving…
          </>
        ) : saved ? (
          <>
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Saved
          </>
        ) : (
          <>
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
            Save
          </>
        )}
      </button>
    </header>
  );
}
