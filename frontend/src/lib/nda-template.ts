import { NDAFormData } from "@/types/nda";

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function pluralYears(n: number): string {
  return `${n} ${n === 1 ? "year" : "years"}`;
}

function formatDate(iso: string): string {
  if (!iso) return "[Date]";
  const [y, m, d] = iso.split("-");
  const date = new Date(Number(y), Number(m) - 1, Number(d));
  if (isNaN(date.getTime())) return "[Date]";
  return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function mndaTermLabel(data: NDAFormData): string {
  if (data.mndaTermType === "until_terminated") return "the date it is terminated";
  return `${pluralYears(data.mndaTermYears)} from the Effective Date`;
}

function confidentialityTermLabel(data: NDAFormData): string {
  if (data.confidentialityTermType === "perpetuity") return "in perpetuity";
  return `${pluralYears(data.confidentialityTermYears)} from the Effective Date, but in the case of trade secrets until Confidential Information is no longer considered a trade secret under applicable laws`;
}

// Replaces <span class="coverpage_link">FieldName</span> tokens in the Standard Terms.
function substituteTokens(template: string, values: Record<string, string>): string {
  return template.replace(
    /<span class="coverpage_link">([^<]+)<\/span>/g,
    (_, field) => `<strong>${values[field] ?? `[${field}]`}</strong>`
  );
}

export function buildCoverPageHtml(data: NDAFormData): string {
  const mndaTermDisplay =
    data.mndaTermType === "expires"
      ? `Expires ${pluralYears(data.mndaTermYears)} from Effective Date`
      : "Continues until terminated in accordance with the terms of the MNDA";

  const confTermDisplay =
    data.confidentialityTermType === "years"
      ? `${pluralYears(data.confidentialityTermYears)} from Effective Date, but in the case of trade secrets until Confidential Information is no longer considered a trade secret under applicable laws`
      : "In perpetuity";

  const row = (label: string, v1: string, v2: string) => `
    <tr>
      <td class="border border-gray-400 px-3 py-2 font-medium text-sm">${esc(label)}</td>
      <td class="border border-gray-400 px-3 py-2 text-sm">${esc(v1)}</td>
      <td class="border border-gray-400 px-3 py-2 text-sm">${esc(v2)}</td>
    </tr>`;

  const p1 = data.party1;
  const p2 = data.party2;

  return `
    <h1 class="text-2xl font-bold text-center mb-6">Mutual Non-Disclosure Agreement</h1>

    <h2 class="text-base font-semibold mb-2">USING THIS MUTUAL NON-DISCLOSURE AGREEMENT</h2>
    <p class="text-sm mb-4">
      This Mutual Non-Disclosure Agreement (the "MNDA") consists of: (1) this Cover Page ("Cover Page") and
      (2) the Common Paper Mutual NDA Standard Terms Version 1.0 ("Standard Terms") identical to those posted at
      <a href="https://commonpaper.com/standards/mutual-nda/1.0" class="text-blue-600 underline">commonpaper.com/standards/mutual-nda/1.0</a>.
      Any modifications of the Standard Terms should be made on the Cover Page, which will control over conflicts with the Standard Terms.
    </p>

    <h3 class="font-semibold mt-4 mb-1">Purpose</h3>
    <p class="text-sm italic text-gray-500 mb-1">How Confidential Information may be used</p>
    <p class="text-sm mb-4">${esc(data.purpose) || "[Purpose]"}</p>

    <h3 class="font-semibold mt-4 mb-1">Effective Date</h3>
    <p class="text-sm mb-4">${formatDate(data.effectiveDate)}</p>

    <h3 class="font-semibold mt-4 mb-1">MNDA Term</h3>
    <p class="text-sm italic text-gray-500 mb-1">The length of this MNDA</p>
    <p class="text-sm mb-4">${mndaTermDisplay}</p>

    <h3 class="font-semibold mt-4 mb-1">Term of Confidentiality</h3>
    <p class="text-sm italic text-gray-500 mb-1">How long Confidential Information is protected</p>
    <p class="text-sm mb-4">${confTermDisplay}</p>

    <h3 class="font-semibold mt-4 mb-1">Governing Law &amp; Jurisdiction</h3>
    <p class="text-sm mb-1">Governing Law: ${esc(data.governingLaw) || "[Fill in state]"}</p>
    <p class="text-sm mb-4">Jurisdiction: ${esc(data.jurisdiction) || "[Fill in city or county and state]"}</p>

    <h3 class="font-semibold mt-4 mb-1">MNDA Modifications</h3>
    <p class="text-sm mb-4">${esc(data.modifications) || "None"}</p>

    <p class="text-sm mb-4">By signing this Cover Page, each party agrees to enter into this MNDA as of the Effective Date.</p>

    <table class="w-full border-collapse mb-6 text-sm">
      <thead>
        <tr>
          <th class="border border-gray-400 px-3 py-2 text-left bg-gray-100"></th>
          <th class="border border-gray-400 px-3 py-2 text-center bg-gray-100">PARTY 1</th>
          <th class="border border-gray-400 px-3 py-2 text-center bg-gray-100">PARTY 2</th>
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
  `;
}

const STANDARD_TERMS_TEMPLATE = `
<h2 class="text-xl font-bold mt-8 mb-4">Standard Terms</h2>

<p class="text-sm mb-3"><strong>1. Introduction.</strong> This Mutual Non-Disclosure Agreement (which incorporates these Standard Terms and the Cover Page (defined below)) ("MNDA") allows each party ("Disclosing Party") to disclose or make available information in connection with the <span class="coverpage_link">Purpose</span> which (1) the Disclosing Party identifies to the receiving party ("Receiving Party") as "confidential", "proprietary", or the like or (2) should be reasonably understood as confidential or proprietary due to its nature and the circumstances of its disclosure ("Confidential Information"). Each party's Confidential Information also includes the existence and status of the parties' discussions and information on the Cover Page. Confidential Information includes technical or business information, product designs or roadmaps, requirements, pricing, security and compliance documentation, technology, inventions and know-how. To use this MNDA, the parties must complete and sign a cover page incorporating these Standard Terms ("Cover Page"). Each party is identified on the Cover Page and capitalized terms have the meanings given herein or on the Cover Page.</p>

<p class="text-sm mb-3"><strong>2. Use and Protection of Confidential Information.</strong> The Receiving Party shall: (a) use Confidential Information solely for the <span class="coverpage_link">Purpose</span>; (b) not disclose Confidential Information to third parties without the Disclosing Party's prior written approval, except that the Receiving Party may disclose Confidential Information to its employees, agents, advisors, contractors and other representatives having a reasonable need to know for the <span class="coverpage_link">Purpose</span>, provided these representatives are bound by confidentiality obligations no less protective of the Disclosing Party than the applicable terms in this MNDA and the Receiving Party remains responsible for their compliance with this MNDA; and (c) protect Confidential Information using at least the same protections the Receiving Party uses for its own similar information but no less than a reasonable standard of care.</p>

<p class="text-sm mb-3"><strong>3. Exceptions.</strong> The Receiving Party's obligations in this MNDA do not apply to information that it can demonstrate: (a) is or becomes publicly available through no fault of the Receiving Party; (b) it rightfully knew or possessed prior to receipt from the Disclosing Party without confidentiality restrictions; (c) it rightfully obtained from a third party without confidentiality restrictions; or (d) it independently developed without using or referencing the Confidential Information.</p>

<p class="text-sm mb-3"><strong>4. Disclosures Required by Law.</strong> The Receiving Party may disclose Confidential Information to the extent required by law, regulation or regulatory authority, subpoena or court order, provided (to the extent legally permitted) it provides the Disclosing Party reasonable advance notice of the required disclosure and reasonably cooperates, at the Disclosing Party's expense, with the Disclosing Party's efforts to obtain confidential treatment for the Confidential Information.</p>

<p class="text-sm mb-3"><strong>5. Term and Termination.</strong> This MNDA commences on the <span class="coverpage_link">Effective Date</span> and expires at the end of the <span class="coverpage_link">MNDA Term</span>. Either party may terminate this MNDA for any or no reason upon written notice to the other party. The Receiving Party's obligations relating to Confidential Information will survive for the <span class="coverpage_link">Term of Confidentiality</span>, despite any expiration or termination of this MNDA.</p>

<p class="text-sm mb-3"><strong>6. Return or Destruction of Confidential Information.</strong> Upon expiration or termination of this MNDA or upon the Disclosing Party's earlier request, the Receiving Party will: (a) cease using Confidential Information; (b) promptly after the Disclosing Party's written request, destroy all Confidential Information in the Receiving Party's possession or control or return it to the Disclosing Party; and (c) if requested by the Disclosing Party, confirm its compliance with these obligations in writing. As an exception to subsection (b), the Receiving Party may retain Confidential Information in accordance with its standard backup or record retention policies or as required by law, but the terms of this MNDA will continue to apply to the retained Confidential Information.</p>

<p class="text-sm mb-3"><strong>7. Proprietary Rights.</strong> The Disclosing Party retains all of its intellectual property and other rights in its Confidential Information and its disclosure to the Receiving Party grants no license under such rights.</p>

<p class="text-sm mb-3"><strong>8. Disclaimer.</strong> ALL CONFIDENTIAL INFORMATION IS PROVIDED "AS IS", WITH ALL FAULTS, AND WITHOUT WARRANTIES, INCLUDING THE IMPLIED WARRANTIES OF TITLE, MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE.</p>

<p class="text-sm mb-3"><strong>9. Governing Law and Jurisdiction.</strong> This MNDA and all matters relating hereto are governed by, and construed in accordance with, the laws of the State of <span class="coverpage_link">Governing Law</span>, without regard to the conflict of laws provisions of such <span class="coverpage_link">Governing Law</span>. Any legal suit, action, or proceeding relating to this MNDA must be instituted in the federal or state courts located in <span class="coverpage_link">Jurisdiction</span>. Each party irrevocably submits to the exclusive jurisdiction of such <span class="coverpage_link">Jurisdiction</span> in any such suit, action, or proceeding.</p>

<p class="text-sm mb-3"><strong>10. Equitable Relief.</strong> A breach of this MNDA may cause irreparable harm for which monetary damages are an insufficient remedy. Upon a breach of this MNDA, the Disclosing Party is entitled to seek appropriate equitable relief, including an injunction, in addition to its other remedies.</p>

<p class="text-sm mb-3"><strong>11. General.</strong> Neither party has an obligation under this MNDA to disclose Confidential Information to the other or proceed with any proposed transaction. Neither party may assign this MNDA without the prior written consent of the other party, except that either party may assign this MNDA in connection with a merger, reorganization, acquisition or other transfer of all or substantially all its assets or voting securities. Any assignment in violation of this Section is null and void. This MNDA will bind and inure to the benefit of each party's permitted successors and assigns. Waivers must be signed by the waiving party's authorized representative and cannot be implied from conduct. If any provision of this MNDA is held unenforceable, it will be limited to the minimum extent necessary so the rest of this MNDA remains in effect. This MNDA (including the Cover Page) constitutes the entire agreement of the parties with respect to its subject matter, and supersedes all prior and contemporaneous understandings, agreements, representations, and warranties, whether written or oral, regarding such subject matter. This MNDA may only be amended, modified, waived, or supplemented by an agreement in writing signed by both parties. Notices, requests and approvals under this MNDA must be sent in writing to the email or postal addresses on the Cover Page and are deemed delivered on receipt. This MNDA may be executed in counterparts, including electronic copies, each of which is deemed an original and which together form the same agreement.</p>

<p class="text-xs text-gray-500 mt-8 border-t pt-4">Common Paper Mutual Non-Disclosure Agreement Version 1.0 free to use under <a href="https://creativecommons.org/licenses/by/4.0/" class="underline">CC BY 4.0</a>.</p>
`;

export function buildDocumentHtml(data: NDAFormData): string {
  const tokenValues: Record<string, string> = {
    Purpose: esc(data.purpose) || "[Purpose]",
    "Effective Date": formatDate(data.effectiveDate),
    "MNDA Term": mndaTermLabel(data),
    "Term of Confidentiality": confidentialityTermLabel(data),
    "Governing Law": esc(data.governingLaw) || "[Governing Law]",
    Jurisdiction: esc(data.jurisdiction) || "[Jurisdiction]",
  };

  const standardTermsHtml = substituteTokens(STANDARD_TERMS_TEMPLATE, tokenValues);
  return buildCoverPageHtml(data) + standardTermsHtml;
}
