import os

from dotenv import load_dotenv
from typing import Any

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import PydanticOutputParser
from pydantic import BaseModel, Field

from embedding.embedder import query_documents

# ============================================================
# Setup
# ============================================================

load_dotenv()

llm = ChatGoogleGenerativeAI(
    model="gemini-3.1-flash-lite",
    api_key=os.getenv("GEMINI_API_KEY"),
)


# ============================================================
# Output schemas
# ============================================================


class AnswerResponse(BaseModel):
    answer: str = Field(description="The answer to the user's question")
    sources: list[int] = Field(
        default_factory=list,
        description="Source numbers that support the answer",
    )


class Flashcard(BaseModel):
    question: str = Field(description="The flashcard question")
    answer: str = Field(description="The flashcard answer")
    sources: list[int] = Field(
        default_factory=list,
        description="Source numbers that support this card",
    )


class FlashcardList(BaseModel):
    flashcards: list[Flashcard]


answer_parser = PydanticOutputParser(pydantic_object=AnswerResponse)
flashcard_parser = PydanticOutputParser(pydantic_object=FlashcardList)


# ============================================================
# Prompts
# ============================================================

answer_prompt = ChatPromptTemplate.from_template("""You are a course assistant.

Answer the user's question using ONLY the retrieved course material below.

USER QUESTION:
{query_text}

RETRIEVED COURSE MATERIAL:
{context}

RULES:
1. Use only information contained in the retrieved course material.
2. Do not use outside knowledge.
3. Do not invent facts.
4. Give a clear and direct answer.
5. If the material does not contain enough information, say:
   "The course material does not provide enough information to answer this."
6. Cite the source numbers that support your answer.
7. Only cite sources that actually support the answer.
8. Source numbers must be between 1 and {source_count}.

{format_instructions}""")

flashcard_prompt = ChatPromptTemplate.from_template(
    """You are an expert educational assistant.

Create study flashcards using ONLY the retrieved course material below.

TOPIC / USER REQUEST:
{query_text}

RETRIEVED COURSE MATERIAL:
{context}

RULES:
1. Generate exactly {num_cards} flashcards when the material contains enough information.
2. If there is not enough information, generate fewer cards.
3. Every flashcard must be based ONLY on the retrieved material.
4. Do not use outside knowledge.
5. Do not invent facts.
6. Questions should test important concepts, definitions, relationships, processes, or facts.
7. Avoid trivial or repetitive questions.
8. Answers should be concise but complete.
9. Every card must include the source numbers supporting it.
10. Only cite sources that actually support the card.
11. Source numbers must be between 1 and {source_count}.

{format_instructions}"""
)


# ============================================================
# Chains — retry once automatically if parsing fails
# ============================================================

answer_chain = (answer_prompt | llm | answer_parser).with_retry(stop_after_attempt=2)
flashcard_chain = (flashcard_prompt | llm | flashcard_parser).with_retry(
    stop_after_attempt=2
)


# ============================================================
# Shared helper
# ============================================================


def _retrieve_context(
    query_text: str,
    user_id: str,
    course_id: str,
    limit: int = 10,
) -> tuple[str, int]:
    """
    Retrieve course documents and format them as RAG context.

    Returns:
        (context, number_of_sources)
    """

    results = query_documents(
        query_text=query_text,
        user_id=user_id,
        course_id=course_id,
        limit=limit,
    )

    points = getattr(results, "points", [])

    if not points:
        return "", 0

    context_parts = []
    source_count = 0

    for point in points:
        payload = getattr(point, "payload", {}) or {}

        text = payload.get("text", "")

        if not isinstance(text, str):
            text = str(text)

        text = text.strip()

        if not text:
            continue

        source_count += 1

        context_parts.append(f"[Source {source_count}]\n{text}")

    return "\n\n".join(context_parts), source_count


# ============================================================
# 1. Generate Answer
# ============================================================


def generate_answer(
    query_text: str,
    user_id: str,
    course_id: str,
) -> dict[str, Any]:
    """
    Answer a user's question using only retrieved course material.

    Returns:

    {
        "answer": "...",
        "sources": [1, 2]
    }
    """

    query_text = query_text.strip()

    if not query_text:
        return {
            "answer": "Please provide a question.",
            "sources": [],
        }

    context, source_count = _retrieve_context(
        query_text=query_text,
        user_id=user_id,
        course_id=course_id,
        limit=10,
    )

    if not context:
        return {
            "answer": "I could not find relevant information in the course material.",
            "sources": [],
        }

    try:
        result = answer_chain.invoke(
            {
                "query_text": query_text,
                "context": context,
                "source_count": source_count,
                "format_instructions": answer_parser.get_format_instructions(),
            }
        )
    except Exception as e:
        raise ValueError(f"Generation failed: {e}")

    valid_sources = [s for s in result.sources if 1 <= s <= source_count]
    valid_sources = list(dict.fromkeys(valid_sources))  # remove duplicates

    if not result.answer.strip():
        raise ValueError("Answer response does not contain a valid answer.")

    return {
        "answer": result.answer.strip(),
        "sources": valid_sources,
    }


# ============================================================
# 2. Generate Flashcards
# ============================================================


def generate_flashcards(
    query_text: str,
    user_id: str,
    course_id: str,
    num_cards: int = 5,
) -> list[dict[str, Any]]:
    """
    Generate study flashcards from retrieved course material.

    Returns:

    [
        {
            "question": "...",
            "answer": "...",
            "sources": [1, 2]
        }
    ]
    """

    query_text = query_text.strip()

    if not query_text:
        return []

    if num_cards < 1:
        return []

    num_cards = min(num_cards, 20)

    context, source_count = _retrieve_context(
        query_text=query_text,
        user_id=user_id,
        course_id=course_id,
        limit=10,
    )

    if not context:
        return []

    try:
        result = flashcard_chain.invoke(
            {
                "query_text": query_text,
                "context": context,
                "num_cards": num_cards,
                "source_count": source_count,
                "format_instructions": flashcard_parser.get_format_instructions(),
            }
        )
    except Exception as e:
        raise ValueError(f"Generation failed: {e}")

    validated_cards = []

    for card in result.flashcards:
        question = card.question.strip()
        answer = card.answer.strip()

        if not question or not answer:
            continue

        valid_sources = [s for s in card.sources if 1 <= s <= source_count]
        valid_sources = list(dict.fromkeys(valid_sources))

        validated_cards.append(
            {
                "question": question,
                "answer": answer,
                "sources": valid_sources,
            }
        )

        if len(validated_cards) >= num_cards:
            break

    return validated_cards
