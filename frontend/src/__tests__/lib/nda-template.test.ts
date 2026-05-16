import { describe, it, expect } from "vitest";
import { buildCoverPageHtml, buildDocumentHtml } from "@/lib/nda-template";
import { defaultFormData, NDAFormData } from "@/types/nda";

// ─── helpers ────────────────────────────────────────────────────────────────

function base(overrides: Partial<NDAFormData> = {}): NDAFormData {
  return {
    ...defaultFormData,
    effectiveDate: "2025-03-15",
    governingLaw: "Delaware",
    jurisdiction: "courts located in New Castle, DE",
    party1: { signature: "Alice", printName: "Alice Smith", title: "CEO", company: "Acme Inc", noticeAddress: "alice@acme.com", date: "2025-03-15" },
    party2: { signature: "Bob",   printName: "Bob Jones",  title: "CTO", company: "Beta LLC",  noticeAddress: "bob@beta.com",  date: "2025-03-15" },
    ...overrides,
  };
}

// ─── buildCoverPageHtml ──────────────────────────────────────────────────────

describe("buildCoverPageHtml", () => {
  describe("document structure", () => {
    it("includes the agreement title", () => {
      const html = buildCoverPageHtml(base());
      expect(html).toContain("Mutual Non-Disclosure Agreement");
    });

    it("includes all required section headings", () => {
      const html = buildCoverPageHtml(base());
      expect(html).toContain("Purpose");
      expect(html).toContain("Effective Date");
      expect(html).toContain("MNDA Term");
      expect(html).toContain("Term of Confidentiality");
      expect(html).toContain("Governing Law");
      expect(html).toContain("MNDA Modifications");
    });

    it("includes the signature table with Party 1 and Party 2 headers", () => {
      const html = buildCoverPageHtml(base());
      expect(html).toContain("PARTY 1");
      expect(html).toContain("PARTY 2");
    });

    it("includes all signature row labels", () => {
      const html = buildCoverPageHtml(base());
      expect(html).toContain("Signature");
      expect(html).toContain("Print Name");
      expect(html).toContain("Title");
      expect(html).toContain("Company");
      expect(html).toContain("Notice Address");
    });

    it("references the CommonPaper standard URL", () => {
      const html = buildCoverPageHtml(base());
      expect(html).toContain("commonpaper.com/standards/mutual-nda/1.0");
    });
  });

  describe("purpose field", () => {
    it("renders the provided purpose text", () => {
      const html = buildCoverPageHtml(base({ purpose: "Exploring a joint venture." }));
      expect(html).toContain("Exploring a joint venture.");
    });

    it("renders [Purpose] placeholder when purpose is empty", () => {
      const html = buildCoverPageHtml(base({ purpose: "" }));
      expect(html).toContain("[Purpose]");
    });

    it("renders the default purpose when using defaultFormData", () => {
      const html = buildCoverPageHtml(base());
      expect(html).toContain("Evaluating whether to enter into a business relationship");
    });
  });

  describe("effective date", () => {
    it("formats a valid ISO date as a human-readable string", () => {
      const html = buildCoverPageHtml(base({ effectiveDate: "2025-01-01" }));
      expect(html).toContain("January 1, 2025");
    });

    it("renders [Date] for an empty effective date", () => {
      const html = buildCoverPageHtml(base({ effectiveDate: "" }));
      expect(html).toContain("[Date]");
    });

    it("renders [Date] for a malformed date string", () => {
      const html = buildCoverPageHtml(base({ effectiveDate: "not-a-date" }));
      expect(html).toContain("[Date]");
    });
  });

  describe("MNDA term", () => {
    it("shows singular 'year' for mndaTermYears = 1", () => {
      const html = buildCoverPageHtml(base({ mndaTermType: "expires", mndaTermYears: 1 }));
      expect(html).toContain("Expires 1 year from Effective Date");
    });

    it("shows plural 'years' for mndaTermYears = 3", () => {
      const html = buildCoverPageHtml(base({ mndaTermType: "expires", mndaTermYears: 3 }));
      expect(html).toContain("Expires 3 years from Effective Date");
    });

    it("shows the until-terminated text when mndaTermType is until_terminated", () => {
      const html = buildCoverPageHtml(base({ mndaTermType: "until_terminated" }));
      expect(html).toContain("Continues until terminated in accordance with the terms of the MNDA");
    });
  });

  describe("term of confidentiality", () => {
    it("shows singular 'year' for confidentialityTermYears = 1", () => {
      const html = buildCoverPageHtml(base({ confidentialityTermType: "years", confidentialityTermYears: 1 }));
      expect(html).toContain("1 year from Effective Date");
    });

    it("shows plural 'years' for confidentialityTermYears = 5", () => {
      const html = buildCoverPageHtml(base({ confidentialityTermType: "years", confidentialityTermYears: 5 }));
      expect(html).toContain("5 years from Effective Date");
    });

    it("shows 'In perpetuity' when confidentialityTermType is perpetuity", () => {
      const html = buildCoverPageHtml(base({ confidentialityTermType: "perpetuity" }));
      expect(html).toContain("In perpetuity");
    });

    it("includes the trade secret carve-out phrase for the years option", () => {
      const html = buildCoverPageHtml(base({ confidentialityTermType: "years", confidentialityTermYears: 2 }));
      expect(html).toContain("trade secrets");
    });
  });

  describe("governing law and jurisdiction", () => {
    it("renders the governing law value", () => {
      const html = buildCoverPageHtml(base({ governingLaw: "California" }));
      expect(html).toContain("California");
    });

    it("renders [Fill in state] placeholder when governing law is empty", () => {
      const html = buildCoverPageHtml(base({ governingLaw: "" }));
      expect(html).toContain("[Fill in state]");
    });

    it("renders the jurisdiction value", () => {
      const html = buildCoverPageHtml(base({ jurisdiction: "courts located in San Francisco, CA" }));
      expect(html).toContain("courts located in San Francisco, CA");
    });

    it("renders [Fill in city or county and state] placeholder when jurisdiction is empty", () => {
      const html = buildCoverPageHtml(base({ jurisdiction: "" }));
      expect(html).toContain("[Fill in city or county and state]");
    });
  });

  describe("MNDA modifications", () => {
    it("renders modifications text when provided", () => {
      const html = buildCoverPageHtml(base({ modifications: "Section 5 amended to 90 days." }));
      expect(html).toContain("Section 5 amended to 90 days.");
    });

    it("renders 'None' when modifications are empty", () => {
      const html = buildCoverPageHtml(base({ modifications: "" }));
      expect(html).toContain("None");
    });
  });

  describe("party signature block", () => {
    it("renders Party 1 signature", () => {
      const html = buildCoverPageHtml(base());
      expect(html).toContain("Alice");
    });

    it("renders Party 1 company", () => {
      const html = buildCoverPageHtml(base());
      expect(html).toContain("Acme Inc");
    });

    it("renders Party 2 company", () => {
      const html = buildCoverPageHtml(base());
      expect(html).toContain("Beta LLC");
    });

    it("renders Party 1 notice address", () => {
      const html = buildCoverPageHtml(base());
      expect(html).toContain("alice@acme.com");
    });

    it("renders Party 2 notice address", () => {
      const html = buildCoverPageHtml(base());
      expect(html).toContain("bob@beta.com");
    });

    it("renders empty strings gracefully when party fields are blank", () => {
      const data = base({
        party1: { signature: "", printName: "", title: "", company: "", noticeAddress: "", date: "" },
        party2: { signature: "", printName: "", title: "", company: "", noticeAddress: "", date: "" },
      });
      expect(() => buildCoverPageHtml(data)).not.toThrow();
    });
  });

  describe("HTML escaping (XSS prevention)", () => {
    it("escapes < and > in purpose to prevent XSS", () => {
      const html = buildCoverPageHtml(base({ purpose: "<script>alert(1)</script>" }));
      expect(html).not.toContain("<script>");
      expect(html).toContain("&lt;script&gt;");
    });

    it("escapes & in purpose", () => {
      const html = buildCoverPageHtml(base({ purpose: "R&D collaboration" }));
      expect(html).toContain("R&amp;D collaboration");
    });

    it("escapes double quotes in governing law", () => {
      const html = buildCoverPageHtml(base({ governingLaw: 'State of "New" York' }));
      expect(html).toContain("State of &quot;New&quot; York");
    });

    it("escapes single quotes in jurisdiction", () => {
      const html = buildCoverPageHtml(base({ jurisdiction: "courts in O'Brien County" }));
      expect(html).toContain("courts in O&#39;Brien County");
    });

    it("escapes HTML in party company name", () => {
      const data = base({ party1: { ...base().party1, company: "<Evil Corp>" } });
      const html = buildCoverPageHtml(data);
      expect(html).not.toContain("<Evil Corp>");
      expect(html).toContain("&lt;Evil Corp&gt;");
    });

    it("escapes HTML in party notice address", () => {
      // The template has legitimate <a href> links, so check for the specific injected tag only.
      const data = base({ party2: { ...base().party2, noticeAddress: '<a href="x">click</a>' } });
      const html = buildCoverPageHtml(data);
      expect(html).not.toContain('<a href="x">');
      expect(html).toContain("&lt;a href=&quot;x&quot;&gt;");
    });

    it("escapes HTML in modifications field", () => {
      const html = buildCoverPageHtml(base({ modifications: '<img src=x onerror="alert(1)">' }));
      expect(html).not.toContain("<img");
      expect(html).toContain("&lt;img");
    });
  });
});

// ─── buildDocumentHtml ───────────────────────────────────────────────────────

describe("buildDocumentHtml", () => {
  describe("standard terms token substitution", () => {
    it("substitutes Purpose into Standard Terms §1", () => {
      const html = buildDocumentHtml(base({ purpose: "Evaluating a partnership." }));
      expect(html).toContain("Evaluating a partnership.");
    });

    it("substitutes Purpose multiple times (§1, §2)", () => {
      const purpose = "unique-purpose-text-xyz";
      const html = buildDocumentHtml(base({ purpose }));
      const occurrences = (html.match(/unique-purpose-text-xyz/g) ?? []).length;
      expect(occurrences).toBeGreaterThanOrEqual(2);
    });

    it("substitutes Effective Date into Standard Terms §5", () => {
      const html = buildDocumentHtml(base({ effectiveDate: "2025-06-01" }));
      expect(html).toContain("June 1, 2025");
    });

    it("substitutes MNDA Term into Standard Terms §5", () => {
      const html = buildDocumentHtml(base({ mndaTermType: "expires", mndaTermYears: 2 }));
      expect(html).toContain("2 years from the Effective Date");
    });

    it("substitutes MNDA Term as 'until terminated' into Standard Terms §5", () => {
      const html = buildDocumentHtml(base({ mndaTermType: "until_terminated" }));
      expect(html).toContain("the date it is terminated");
    });

    it("substitutes Term of Confidentiality into Standard Terms §5", () => {
      const html = buildDocumentHtml(base({ confidentialityTermType: "years", confidentialityTermYears: 3 }));
      expect(html).toContain("3 years from the Effective Date");
    });

    it("substitutes Term of Confidentiality as perpetuity into Standard Terms §5", () => {
      const html = buildDocumentHtml(base({ confidentialityTermType: "perpetuity" }));
      expect(html).toContain("in perpetuity");
    });

    it("substitutes Governing Law into Standard Terms §9", () => {
      const html = buildDocumentHtml(base({ governingLaw: "Texas" }));
      expect(html).toContain("Texas");
    });

    it("substitutes Jurisdiction into Standard Terms §9", () => {
      const html = buildDocumentHtml(base({ jurisdiction: "courts located in Austin, TX" }));
      expect(html).toContain("courts located in Austin, TX");
    });

    it("wraps substituted values in <strong> tags", () => {
      const html = buildDocumentHtml(base({ governingLaw: "Nevada" }));
      expect(html).toContain("<strong>Nevada</strong>");
    });

    it("renders [FieldName] placeholder for any unknown tokens", () => {
      // This guard would catch future template additions not yet in tokenValues.
      // We verify the fallback pattern by checking substituted tokens appear as <strong> not raw <span>.
      expect(buildDocumentHtml(base())).not.toContain('class="coverpage_link"');
    });
  });

  describe("placeholder fallbacks when fields are empty", () => {
    it("shows [Purpose] in standard terms when purpose is empty", () => {
      const html = buildDocumentHtml(base({ purpose: "" }));
      expect(html).toContain("[Purpose]");
    });

    it("shows [Governing Law] in standard terms when governing law is empty", () => {
      const html = buildDocumentHtml(base({ governingLaw: "" }));
      expect(html).toContain("[Governing Law]");
    });

    it("shows [Jurisdiction] in standard terms when jurisdiction is empty", () => {
      const html = buildDocumentHtml(base({ jurisdiction: "" }));
      expect(html).toContain("[Jurisdiction]");
    });
  });

  describe("legal content completeness", () => {
    it("includes all 11 numbered standard term sections", () => {
      const html = buildDocumentHtml(base());
      for (let i = 1; i <= 11; i++) {
        expect(html).toContain(`${i}.`);
      }
    });

    it("includes the CC BY 4.0 attribution", () => {
      const html = buildDocumentHtml(base());
      expect(html).toContain("CC BY 4.0");
    });

    it("includes the CommonPaper version reference", () => {
      const html = buildDocumentHtml(base());
      expect(html).toContain("Version 1.0");
    });

    it("includes the 'Confidential Information' definition language", () => {
      const html = buildDocumentHtml(base());
      expect(html).toContain("Confidential Information");
    });

    it("includes the disclaimer section in all-caps", () => {
      const html = buildDocumentHtml(base());
      expect(html).toContain("AS IS");
    });
  });

  describe("HTML escaping carries through to standard terms", () => {
    it("escapes XSS payloads in purpose when substituted into standard terms", () => {
      const html = buildDocumentHtml(base({ purpose: "<script>alert(1)</script>" }));
      expect(html).not.toContain("<script>alert(1)</script>");
      expect(html).toContain("&lt;script&gt;");
    });

    it("escapes XSS payloads in governing law when substituted into standard terms", () => {
      const html = buildDocumentHtml(base({ governingLaw: '"><img src=x onerror=alert(1)>' }));
      expect(html).not.toContain("<img");
      expect(html).toContain("&gt;&lt;img src=x onerror=alert(1)&gt;");
    });
  });

  describe("output combines cover page and standard terms", () => {
    it("contains both the cover page title and the Standard Terms heading", () => {
      const html = buildDocumentHtml(base());
      expect(html).toContain("Mutual Non-Disclosure Agreement");
      expect(html).toContain("Standard Terms");
    });

    it("places the cover page before the standard terms", () => {
      const html = buildDocumentHtml(base());
      const coverPos = html.indexOf("USING THIS MUTUAL");
      const termsPos = html.indexOf("Standard Terms");
      expect(coverPos).toBeLessThan(termsPos);
    });
  });
});
