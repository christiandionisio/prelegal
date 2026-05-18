export interface DocumentFieldDef {
  id: string;
  label: string;
  description?: string;
}

export interface DocumentConfig {
  slug: string;
  name: string;
  description: string;
  templateFile: string;
  party1Label: string;
  party2Label: string;
  fields: DocumentFieldDef[];
}

export const DOCUMENT_CONFIGS: DocumentConfig[] = [
  {
    slug: "mutual-nda",
    name: "Mutual Non-Disclosure Agreement",
    description: "Standard mutual confidentiality agreement covering both parties' confidential information.",
    templateFile: "Mutual-NDA.md",
    party1Label: "Party 1",
    party2Label: "Party 2",
    fields: [
      { id: "purpose", label: "Purpose", description: "How confidential information may be used" },
      { id: "effectiveDate", label: "Effective Date" },
      { id: "mndaTermType", label: "MNDA Term Type", description: "'expires' or 'until_terminated'" },
      { id: "mndaTermYears", label: "MNDA Term (Years)" },
      { id: "confidentialityTermType", label: "Confidentiality Term Type", description: "'years' or 'perpetuity'" },
      { id: "confidentialityTermYears", label: "Confidentiality Term (Years)" },
      { id: "governingLaw", label: "Governing Law" },
      { id: "jurisdiction", label: "Jurisdiction" },
      { id: "modifications", label: "Modifications" },
    ],
  },
  {
    slug: "mutual-nda-cover-page",
    name: "Mutual NDA Cover Page",
    description: "Cover page for the Mutual NDA specifying party details and incorporating standard terms by reference.",
    templateFile: "Mutual-NDA-coverpage.md",
    party1Label: "Party 1",
    party2Label: "Party 2",
    fields: [
      { id: "purpose", label: "Purpose", description: "How confidential information may be used" },
      { id: "effectiveDate", label: "Effective Date" },
      { id: "mndaTermType", label: "MNDA Term Type" },
      { id: "mndaTermYears", label: "MNDA Term (Years)" },
      { id: "confidentialityTermType", label: "Confidentiality Term Type" },
      { id: "confidentialityTermYears", label: "Confidentiality Term (Years)" },
      { id: "governingLaw", label: "Governing Law" },
      { id: "jurisdiction", label: "Jurisdiction" },
      { id: "modifications", label: "Modifications" },
    ],
  },
  {
    slug: "cloud-service-agreement",
    name: "Cloud Service Agreement",
    description: "Terms under which a vendor provides cloud-hosted software services to a customer.",
    templateFile: "CSA.md",
    party1Label: "Provider",
    party2Label: "Customer",
    fields: [
      { id: "subscriptionPeriod", label: "Subscription Period" },
      { id: "fees", label: "Fees" },
      { id: "paymentProcess", label: "Payment Process", description: "'invoice' or 'automatic payment'" },
      { id: "technicalSupport", label: "Technical Support" },
      { id: "governingLaw", label: "Governing Law" },
      { id: "jurisdiction", label: "Jurisdiction" },
    ],
  },
  {
    slug: "design-partner-agreement",
    name: "Design Partner Agreement",
    description: "Governs relationships where a customer participates as a design partner to help shape a product.",
    templateFile: "design-partner-agreement.md",
    party1Label: "Provider",
    party2Label: "Partner",
    fields: [
      { id: "term", label: "Term" },
      { id: "program", label: "Program Description" },
      { id: "fees", label: "Fees" },
      { id: "effectiveDate", label: "Effective Date" },
      { id: "governingLaw", label: "Governing Law" },
      { id: "chosenCourts", label: "Chosen Courts" },
    ],
  },
  {
    slug: "service-level-agreement",
    name: "Service Level Agreement",
    description: "Defines uptime commitments, incident response times, and remedies for a cloud service provider.",
    templateFile: "sla.md",
    party1Label: "Provider",
    party2Label: "Customer",
    fields: [
      { id: "targetUptime", label: "Target Uptime", description: "e.g., 99.9%" },
      { id: "targetResponseTime", label: "Target Response Time" },
      { id: "uptimeCredit", label: "Uptime Credit" },
      { id: "responseTimeCredit", label: "Response Time Credit" },
      { id: "supportChannel", label: "Support Channel" },
      { id: "scheduledDowntime", label: "Scheduled Downtime" },
    ],
  },
  {
    slug: "professional-services-agreement",
    name: "Professional Services Agreement",
    description: "Terms under which a vendor delivers professional or consulting services to a customer.",
    templateFile: "psa.md",
    party1Label: "Provider",
    party2Label: "Customer",
    fields: [
      { id: "servicesDescription", label: "Services Description" },
      { id: "fees", label: "Fees" },
      { id: "paymentSchedule", label: "Payment Schedule" },
      { id: "term", label: "Term" },
      { id: "effectiveDate", label: "Effective Date" },
      { id: "governingLaw", label: "Governing Law" },
      { id: "jurisdiction", label: "Jurisdiction" },
    ],
  },
  {
    slug: "data-processing-agreement",
    name: "Data Processing Agreement",
    description: "Establishes obligations of a data processor when handling personal data on behalf of a data controller.",
    templateFile: "DPA.md",
    party1Label: "Provider",
    party2Label: "Customer",
    fields: [
      { id: "personalDataTypes", label: "Personal Data Types" },
      { id: "processingPurpose", label: "Processing Purpose" },
      { id: "dataSubjects", label: "Data Subjects" },
      { id: "processingDuration", label: "Processing Duration" },
      { id: "governingLaw", label: "Governing Law" },
      { id: "jurisdiction", label: "Jurisdiction" },
    ],
  },
  {
    slug: "software-license-agreement",
    name: "Software License Agreement",
    description: "Terms under which a licensor grants rights to use its software to a licensee.",
    templateFile: "Software-License-Agreement.md",
    party1Label: "Provider",
    party2Label: "Customer",
    fields: [
      { id: "licenseType", label: "License Type" },
      { id: "licenseScope", label: "License Scope" },
      { id: "licenseFee", label: "License Fee" },
      { id: "licenseTerm", label: "License Term" },
      { id: "governingLaw", label: "Governing Law" },
      { id: "jurisdiction", label: "Jurisdiction" },
    ],
  },
  {
    slug: "partnership-agreement",
    name: "Partnership Agreement",
    description: "Covers the terms of a reseller or referral partnership between two companies.",
    templateFile: "Partnership-Agreement.md",
    party1Label: "Company",
    party2Label: "Partner",
    fields: [
      { id: "partnershipType", label: "Partnership Type", description: "'reseller' or 'referral'" },
      { id: "commissionRate", label: "Commission Rate" },
      { id: "territory", label: "Territory" },
      { id: "term", label: "Term" },
      { id: "effectiveDate", label: "Effective Date" },
      { id: "governingLaw", label: "Governing Law" },
      { id: "jurisdiction", label: "Jurisdiction" },
    ],
  },
  {
    slug: "pilot-agreement",
    name: "Pilot Agreement",
    description: "Governs a time-limited trial of a vendor's product or service prior to a full commercial agreement.",
    templateFile: "Pilot-Agreement.md",
    party1Label: "Provider",
    party2Label: "Customer",
    fields: [
      { id: "pilotPeriod", label: "Pilot Period" },
      { id: "pilotFee", label: "Pilot Fee" },
      { id: "successCriteria", label: "Success Criteria" },
      { id: "effectiveDate", label: "Effective Date" },
      { id: "governingLaw", label: "Governing Law" },
      { id: "jurisdiction", label: "Jurisdiction" },
    ],
  },
  {
    slug: "business-associate-agreement",
    name: "Business Associate Agreement",
    description: "Establishes HIPAA-required obligations when a service provider handles protected health information.",
    templateFile: "BAA.md",
    party1Label: "Provider",
    party2Label: "Company",
    fields: [
      { id: "services", label: "Services" },
      { id: "baaEffectiveDate", label: "BAA Effective Date" },
      { id: "breachNotificationPeriod", label: "Breach Notification Period" },
      { id: "limitations", label: "Limitations" },
    ],
  },
  {
    slug: "ai-addendum",
    name: "AI Addendum",
    description: "Addresses the specific terms around the use of artificial intelligence features within a cloud service.",
    templateFile: "AI-Addendum.md",
    party1Label: "Provider",
    party2Label: "Customer",
    fields: [
      { id: "aiFeatures", label: "AI Features" },
      { id: "trainingOptOut", label: "Training Opt-out" },
      { id: "effectiveDate", label: "Effective Date" },
      { id: "governingLaw", label: "Governing Law" },
      { id: "jurisdiction", label: "Jurisdiction" },
    ],
  },
];

export function getDocConfig(slug: string): DocumentConfig | undefined {
  return DOCUMENT_CONFIGS.find((c) => c.slug === slug);
}
