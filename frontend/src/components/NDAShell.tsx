"use client";

import { useState } from "react";
import NDAForm from "@/components/NDAForm";
import NDAPreview from "@/components/NDAPreview";
import { defaultFormData, NDAFormData } from "@/types/nda";

export default function NDAShell() {
  const [formData, setFormData] = useState<NDAFormData>(defaultFormData);

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="w-[420px] shrink-0 border-r border-gray-200 bg-white overflow-y-auto">
        <NDAForm data={formData} onChange={setFormData} />
      </aside>
      <main className="flex-1 overflow-hidden">
        <NDAPreview data={formData} />
      </main>
    </div>
  );
}
