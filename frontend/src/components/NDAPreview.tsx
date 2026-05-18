"use client";

import { useRef, useState } from "react";
import { NDAFormData } from "@/types/nda";
import { buildDocumentHtml } from "@/lib/nda-template";

interface Props {
  data: NDAFormData;
}

export default function NDAPreview({ data }: Props) {
  const previewRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  const html = buildDocumentHtml(data);

  async function handleDownload() {
    if (!previewRef.current) return;
    setDownloading(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const jsPDF = (await import("jspdf")).jsPDF;

      const el = previewRef.current;
      const captureWidth = el.scrollWidth;
      const captureHeight = el.scrollHeight;

      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        scrollX: 0,
        scrollY: 0,
        windowWidth: captureWidth,
        windowHeight: captureHeight,
        width: captureWidth,
        height: captureHeight,
        onclone: (clonedDoc, clonedEl) => {
          // html2canvas v1 can't parse oklch/lab colors that Tailwind v4 emits.
          // Strip all stylesheets from the clone and replace with safe hex-only CSS.
          clonedDoc.querySelectorAll("style, link[rel='stylesheet']").forEach(n => n.remove());

          // Without Tailwind, max-w-3xl is gone — pin the clone to the original width
          // so the table columns don't expand beyond the captured area.
          clonedEl.style.width = captureWidth + "px";
          clonedEl.style.maxWidth = captureWidth + "px";
          clonedEl.style.padding = "32px";

          const s = clonedDoc.createElement("style");
          s.textContent = `
            * { box-sizing: border-box; }
            body { font-family: Arial, Helvetica, sans-serif; color: #111827; background: #fff; margin: 0; }
            h1 { font-size: 22px; font-weight: 700; text-align: center; margin: 0 0 24px; }
            h2 { font-size: 15px; font-weight: 600; margin: 0 0 8px; }
            h3 { font-size: 13px; font-weight: 600; margin: 16px 0 4px; }
            p  { font-size: 13px; margin: 0 0 10px; line-height: 1.6; color: #111827; }
            strong { font-weight: 700; }
            a  { color: #2563eb; text-decoration: underline; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
            th { border: 1px solid #9ca3af; padding: 8px 12px; background: #f3f4f6; font-size: 13px; font-weight: 600; text-align: left; color: #111827; }
            td { border: 1px solid #9ca3af; padding: 8px 12px; font-size: 13px; color: #111827; }
          `;
          clonedDoc.head.appendChild(s);
        },
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const contentWidth = pageWidth - margin * 2;
      const imgHeight = (canvas.height * contentWidth) / canvas.width;

      let y = margin;
      let remaining = imgHeight;

      // Slice the image across multiple PDF pages
      while (remaining > 0) {
        const sliceHeight = Math.min(remaining, pageHeight - margin * 2);
        const srcY = ((imgHeight - remaining) / imgHeight) * canvas.height;
        const srcHeight = (sliceHeight / imgHeight) * canvas.height;

        const sliceCanvas = document.createElement("canvas");
        sliceCanvas.width = canvas.width;
        sliceCanvas.height = srcHeight;
        const ctx = sliceCanvas.getContext("2d")!;
        ctx.drawImage(canvas, 0, srcY, canvas.width, srcHeight, 0, 0, canvas.width, srcHeight);

        pdf.addImage(sliceCanvas.toDataURL("image/png"), "PNG", margin, y, contentWidth, sliceHeight);
        remaining -= sliceHeight;
        if (remaining > 0) {
          pdf.addPage();
          y = margin;
        }
      }

      pdf.save("mutual-nda.pdf");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="flex flex-col h-full bg-gray-50 border-l border-gray-200">
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200 shrink-0">
        <span className="text-sm font-semibold text-gray-700">Document Preview</span>
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors"
        >
          {downloading ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Generating PDF…
            </>
          ) : (
            <>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
              </svg>
              Download PDF
            </>
          )}
        </button>
      </div>

      <div className="overflow-y-auto flex-1 px-6 py-6">
        <div
          ref={previewRef}
          className="bg-white shadow-sm rounded-lg p-8 max-w-3xl mx-auto"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    </div>
  );
}
