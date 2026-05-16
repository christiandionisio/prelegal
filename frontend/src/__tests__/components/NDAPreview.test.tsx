import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import NDAPreview from "@/components/NDAPreview";
import { defaultFormData, NDAFormData } from "@/types/nda";

// ─── mocks ───────────────────────────────────────────────────────────────────

vi.mock("html2canvas", () => ({
  default: vi.fn().mockResolvedValue({
    width: 800,
    height: 1200,
    toDataURL: vi.fn().mockReturnValue("data:image/png;base64,fake"),
  }),
}));

// Capture the jsPDF instance created during the download so tests can assert
// on its methods (save, addImage) rather than just button state.
type FakeJsPDF = {
  internal: { pageSize: { getWidth: () => number; getHeight: () => number } };
  addImage: ReturnType<typeof vi.fn>;
  addPage: ReturnType<typeof vi.fn>;
  save: ReturnType<typeof vi.fn>;
};
let capturedPdf: FakeJsPDF | null = null;

vi.mock("jspdf", () => {
  // Must be a regular function (not arrow) so `new jsPDF()` works as a constructor.
  const jsPDF = vi.fn(function (this: object) {
    const instance: FakeJsPDF = {
      internal: { pageSize: { getWidth: () => 210, getHeight: () => 297 } },
      addImage: vi.fn(),
      addPage: vi.fn(),
      save: vi.fn(),
    };
    capturedPdf = instance;
    Object.assign(this, instance);
  });
  return { jsPDF };
});

function base(overrides: Partial<NDAFormData> = {}): NDAFormData {
  return {
    ...defaultFormData,
    effectiveDate: "2025-03-15",
    governingLaw: "Delaware",
    jurisdiction: "courts located in New Castle, DE",
    ...overrides,
  };
}

async function clickDownloadAndWait() {
  fireEvent.click(screen.getByRole("button", { name: /download pdf/i }));
  await waitFor(() =>
    expect(screen.getByRole("button", { name: /download pdf/i })).not.toBeDisabled()
  );
}

// ─── rendering ───────────────────────────────────────────────────────────────

describe("NDAPreview rendering", () => {
  it("renders the Document Preview label", () => {
    render(<NDAPreview data={base()} />);
    expect(screen.getByText("Document Preview")).toBeInTheDocument();
  });

  it("renders the Download PDF button", () => {
    render(<NDAPreview data={base()} />);
    expect(screen.getByRole("button", { name: /download pdf/i })).toBeInTheDocument();
  });

  it("renders an h1 with the NDA title", () => {
    render(<NDAPreview data={base()} />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Mutual Non-Disclosure Agreement");
  });

  it("renders the purpose text in the preview", () => {
    // Purpose appears in the cover page paragraph AND as <strong> in Standard Terms.
    render(<NDAPreview data={base({ purpose: "Exploring a joint venture — unique-xyz." })} />);
    expect(screen.getAllByText(/unique-xyz/).length).toBeGreaterThan(0);
  });

  it("renders the governing law in the preview", () => {
    render(<NDAPreview data={base({ governingLaw: "Nevada" })} />);
    expect(screen.getAllByText(/Nevada/).length).toBeGreaterThan(0);
  });

  it("renders the Standard Terms h2 heading", () => {
    render(<NDAPreview data={base()} />);
    expect(screen.getByRole("heading", { name: /^Standard Terms$/ })).toBeInTheDocument();
  });

  it("renders the CC BY 4.0 attribution", () => {
    render(<NDAPreview data={base()} />);
    expect(screen.getByText(/CC BY 4\.0/i)).toBeInTheDocument();
  });

  it("updates the preview when purpose prop changes", () => {
    const { rerender } = render(<NDAPreview data={base({ purpose: "Initial — token-aaa." })} />);
    expect(screen.getAllByText(/token-aaa/).length).toBeGreaterThan(0);

    rerender(<NDAPreview data={base({ purpose: "Updated — token-bbb." })} />);
    expect(screen.getAllByText(/token-bbb/).length).toBeGreaterThan(0);
    expect(screen.queryAllByText(/token-aaa/).length).toBe(0);
  });

  it("renders party info in the signature table when provided", () => {
    render(<NDAPreview data={base({
      party1: { ...defaultFormData.party1, company: "Acme Inc", signature: "Alice" },
      party2: { ...defaultFormData.party2, company: "Beta LLC", signature: "Bob" },
    })} />);
    expect(screen.getByText("Acme Inc")).toBeInTheDocument();
    expect(screen.getByText("Beta LLC")).toBeInTheDocument();
  });
});

// ─── download button state and PDF pipeline ──────────────────────────────────

describe("NDAPreview download", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedPdf = null;
    HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
      drawImage: vi.fn(),
      fillStyle: "",
      fillRect: vi.fn(),
    }) as unknown as typeof HTMLCanvasElement.prototype.getContext;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("download button is enabled initially", () => {
    render(<NDAPreview data={base()} />);
    expect(screen.getByRole("button", { name: /download pdf/i })).not.toBeDisabled();
  });

  it("shows loading text while generating PDF", async () => {
    // Pause html2canvas so the loading state is observable before it resolves.
    const html2canvasMod = await import("html2canvas");
    let resolveCanvas!: (v: unknown) => void;
    vi.mocked(html2canvasMod.default).mockReturnValueOnce(
      new Promise((res) => { resolveCanvas = res; })
    );

    render(<NDAPreview data={base()} />);
    fireEvent.click(screen.getByRole("button", { name: /download pdf/i }));
    expect(await screen.findByText(/Generating PDF/i)).toBeInTheDocument();

    resolveCanvas({ width: 800, height: 1200, toDataURL: vi.fn().mockReturnValue("data:image/png;base64,x") });
  });

  it("re-enables the button after PDF generation completes", async () => {
    render(<NDAPreview data={base()} />);
    await clickDownloadAndWait();
    expect(screen.getByRole("button", { name: /download pdf/i })).not.toBeDisabled();
  });

  it("calls html2canvas once per download", async () => {
    const html2canvasMod = await import("html2canvas");
    render(<NDAPreview data={base()} />);
    await clickDownloadAndWait();
    expect(html2canvasMod.default).toHaveBeenCalledOnce();
  });

  it("calls pdf.save with the filename 'mutual-nda.pdf'", async () => {
    render(<NDAPreview data={base()} />);
    await clickDownloadAndWait();
    expect(capturedPdf?.save).toHaveBeenCalledWith("mutual-nda.pdf");
  });

  it("calls pdf.addImage at least once to add content", async () => {
    render(<NDAPreview data={base()} />);
    await clickDownloadAndWait();
    expect(capturedPdf?.addImage).toHaveBeenCalled();
  });
});
