"use client";

import { useRef, useState, useEffect } from "react";
import { DocumentConfig } from "@/lib/document-configs";
import { PartyInfo } from "@/types/nda";

interface GenericFormData {
  fields: Record<string, string>;
  party1: PartyInfo;
  party2: PartyInfo;
}

interface Props {
  config: DocumentConfig;
  data: GenericFormData;
}

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatDate(iso: string): string {
  if (!iso) return "[Date]";
  const [y, m, d] = iso.split("-");
  const date = new Date(Number(y), Number(m) - 1, Number(d));
  if (isNaN(date.getTime())) return "[Date]";
  return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function buildCoverPageHtml(config: DocumentConfig, data: GenericFormData): string {
  const p1 = data.party1;
  const p2 = data.party2;

  const row = (label: string, v1: string, v2: string) => `
    <tr>
      <td class="border border-gray-400 px-3 py-2 font-medium text-sm">${esc(label)}</td>
      <td class="border border-gray-400 px-3 py-2 text-sm">${esc(v1)}</td>
      <td class="border border-gray-400 px-3 py-2 text-sm">${esc(v2)}</td>
    </tr>`;

  const fieldRows = config.fields
    .map((f) => {
      const val = data.fields[f.id] ?? "";
      const display = f.id.toLowerCase().includes("date") && val ? formatDate(val) : esc(val);
      return `
    <tr>
      <td class="border border-gray-300 px-3 py-2 text-sm font-medium bg-gray-50">${esc(f.label)}</td>
      <td class="border border-gray-300 px-3 py-2 text-sm" colspan="2">${display || `<span class="text-gray-400">[${esc(f.label)}]</span>`}</td>
    </tr>`;
    })
    .join("");

  return `
    <h1 class="text-2xl font-bold text-center mb-6">${esc(config.name)}</h1>

    <h2 class="text-base font-semibold mb-3">Key Terms</h2>
    <table class="w-full border-collapse mb-6 text-sm">
      <tbody>
        ${fieldRows}
      </tbody>
    </table>

    <h2 class="text-base font-semibold mb-2">Parties</h2>
    <p class="text-sm mb-4">By signing below, each party agrees to enter into this agreement as of the effective date.</p>

    <table class="w-full border-collapse mb-6 text-sm">
      <thead>
        <tr>
          <th class="border border-gray-400 px-3 py-2 text-left bg-gray-100"></th>
          <th class="border border-gray-400 px-3 py-2 text-center bg-gray-100">${esc(config.party1Label.toUpperCase())}</th>
          <th class="border border-gray-400 px-3 py-2 text-center bg-gray-100">${esc(config.party2Label.toUpperCase())}</th>
        </tr>
      </thead>
      <tbody>
        ${row("Signature", p1.signature, p2.signature)}
        ${row("Print Name", p1.printName, p2.printName)}
        ${row("Title", p1.title, p2.title)}
        ${row("Company", p1.company, p2.company)}
        ${row("Notice Address", p1.noticeAddress, p2.noticeAddress)}
        ${row("Date", p1.date, p2.date)}
      </tbody>
    </table>

    <hr class="border-gray-200 my-6" />
  `;
}

function substituteTokens(html: string, values: Record<string, string>): string {
  return html
    .replace(/<span class="coverpage_link">([^<]+)<\/span>/g, (_, field) =>
      `<strong>${values[field] ?? `[${field}]`}</strong>`
    )
    .replace(/<span class="keyterms_link">([^<]+)<\/span>/g, (_, field) =>
      `<strong>${values[field] ?? `[${field}]`}</strong>`
    )
    .replace(/<span class="orderform_link">([^<]+)<\/span>/g, (_, field) =>
      `<strong>${values[field] ?? `[${field}]`}</strong>`
    )
    .replace(/<span class="header_2"[^>]*>([^<]+)<\/span>/g, (_, text) =>
      `<strong class="text-base">${text}</strong>`
    )
    .replace(/<span class="header_3"[^>]*>([^<]+)<\/span>/g, (_, text) =>
      `<strong>${text}</strong>`
    );
}

export default function GenericDocPreview({ config, data }: Props) {
  const previewRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [templateHtml, setTemplateHtml] = useState<string>("");

  useEffect(() => {
    fetch(`/api/templates/${config.templateFile}`)
      .then((r) => r.text())
      .then(setTemplateHtml)
      .catch(() => setTemplateHtml(""));
  }, [config.templateFile]);

  function buildTokenValues(): Record<string, string> {
    const vals: Record<string, string> = {};
    vals[config.party1Label] = esc(data.party1.company) || `[${config.party1Label}]`;
    vals[config.party2Label] = esc(data.party2.company) || `[${config.party2Label}]`;
    for (const [k, v] of Object.entries(data.fields)) {
      if (v) vals[k] = esc(v);
    }
    for (const fieldDef of config.fields) {
      const val = data.fields[fieldDef.id];
      if (val) vals[fieldDef.label] = esc(val);
    }
    return vals;
  }

  function buildDocumentHtml(): string {
    const coverPage = buildCoverPageHtml(config, data);
    const tokenValues = buildTokenValues();
    const standardTerms = substituteTokens(templateHtml, tokenValues);
    return coverPage + `<div class="standard-terms text-sm leading-relaxed">${standardTerms}</div>`;
  }

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
          clonedDoc.querySelectorAll("style, link[rel='stylesheet']").forEach((n) => n.remove());
          clonedEl.style.width = captureWidth + "px";
          clonedEl.style.maxWidth = captureWidth + "px";
          clonedEl.style.padding = "32px";
          const s = clonedDoc.createElement("style");
          s.textContent = `
            * { box-sizing: border-box; }
            body { font-family: Arial, Helvetica, sans-serif; color: #111827; background: #fff; margin: 0; }
            h1 { font-size: 22px; font-weight: 700; text-align: center; margin: 0 0 24px; }
            h2 { font-size: 15px; font-weight: 600; margin: 16px 0 8px; }
            h3 { font-size: 13px; font-weight: 600; margin: 12px 0 4px; }
            p  { font-size: 13px; margin: 0 0 10px; line-height: 1.6; color: #111827; }
            strong { font-weight: 700; }
            a  { color: #2563eb; text-decoration: underline; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
            th { border: 1px solid #9ca3af; padding: 8px 12px; background: #f3f4f6; font-size: 13px; font-weight: 600; text-align: left; color: #111827; }
            td { border: 1px solid #9ca3af; padding: 8px 12px; font-size: 13px; color: #111827; }
            ol, ul { padding-left: 20px; margin: 0 0 10px; }
            li { font-size: 13px; line-height: 1.6; margin-bottom: 4px; }
            code { font-family: monospace; font-size: 12px; }
          `;
          clonedDoc.head.appendChild(s);
        },
      });

      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const contentWidth = pageWidth - margin * 2;
      const imgHeight = (canvas.height * contentWidth) / canvas.width;

      let y = margin;
      let remaining = imgHeight;

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

      const filename = config.slug + ".pdf";
      pdf.save(filename);
    } finally {
      setDownloading(false);
    }
  }

  const html = buildDocumentHtml();

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
