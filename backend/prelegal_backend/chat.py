import json
import os
from typing import Optional, Literal, Generator
from pydantic import BaseModel
from litellm import completion

MODEL = "openrouter/openai/gpt-oss-120b"
EXTRA_BODY = {"provider": {"order": ["cerebras"]}}

SYSTEM_PROMPT = """You are a friendly legal assistant helping users fill out a Mutual Non-Disclosure Agreement (NDA).

Gather the necessary information through natural conversation. Ask one or two questions at a time — don't overwhelm the user.

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
When the user provides information, acknowledge it briefly and move to the next relevant question."""


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


def _extract_fields(messages: list[dict]) -> NDAFieldsUpdate:
    extraction_messages = [
        {
            "role": "system",
            "content": (
                "Extract NDA field values from this conversation. "
                "Only return fields that were explicitly stated or clearly implied. "
                "Use YYYY-MM-DD format for dates. Return null for any fields not mentioned."
            ),
        },
        *messages,
        {
            "role": "user",
            "content": "Extract the NDA field values from this conversation into structured format.",
        },
    ]
    response = completion(
        model=MODEL,
        messages=extraction_messages,
        response_format=NDAFieldsUpdate,
        extra_body=EXTRA_BODY,
        api_key=os.environ.get("OPENROUTER_API_KEY"),
    )
    return NDAFieldsUpdate.model_validate_json(response.choices[0].message.content)


def stream_chat(messages: list[dict]) -> Generator[str, None, None]:
    """Yield SSE events: text chunks then a final fields event."""
    full_messages = [{"role": "system", "content": SYSTEM_PROMPT}] + messages

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
        fields = _extract_fields(conversation_with_reply)
        fields_dict = fields.model_dump(exclude_none=True)
        yield f"data: {json.dumps({'fields': fields_dict})}\n\n"
    except Exception:
        pass
    finally:
        yield "data: [DONE]\n\n"
