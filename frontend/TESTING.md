# Manual Test Plan — Mutual NDA Creator

## Setup

```bash
cd frontend
npm install
npm run dev        # starts at http://localhost:3000
```

---

## 1. Initial Load

| # | Step | Expected |
|---|------|----------|
| 1.1 | Open `http://localhost:3000` | Page loads with a two-column layout: form on the left, document preview on the right |
| 1.2 | Check the form column | Shows "Mutual NDA Creator" heading, all sections present (Agreement Terms, Party 1, Party 2) |
| 1.3 | Check the preview column | Shows "Document Preview" header, a "Download PDF" button, and the rendered NDA with placeholder values |
| 1.4 | Check default Purpose text | Preview shows "Evaluating whether to enter into a business relationship with the other party." |
| 1.5 | Check default Effective Date | Effective date in the preview is today's date formatted as "Month D, YYYY" |
| 1.6 | Check default MNDA Term | "Expires 1 year from Effective Date" appears in preview |
| 1.7 | Check empty fields | Governing Law shows `[Fill in state]`, Jurisdiction shows `[Fill in city or county and state]` |

---

## 2. Form → Preview Live Updates

| # | Step | Expected |
|---|------|----------|
| 2.1 | Change Purpose to "Testing collaboration agreement." | Preview updates immediately; new text appears in the cover page Purpose section AND bolded in Standard Terms §1 and §2 |
| 2.2 | Change Governing Law to "California" | Preview shows "California" in the cover page and bolded in Standard Terms §9 (appears twice in §9) |
| 2.3 | Change Jurisdiction to "courts located in Los Angeles, CA" | Preview shows this text in both the cover page and bolded in Standard Terms §9 |
| 2.4 | Change Effective Date to 2025-06-15 | Preview shows "June 15, 2025" in both the cover page and bolded in Standard Terms §5 |
| 2.5 | Select "Continues until terminated" radio | Preview shows "Continues until terminated in accordance with the terms of the MNDA" in cover page; Standard Terms §5 shows "the date it is terminated" |
| 2.6 | Switch back to "Expires after" and set years to 3 | Preview shows "Expires 3 years from Effective Date" (plural) in cover page; Standard Terms §5 shows "3 years from the Effective Date" |
| 2.7 | Set years to 1 | Preview shows "Expires 1 year from Effective Date" (singular) |
| 2.8 | Select "In perpetuity" for Term of Confidentiality | Preview shows "In perpetuity" in cover page; Standard Terms §5 shows "in perpetuity" |
| 2.9 | Type modifications text | Appears in the MNDA Modifications section of the preview |
| 2.10 | Leave modifications blank | Preview shows "None" |

---

## 3. Party Signature Fields

| # | Step | Expected |
|---|------|----------|
| 3.1 | Fill in Party 1: Signature "Alice Smith", Print Name "Alice Smith", Title "CEO", Company "Acme Inc", Notice Address "alice@acme.com", Date "2025-03-15" | All values appear in their respective table cells in the preview signature table |
| 3.2 | Fill in Party 2: Signature "Bob Jones", Print Name "Bob Jones", Title "CTO", Company "Beta LLC", Notice Address "bob@beta.com", Date "2025-03-15" | All values appear in the Party 2 column of the signature table |
| 3.3 | Verify Party 1 and Party 2 edits are independent | Changing a Party 1 field does not affect Party 2 fields and vice versa |

---

## 4. Edge Cases — Empty and Partial Input

| # | Step | Expected |
|---|------|----------|
| 4.1 | Clear the Effective Date field | Preview shows "[Date]" in the Effective Date section and Standard Terms |
| 4.2 | Clear the MNDA term year input | Input snaps back to 1; preview shows "Expires 1 year from Effective Date" |
| 4.3 | Type 0 in the MNDA term year input | Input snaps to 1 |
| 4.4 | Clear Purpose | Preview shows "[Purpose]" in cover page and in Standard Terms |
| 4.5 | Clear Governing Law | Preview shows "[Fill in state]" in cover page and "[Governing Law]" in Standard Terms |
| 4.6 | Clear Jurisdiction | Preview shows "[Fill in city or county and state]" in cover page and "[Jurisdiction]" in Standard Terms |

---

## 5. XSS Prevention

| # | Step | Expected |
|---|------|----------|
| 5.1 | Type `<script>alert(1)</script>` in Purpose | Preview shows the text literally as `<script>alert(1)</script>` — no alert fires, no HTML executes |
| 5.2 | Type `<b>bold</b>` in Governing Law | Preview shows the literal string `<b>bold</b>`, not bold text |
| 5.3 | Type `"><img src=x onerror=alert(1)>` in Party 1 Company | Preview shows the escaped text; no alert fires |

---

## 6. PDF Download

| # | Step | Expected |
|---|------|----------|
| 6.1 | Click "Download PDF" with default (empty) form | Button shows spinner and "Generating PDF…" text while working; a file named `mutual-nda.pdf` is downloaded |
| 6.2 | Open the downloaded PDF | PDF opens and contains the NDA content; placeholder text like "[Fill in state]" appears for empty fields |
| 6.3 | Fill in all fields, then click "Download PDF" | Downloaded PDF contains all filled-in values in both the cover page and Standard Terms |
| 6.4 | Verify PDF multi-page | With full content, the PDF should span multiple A4 pages with no content cut off |
| 6.5 | Verify PDF attribution | Last section of the PDF includes "Common Paper Mutual Non-Disclosure Agreement Version 1.0 free to use under CC BY 4.0" |
| 6.6 | Click Download PDF a second time | Button is re-enabled after the first download; second click generates a fresh PDF |

---

## 7. Legal Content Completeness

| # | Step | Expected |
|---|------|----------|
| 7.1 | Scroll the preview to the Standard Terms | All 11 sections are present (1. Introduction through 11. General) |
| 7.2 | Check §9 Governing Law and Jurisdiction | Contains the user-entered state and jurisdiction values, both bolded |
| 7.3 | Check CC BY 4.0 attribution at the bottom of the preview | Attribution line reads "Common Paper Mutual Non-Disclosure Agreement Version 1.0 free to use under CC BY 4.0" with a link |

---

## 8. Automated Tests

```bash
npm test                  # run all 99 tests once
npm run test:watch        # re-run on file changes
npm run test:coverage     # generate coverage report
```

All 99 tests should pass. The `toDataURL` warnings from jsdom are expected (no canvas in the test environment) and do not indicate test failures.
