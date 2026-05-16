"use client";

import { NDAFormData, PartyInfo } from "@/types/nda";

interface Props {
  data: NDAFormData;
  onChange: (data: NDAFormData) => void;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mt-6 mb-3 border-b pb-1">{children}</h2>;
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {hint && <span className="ml-1 text-xs font-normal text-gray-400">({hint})</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls = "w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400";
const textareaCls = `${inputCls} resize-none`;

function PartyFields({
  label,
  value,
  onChange,
}: {
  label: string;
  value: PartyInfo;
  onChange: (v: PartyInfo) => void;
}) {
  const set = (key: keyof PartyInfo) => (e: React.ChangeEvent<HTMLInputElement>) =>
    onChange({ ...value, [key]: e.target.value });

  return (
    <div>
      <SectionTitle>{label}</SectionTitle>
      <Field label="Signature (typed name)">
        <input className={inputCls} value={value.signature} onChange={set("signature")} placeholder="Full legal name" />
      </Field>
      <Field label="Print Name">
        <input className={inputCls} value={value.printName} onChange={set("printName")} placeholder="Full name" />
      </Field>
      <Field label="Title">
        <input className={inputCls} value={value.title} onChange={set("title")} placeholder="e.g. CEO" />
      </Field>
      <Field label="Company">
        <input className={inputCls} value={value.company} onChange={set("company")} placeholder="Company name" />
      </Field>
      <Field label="Notice Address" hint="email or postal">
        <input className={inputCls} value={value.noticeAddress} onChange={set("noticeAddress")} placeholder="email@example.com" />
      </Field>
      <Field label="Date">
        <input type="date" className={inputCls} value={value.date} onChange={set("date")} />
      </Field>
    </div>
  );
}

export default function NDAForm({ data, onChange }: Props) {
  const set = <K extends keyof NDAFormData>(key: K) =>
    (val: NDAFormData[K]) => onChange({ ...data, [key]: val });

  return (
    <div className="px-6 py-6 overflow-y-auto h-full">
      <h1 className="text-lg font-bold text-gray-900 mb-1">Mutual NDA Creator</h1>
      <p className="text-xs text-gray-400 mb-4">Fill in the fields below to generate your agreement.</p>

      <SectionTitle>Agreement Terms</SectionTitle>

      <Field label="Purpose" hint="how confidential information may be used">
        <textarea
          className={textareaCls}
          rows={3}
          value={data.purpose}
          onChange={(e) => set("purpose")(e.target.value)}
        />
      </Field>

      <Field label="Effective Date">
        <input
          type="date"
          className={inputCls}
          value={data.effectiveDate}
          onChange={(e) => set("effectiveDate")(e.target.value)}
        />
      </Field>

      <Field label="MNDA Term" hint="length of this agreement">
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="radio"
              checked={data.mndaTermType === "expires"}
              onChange={() => set("mndaTermType")("expires")}
            />
            Expires after
            <input
              type="number"
              min={1}
              className="w-16 border border-gray-300 rounded px-2 py-1 text-sm"
              value={data.mndaTermYears}
              onChange={(e) => { const v = parseInt(e.target.value, 10); set("mndaTermYears")(isNaN(v) || v < 1 ? 1 : v); }}
              disabled={data.mndaTermType !== "expires"}
            />
            year(s) from Effective Date
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="radio"
              checked={data.mndaTermType === "until_terminated"}
              onChange={() => set("mndaTermType")("until_terminated")}
            />
            Continues until terminated
          </label>
        </div>
      </Field>

      <Field label="Term of Confidentiality" hint="how long confidential information is protected">
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="radio"
              checked={data.confidentialityTermType === "years"}
              onChange={() => set("confidentialityTermType")("years")}
            />
            <input
              type="number"
              min={1}
              className="w-16 border border-gray-300 rounded px-2 py-1 text-sm"
              value={data.confidentialityTermYears}
              onChange={(e) => { const v = parseInt(e.target.value, 10); set("confidentialityTermYears")(isNaN(v) || v < 1 ? 1 : v); }}
              disabled={data.confidentialityTermType !== "years"}
            />
            year(s) from Effective Date (+ trade secret carve-out)
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="radio"
              checked={data.confidentialityTermType === "perpetuity"}
              onChange={() => set("confidentialityTermType")("perpetuity")}
            />
            In perpetuity
          </label>
        </div>
      </Field>

      <Field label="Governing Law" hint="state whose laws govern">
        <input
          className={inputCls}
          value={data.governingLaw}
          onChange={(e) => set("governingLaw")(e.target.value)}
          placeholder="e.g. Delaware"
        />
      </Field>

      <Field label="Jurisdiction" hint="where lawsuits are filed">
        <input
          className={inputCls}
          value={data.jurisdiction}
          onChange={(e) => set("jurisdiction")(e.target.value)}
          placeholder='e.g. courts located in New Castle, DE'
        />
      </Field>

      <Field label="MNDA Modifications" hint="optional">
        <textarea
          className={textareaCls}
          rows={3}
          value={data.modifications}
          onChange={(e) => set("modifications")(e.target.value)}
          placeholder="List any modifications to the MNDA, or leave blank"
        />
      </Field>

      <PartyFields
        label="Party 1"
        value={data.party1}
        onChange={set("party1")}
      />

      <PartyFields
        label="Party 2"
        value={data.party2}
        onChange={set("party2")}
      />
    </div>
  );
}
