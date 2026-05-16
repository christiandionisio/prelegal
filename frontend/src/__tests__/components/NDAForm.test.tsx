import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import NDAForm from "@/components/NDAForm";
import { defaultFormData, NDAFormData } from "@/types/nda";

// The Purpose textarea has no placeholder and no htmlFor/id label association.
// Filter by absence of placeholder to locate it stably within the current DOM structure.
function purposeTextarea() {
  return screen.getAllByRole("textbox").find(
    (el) => !(el as HTMLTextAreaElement).placeholder
  ) as HTMLTextAreaElement;
}

function renderForm(overrides: Partial<NDAFormData> = {}, onChange = vi.fn()) {
  const data: NDAFormData = { ...defaultFormData, ...overrides };
  render(<NDAForm data={data} onChange={onChange} />);
  return onChange;
}

// ─── rendering ───────────────────────────────────────────────────────────────

describe("NDAForm rendering", () => {
  it("renders the form heading", () => {
    renderForm();
    expect(screen.getByText("Mutual NDA Creator")).toBeInTheDocument();
  });

  it("renders the Purpose textarea", () => {
    renderForm();
    expect(purposeTextarea()).toBeInTheDocument();
  });

  it("renders the Effective Date input", () => {
    renderForm();
    expect(document.querySelector('input[type="date"]')).toBeInTheDocument();
  });

  it("renders two MNDA Term radio buttons", () => {
    renderForm();
    const radios = screen.getAllByRole("radio");
    expect(radios[0]).toBeInTheDocument();
    expect(radios[1]).toBeInTheDocument();
  });

  it("renders the Governing Law input", () => {
    renderForm();
    expect(screen.getByPlaceholderText("e.g. Delaware")).toBeInTheDocument();
  });

  it("renders the Jurisdiction input", () => {
    renderForm();
    expect(screen.getByPlaceholderText(/courts located/i)).toBeInTheDocument();
  });

  it("renders the MNDA Modifications textarea", () => {
    renderForm();
    expect(screen.getByPlaceholderText(/list any modifications/i)).toBeInTheDocument();
  });

  it("renders Party 1 and Party 2 section headings", () => {
    renderForm();
    // CSS `uppercase` affects visual rendering only — DOM text nodes remain mixed-case.
    expect(screen.getByText("Party 1")).toBeInTheDocument();
    expect(screen.getByText("Party 2")).toBeInTheDocument();
  });

  it("renders signature placeholder for both parties", () => {
    renderForm();
    expect(screen.getAllByPlaceholderText("Full legal name")).toHaveLength(2);
  });

  it("renders print name, title, company, and address fields for both parties", () => {
    renderForm();
    expect(screen.getAllByPlaceholderText("Full name")).toHaveLength(2);
    expect(screen.getAllByPlaceholderText("e.g. CEO")).toHaveLength(2);
    expect(screen.getAllByPlaceholderText("Company name")).toHaveLength(2);
    expect(screen.getAllByPlaceholderText("email@example.com")).toHaveLength(2);
  });

  it("populates Purpose textarea with current data value", () => {
    renderForm({ purpose: "Joint R&D project." });
    expect(purposeTextarea()).toHaveValue("Joint R&D project.");
  });

  it("shows 'expires' radio as checked by default", () => {
    renderForm({ mndaTermType: "expires" });
    const radios = screen.getAllByRole("radio");
    expect(radios[0]).toBeChecked();
    expect(radios[1]).not.toBeChecked();
  });

  it("shows 'until_terminated' radio as checked when set", () => {
    renderForm({ mndaTermType: "until_terminated" });
    const radios = screen.getAllByRole("radio");
    expect(radios[0]).not.toBeChecked();
    expect(radios[1]).toBeChecked();
  });

  it("disables the MNDA year input when 'until_terminated' is selected", () => {
    renderForm({ mndaTermType: "until_terminated" });
    expect(screen.getAllByRole("spinbutton")[0]).toBeDisabled();
  });

  it("enables the MNDA year input when 'expires' is selected", () => {
    renderForm({ mndaTermType: "expires" });
    expect(screen.getAllByRole("spinbutton")[0]).not.toBeDisabled();
  });

  it("shows confidentiality 'years' radio as checked by default", () => {
    renderForm({ confidentialityTermType: "years" });
    const radios = screen.getAllByRole("radio");
    expect(radios[2]).toBeChecked();
    expect(radios[3]).not.toBeChecked();
  });

  it("shows confidentiality 'perpetuity' radio as checked when set", () => {
    renderForm({ confidentialityTermType: "perpetuity" });
    const radios = screen.getAllByRole("radio");
    expect(radios[2]).not.toBeChecked();
    expect(radios[3]).toBeChecked();
  });

  it("disables the confidentiality year input when 'perpetuity' is selected", () => {
    renderForm({ confidentialityTermType: "perpetuity" });
    expect(screen.getAllByRole("spinbutton")[1]).toBeDisabled();
  });

  it("enables the confidentiality year input when 'years' is selected", () => {
    renderForm({ confidentialityTermType: "years" });
    expect(screen.getAllByRole("spinbutton")[1]).not.toBeDisabled();
  });
});

// ─── onChange callbacks ──────────────────────────────────────────────────────

describe("NDAForm onChange", () => {
  let onChange: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onChange = vi.fn();
  });

  it("calls onChange with updated purpose when textarea changes", () => {
    renderForm({}, onChange);
    fireEvent.change(purposeTextarea(), { target: { value: "New purpose text" } });
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ purpose: "New purpose text" }));
  });

  it("calls onChange with updated effectiveDate", () => {
    renderForm({}, onChange);
    const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement;
    fireEvent.change(dateInput, { target: { value: "2026-01-01" } });
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ effectiveDate: "2026-01-01" }));
  });

  it("calls onChange with updated governingLaw", () => {
    renderForm({}, onChange);
    fireEvent.change(screen.getByPlaceholderText("e.g. Delaware"), { target: { value: "California" } });
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ governingLaw: "California" }));
  });

  it("calls onChange with updated jurisdiction", () => {
    renderForm({}, onChange);
    fireEvent.change(screen.getByPlaceholderText(/courts located/i), {
      target: { value: "courts located in Austin, TX" },
    });
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ jurisdiction: "courts located in Austin, TX" }));
  });

  it("calls onChange switching mndaTermType to 'until_terminated'", () => {
    renderForm({}, onChange);
    fireEvent.click(screen.getAllByRole("radio")[1]);
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ mndaTermType: "until_terminated" }));
  });

  it("calls onChange switching mndaTermType back to 'expires'", () => {
    renderForm({ mndaTermType: "until_terminated" }, onChange);
    fireEvent.click(screen.getAllByRole("radio")[0]);
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ mndaTermType: "expires" }));
  });

  it("calls onChange switching confidentialityTermType to 'perpetuity'", () => {
    renderForm({}, onChange);
    fireEvent.click(screen.getAllByRole("radio")[3]);
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ confidentialityTermType: "perpetuity" }));
  });

  it("calls onChange switching confidentialityTermType back to 'years'", () => {
    renderForm({ confidentialityTermType: "perpetuity" }, onChange);
    fireEvent.click(screen.getAllByRole("radio")[2]);
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ confidentialityTermType: "years" }));
  });

  it("clamps mndaTermYears to 1 when input is cleared", () => {
    renderForm({}, onChange);
    fireEvent.change(screen.getAllByRole("spinbutton")[0], { target: { value: "" } });
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ mndaTermYears: 1 }));
  });

  it("clamps mndaTermYears to 1 when input is 0", () => {
    renderForm({}, onChange);
    fireEvent.change(screen.getAllByRole("spinbutton")[0], { target: { value: "0" } });
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ mndaTermYears: 1 }));
  });

  it("accepts valid mndaTermYears value of 5", () => {
    renderForm({}, onChange);
    fireEvent.change(screen.getAllByRole("spinbutton")[0], { target: { value: "5" } });
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ mndaTermYears: 5 }));
  });

  it("clamps confidentialityTermYears to 1 when cleared", () => {
    renderForm({}, onChange);
    fireEvent.change(screen.getAllByRole("spinbutton")[1], { target: { value: "" } });
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ confidentialityTermYears: 1 }));
  });

  it("accepts valid confidentialityTermYears value of 3", () => {
    renderForm({}, onChange);
    fireEvent.change(screen.getAllByRole("spinbutton")[1], { target: { value: "3" } });
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ confidentialityTermYears: 3 }));
  });

  it("calls onChange with updated party1 company without touching party2", () => {
    renderForm({}, onChange);
    fireEvent.change(screen.getAllByPlaceholderText("Company name")[0], { target: { value: "Acme Corp" } });
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({
      party1: expect.objectContaining({ company: "Acme Corp" }),
      party2: expect.objectContaining({ company: "" }),
    }));
  });

  it("calls onChange with updated party2 company, leaving party1 unchanged", () => {
    renderForm({ party1: { ...defaultFormData.party1, company: "Acme" } }, onChange);
    fireEvent.change(screen.getAllByPlaceholderText("Company name")[1], { target: { value: "Beta LLC" } });
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({
      party1: expect.objectContaining({ company: "Acme" }),
      party2: expect.objectContaining({ company: "Beta LLC" }),
    }));
  });

  it("does not mutate the original data object", () => {
    const data = { ...defaultFormData };
    render(<NDAForm data={data} onChange={onChange} />);
    fireEvent.change(purposeTextarea(), { target: { value: "Changed" } });
    expect(data.purpose).toBe(defaultFormData.purpose);
  });
});
