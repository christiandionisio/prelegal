import json
import os
from typing import Optional, Literal, Generator
from pydantic import BaseModel, create_model
from litellm import completion

MODEL = "openrouter/openai/gpt-oss-120b"
EXTRA_BODY = {"provider": {"order": ["cerebras"]}}

_FOLLOW_UP = (
    "Always end your response with a follow-up question if there is still "
    "information needed to complete the document."
)

_SUPPORTED_DOCS = """\
Supported document types on this platform:
- Mutual Non-Disclosure Agreement
- Mutual NDA Cover Page
- Cloud Service Agreement
- Design Partner Agreement
- Service Level Agreement
- Professional Services Agreement
- Data Processing Agreement
- Software License Agreement
- Partnership Agreement
- Pilot Agreement
- Business Associate Agreement
- AI Addendum

If the user asks about a document type not in this list, explain that we don't support it yet \
and suggest the closest match from the list above."""


class PartyInfoUpdate(BaseModel):
    signature: Optional[str] = None
    printName: Optional[str] = None
    title: Optional[str] = None
    company: Optional[str] = None
    noticeAddress: Optional[str] = None
    date: Optional[str] = None


class NDAFieldsUpdate(BaseModel):
    purpose: Optional[str] = None
    effectiveDate: Optional[str] = None
    mndaTermType: Optional[Literal["expires", "until_terminated"]] = None
    mndaTermYears: Optional[int] = None
    confidentialityTermType: Optional[Literal["years", "perpetuity"]] = None
    confidentialityTermYears: Optional[int] = None
    governingLaw: Optional[str] = None
    jurisdiction: Optional[str] = None
    modifications: Optional[str] = None
    party1: Optional[PartyInfoUpdate] = None
    party2: Optional[PartyInfoUpdate] = None
    redirect_to: Optional[str] = None


def _prompt(doc_name: str, party1_label: str, party2_label: str, fields: list[str]) -> str:
    field_list = "\n".join(f"- {f}" for f in fields)
    return f"""\
You are a friendly legal assistant helping users fill out a {doc_name}.

Gather the necessary information through natural conversation. Ask one or two questions at a time.

Fields to collect:
{field_list}

Start by asking about the {party1_label} and {party2_label}. Be warm, concise, and professional.
When the user provides information, acknowledge it briefly and move to the next relevant question.

{_SUPPORTED_DOCS}

{_FOLLOW_UP}"""


DOCUMENT_CONFIGS: dict[str, dict] = {
    "mutual-nda": {
        "name": "Mutual Non-Disclosure Agreement",
        "template_file": "Mutual-NDA.md",
        "party1_label": "Party 1",
        "party2_label": "Party 2",
        "system_prompt": f"""\
You are a friendly legal assistant helping users fill out a Mutual Non-Disclosure Agreement (NDA).

Gather the necessary information through natural conversation. Ask one or two questions at a time.

Fields you need to collect:
- Purpose: How confidential information may be used between the parties
- Effective date: When the agreement starts (ask for a specific date)
- MNDA term: How long the agreement lasts (expires after N years, or continues until terminated)
- Confidentiality term: How long confidential info is protected (N years, or in perpetuity)
- Governing law: Which state's laws govern (e.g., Delaware, California)
- Jurisdiction: Where disputes would be resolved
- Party 1: Full name (for signature), title, company name, email/address, signing date
- Party 2: Same as Party 1
- Modifications: Any changes to standard NDA terms (optional)

Start by asking about the two parties and the purpose of the NDA. Be warm, concise, and professional.
When the user provides information, acknowledge it briefly and move to the next relevant question.

{_SUPPORTED_DOCS}

{_FOLLOW_UP}""",
        "extraction_model": NDAFieldsUpdate,
        "extraction_fields": [],
        "extraction_prompt": (
            "Extract NDA field values from this conversation. "
            "Only return fields that were explicitly stated or clearly implied. "
            "Use YYYY-MM-DD format for dates. Return null for any fields not mentioned."
        ),
    },
    "mutual-nda-cover-page": {
        "name": "Mutual NDA Cover Page",
        "template_file": "Mutual-NDA-coverpage.md",
        "party1_label": "Party 1",
        "party2_label": "Party 2",
        "system_prompt": _prompt(
            "Mutual NDA Cover Page", "Party 1", "Party 2",
            [
                "Party 1: Full name, title, company, notice address, signing date",
                "Party 2: Full name, title, company, notice address, signing date",
                "Purpose: How confidential information may be used",
                "Effective Date: When the agreement starts (YYYY-MM-DD)",
                "MNDA Term: How long the NDA lasts (expires after N years or until terminated)",
                "Confidentiality Term: How long confidential info is protected",
                "Governing Law: Which state's laws govern",
                "Jurisdiction: Where disputes would be resolved",
                "Modifications: Any changes to standard NDA terms (optional)",
            ]
        ),
        "extraction_fields": [
            "purpose", "effectiveDate", "mndaTermType", "mndaTermYears",
            "confidentialityTermType", "confidentialityTermYears",
            "governingLaw", "jurisdiction", "modifications",
        ],
        "extraction_prompt": (
            "Extract Mutual NDA Cover Page field values from this conversation. "
            "Use YYYY-MM-DD format for dates. Return null for missing fields. "
            "For mndaTermType use 'expires' or 'until_terminated'. "
            "For confidentialityTermType use 'years' or 'perpetuity'."
        ),
    },
    "cloud-service-agreement": {
        "name": "Cloud Service Agreement",
        "template_file": "CSA.md",
        "party1_label": "Provider",
        "party2_label": "Customer",
        "system_prompt": _prompt(
            "Cloud Service Agreement", "Provider", "Customer",
            [
                "Provider: Company providing the cloud service (name, title, company, address, date)",
                "Customer: Company using the cloud service (name, title, company, address, date)",
                "Subscription Period: How long the subscription runs (e.g., '1 year starting Jan 1, 2025')",
                "Fees: Pricing terms (e.g., '$500/month')",
                "Payment Process: 'invoice' or 'automatic payment'",
                "Technical Support: Support level included (e.g., 'email support within 24 hours')",
                "Governing Law: Which state's laws govern",
                "Jurisdiction: Where disputes would be resolved",
            ]
        ),
        "extraction_fields": [
            "subscriptionPeriod", "fees", "paymentProcess",
            "technicalSupport", "governingLaw", "jurisdiction",
        ],
        "extraction_prompt": (
            "Extract Cloud Service Agreement field values from this conversation. "
            "Use YYYY-MM-DD for dates. Return null for missing fields."
        ),
    },
    "design-partner-agreement": {
        "name": "Design Partner Agreement",
        "template_file": "design-partner-agreement.md",
        "party1_label": "Provider",
        "party2_label": "Partner",
        "system_prompt": _prompt(
            "Design Partner Agreement", "Provider", "Partner",
            [
                "Provider: Company with the product (name, title, company, address, date)",
                "Partner: Design partner company (name, title, company, address, date)",
                "Term: How long the design partnership runs (e.g., '6 months')",
                "Program: Description of the design partner program and expectations",
                "Fees: Cost if any (often $0 for design partners)",
                "Effective Date: When the agreement starts (YYYY-MM-DD)",
                "Governing Law: Which state's laws govern",
                "Chosen Courts: Where disputes would be resolved",
            ]
        ),
        "extraction_fields": [
            "term", "program", "fees", "effectiveDate",
            "governingLaw", "chosenCourts",
        ],
        "extraction_prompt": (
            "Extract Design Partner Agreement field values from this conversation. "
            "Use YYYY-MM-DD for dates. Return null for missing fields."
        ),
    },
    "service-level-agreement": {
        "name": "Service Level Agreement",
        "template_file": "sla.md",
        "party1_label": "Provider",
        "party2_label": "Customer",
        "system_prompt": _prompt(
            "Service Level Agreement", "Provider", "Customer",
            [
                "Provider: Cloud service provider (name, title, company, address, date)",
                "Customer: The customer (name, title, company, address, date)",
                "Target Uptime: Uptime commitment (e.g., '99.9%')",
                "Target Response Time: Max time to respond to support requests (e.g., '24 hours')",
                "Uptime Credit: Service credit for missing uptime target (e.g., '10% of monthly fee')",
                "Response Time Credit: Service credit for missing response target",
                "Support Channel: How customers submit support requests (e.g., 'email', 'support portal')",
                "Scheduled Downtime: Allowed maintenance windows (e.g., '4 hours/month')",
            ]
        ),
        "extraction_fields": [
            "targetUptime", "targetResponseTime", "uptimeCredit",
            "responseTimeCredit", "supportChannel", "scheduledDowntime",
        ],
        "extraction_prompt": (
            "Extract Service Level Agreement field values from this conversation. "
            "Return null for missing fields."
        ),
    },
    "professional-services-agreement": {
        "name": "Professional Services Agreement",
        "template_file": "psa.md",
        "party1_label": "Provider",
        "party2_label": "Customer",
        "system_prompt": _prompt(
            "Professional Services Agreement", "Provider", "Customer",
            [
                "Provider: Services provider (name, title, company, address, date)",
                "Customer: Company receiving services (name, title, company, address, date)",
                "Services Description: What professional services are being provided",
                "Fees: Total cost or rate (e.g., '$10,000 fixed fee' or '$200/hour')",
                "Payment Schedule: When/how payment is made (e.g., 'net 30' or 'monthly')",
                "Term: Duration of the agreement",
                "Effective Date: When the agreement starts (YYYY-MM-DD)",
                "Governing Law: Which state's laws govern",
                "Jurisdiction: Where disputes would be resolved",
            ]
        ),
        "extraction_fields": [
            "servicesDescription", "fees", "paymentSchedule",
            "term", "effectiveDate", "governingLaw", "jurisdiction",
        ],
        "extraction_prompt": (
            "Extract Professional Services Agreement field values from this conversation. "
            "Use YYYY-MM-DD for dates. Return null for missing fields."
        ),
    },
    "data-processing-agreement": {
        "name": "Data Processing Agreement",
        "template_file": "DPA.md",
        "party1_label": "Provider",
        "party2_label": "Customer",
        "system_prompt": _prompt(
            "Data Processing Agreement", "Provider (Data Processor)", "Customer (Data Controller)",
            [
                "Provider (Data Processor): Company processing data (name, title, company, address, date)",
                "Customer (Data Controller): Company controlling data (name, title, company, address, date)",
                "Personal Data Types: Categories of personal data to be processed",
                "Processing Purpose: Why the data is being processed",
                "Data Subjects: Whose personal data is involved (e.g., 'end users', 'employees')",
                "Processing Duration: How long data will be processed",
                "Governing Law: Which laws govern",
                "Jurisdiction: Where disputes would be resolved",
            ]
        ),
        "extraction_fields": [
            "personalDataTypes", "processingPurpose", "dataSubjects",
            "processingDuration", "governingLaw", "jurisdiction",
        ],
        "extraction_prompt": (
            "Extract Data Processing Agreement field values from this conversation. "
            "Use YYYY-MM-DD for dates. Return null for missing fields."
        ),
    },
    "software-license-agreement": {
        "name": "Software License Agreement",
        "template_file": "Software-License-Agreement.md",
        "party1_label": "Provider",
        "party2_label": "Customer",
        "system_prompt": _prompt(
            "Software License Agreement", "Provider (Licensor)", "Customer (Licensee)",
            [
                "Provider (Licensor): Company granting the license (name, title, company, address, date)",
                "Customer (Licensee): Company receiving the license (name, title, company, address, date)",
                "License Type: Type of license (e.g., 'perpetual', 'annual subscription', 'per-seat')",
                "License Scope: What the license permits (e.g., 'internal business use only')",
                "License Fee: Cost (e.g., '$5,000/year')",
                "License Term: Duration (e.g., '1 year' or 'perpetual')",
                "Governing Law: Which state's laws govern",
                "Jurisdiction: Where disputes would be resolved",
            ]
        ),
        "extraction_fields": [
            "licenseType", "licenseScope", "licenseFee",
            "licenseTerm", "governingLaw", "jurisdiction",
        ],
        "extraction_prompt": (
            "Extract Software License Agreement field values from this conversation. "
            "Use YYYY-MM-DD for dates. Return null for missing fields."
        ),
    },
    "partnership-agreement": {
        "name": "Partnership Agreement",
        "template_file": "Partnership-Agreement.md",
        "party1_label": "Company",
        "party2_label": "Partner",
        "system_prompt": _prompt(
            "Partnership Agreement", "Company", "Partner",
            [
                "Company: First party (name, title, company, address, date)",
                "Partner: Reseller or referral partner (name, title, company, address, date)",
                "Partnership Type: 'reseller' or 'referral'",
                "Commission Rate: Percentage earned by partner (e.g., '15%')",
                "Territory: Geographic area where partner can sell (e.g., 'United States')",
                "Term: How long the agreement lasts",
                "Effective Date: When the agreement starts (YYYY-MM-DD)",
                "Governing Law: Which state's laws govern",
                "Jurisdiction: Where disputes would be resolved",
            ]
        ),
        "extraction_fields": [
            "partnershipType", "commissionRate", "territory",
            "term", "effectiveDate", "governingLaw", "jurisdiction",
        ],
        "extraction_prompt": (
            "Extract Partnership Agreement field values from this conversation. "
            "Use YYYY-MM-DD for dates. Return null for missing fields."
        ),
    },
    "pilot-agreement": {
        "name": "Pilot Agreement",
        "template_file": "Pilot-Agreement.md",
        "party1_label": "Provider",
        "party2_label": "Customer",
        "system_prompt": _prompt(
            "Pilot Agreement", "Provider", "Customer",
            [
                "Provider: Company offering the product for pilot (name, title, company, address, date)",
                "Customer: Company doing the pilot (name, title, company, address, date)",
                "Pilot Period: How long the pilot runs (e.g., '90 days')",
                "Pilot Fee: Cost for the pilot (often $0 for pilots)",
                "Success Criteria: How success will be evaluated",
                "Effective Date: When the pilot starts (YYYY-MM-DD)",
                "Governing Law: Which state's laws govern",
                "Jurisdiction: Where disputes would be resolved",
            ]
        ),
        "extraction_fields": [
            "pilotPeriod", "pilotFee", "successCriteria",
            "effectiveDate", "governingLaw", "jurisdiction",
        ],
        "extraction_prompt": (
            "Extract Pilot Agreement field values from this conversation. "
            "Use YYYY-MM-DD for dates. Return null for missing fields."
        ),
    },
    "business-associate-agreement": {
        "name": "Business Associate Agreement",
        "template_file": "BAA.md",
        "party1_label": "Provider",
        "party2_label": "Company",
        "system_prompt": _prompt(
            "Business Associate Agreement (BAA)", "Provider (Business Associate)", "Company (Covered Entity)",
            [
                "Provider (Business Associate): Company handling PHI on behalf of covered entity (name, title, company, address, date)",
                "Company (Covered Entity): Healthcare entity (name, title, company, address, date)",
                "Services: What services the Business Associate provides",
                "BAA Effective Date: When the BAA takes effect (YYYY-MM-DD)",
                "Breach Notification Period: How quickly breaches must be reported (e.g., '60 days')",
                "Limitations: Any restrictions on PHI use or offshoring",
            ]
        ),
        "extraction_fields": [
            "services", "baaEffectiveDate", "breachNotificationPeriod", "limitations",
        ],
        "extraction_prompt": (
            "Extract Business Associate Agreement field values from this conversation. "
            "Use YYYY-MM-DD for dates. Return null for missing fields."
        ),
    },
    "ai-addendum": {
        "name": "AI Addendum",
        "template_file": "AI-Addendum.md",
        "party1_label": "Provider",
        "party2_label": "Customer",
        "system_prompt": _prompt(
            "AI Addendum", "Provider", "Customer",
            [
                "Provider: Cloud service provider with AI features (name, title, company, address, date)",
                "Customer: Company using the AI features (name, title, company, address, date)",
                "AI Features: Which AI features are covered by this addendum",
                "Training Opt-out: Whether customer can opt out of AI training (yes/no and conditions)",
                "Effective Date: When the addendum takes effect (YYYY-MM-DD)",
                "Governing Law: Which state's laws govern",
                "Jurisdiction: Where disputes would be resolved",
            ]
        ),
        "extraction_fields": [
            "aiFeatures", "trainingOptOut", "effectiveDate",
            "governingLaw", "jurisdiction",
        ],
        "extraction_prompt": (
            "Extract AI Addendum field values from this conversation. "
            "Use YYYY-MM-DD for dates. Return null for missing fields."
        ),
    },
}

_extraction_model_cache: dict[str, type[BaseModel]] = {}

_REDIRECT_INSTRUCTION = (
    "\n\nAdditionally: if the conversation makes clear the user wants a DIFFERENT type of "
    "legal document (not the one currently being filled in), set redirect_to to the matching "
    "slug from this list: mutual-nda, mutual-nda-cover-page, cloud-service-agreement, "
    "design-partner-agreement, service-level-agreement, professional-services-agreement, "
    "data-processing-agreement, software-license-agreement, partnership-agreement, "
    "pilot-agreement, business-associate-agreement, ai-addendum. Otherwise leave redirect_to null."
)


def _make_extraction_model(document_type: str) -> type[BaseModel]:
    config = DOCUMENT_CONFIGS[document_type]
    if "extraction_model" in config:
        return config["extraction_model"]
    if document_type in _extraction_model_cache:
        return _extraction_model_cache[document_type]
    field_defs: dict = {name: (Optional[str], None) for name in config["extraction_fields"]}
    field_defs["party1"] = (Optional[PartyInfoUpdate], None)
    field_defs["party2"] = (Optional[PartyInfoUpdate], None)
    field_defs["redirect_to"] = (Optional[str], None)
    model = create_model(f"FieldsUpdate_{document_type.replace('-', '_')}", **field_defs)
    _extraction_model_cache[document_type] = model
    return model


def _extract_fields(messages: list[dict], document_type: str) -> BaseModel:
    config = DOCUMENT_CONFIGS[document_type]
    model_class = _make_extraction_model(document_type)
    extraction_messages = [
        {"role": "system", "content": config["extraction_prompt"] + _REDIRECT_INSTRUCTION},
        *messages,
        {"role": "user", "content": f"Extract the {config['name']} field values from this conversation into structured format."},
    ]
    response = completion(
        model=MODEL,
        messages=extraction_messages,
        response_format=model_class,
        extra_body=EXTRA_BODY,
        api_key=os.environ.get("OPENROUTER_API_KEY"),
    )
    return model_class.model_validate_json(response.choices[0].message.content)


def stream_chat(messages: list[dict], document_type: str = "mutual-nda") -> Generator[str, None, None]:
    """Yield SSE events: text chunks then a final fields event."""
    config = DOCUMENT_CONFIGS.get(document_type, DOCUMENT_CONFIGS["mutual-nda"])
    full_messages = [{"role": "system", "content": config["system_prompt"]}] + messages

    reply_chunks: list[str] = []
    response = completion(
        model=MODEL,
        messages=full_messages,
        stream=True,
        extra_body=EXTRA_BODY,
        api_key=os.environ.get("OPENROUTER_API_KEY"),
    )
    for chunk in response:
        delta = chunk.choices[0].delta.content or ""
        if delta:
            reply_chunks.append(delta)
            yield f"data: {json.dumps({'chunk': delta})}\n\n"

    full_reply = "".join(reply_chunks)
    conversation_with_reply = messages + [{"role": "assistant", "content": full_reply}]

    try:
        fields = _extract_fields(conversation_with_reply, document_type)
        fields_dict = fields.model_dump(exclude_none=True)
        redirect_to = fields_dict.pop("redirect_to", None)
        if redirect_to and redirect_to in DOCUMENT_CONFIGS and redirect_to != document_type:
            yield f"data: {json.dumps({'redirect': redirect_to})}\n\n"
        elif fields_dict:
            yield f"data: {json.dumps({'fields': fields_dict})}\n\n"
    except Exception:
        pass
    finally:
        yield "data: [DONE]\n\n"
