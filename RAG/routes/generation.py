from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from utils import generate_answer, generate_flashcards, llm

router = APIRouter()


class AskRequest(BaseModel):
    query: str
    user_id: str
    course_id: str


class ChatRequest(BaseModel):
    query: str


class AskResponse(BaseModel):
    answer: str
    sources: list[int]


class FlashcardRequest(BaseModel):
    query: str
    user_id: str
    course_id: str
    num_cards: int = Field(default=5, ge=1, le=20)


class FlashcardItem(BaseModel):
    question: str
    answer: str
    sources: list[int]


class FlashcardResponse(BaseModel):
    flashcards: list[FlashcardItem]


@router.post("/ask", response_model=AskResponse)
def ask_question(request: AskRequest):
    """
    Answer a question using only the user's retrieved course material.
    """
    try:
        result = generate_answer(
            query_text=request.query,
            user_id=request.user_id,
            course_id=request.course_id,
        )
    except ValueError as e:
        raise HTTPException(status_code=502, detail=f"Generation failed: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {e}")

    return result


@router.post("/chat")
def chat(request: ChatRequest):
    """Answer a general course conversation message without document retrieval."""
    query = request.query.strip()
    if not query:
        raise HTTPException(status_code=400, detail="Please provide a message.")

    try:
        response = llm.invoke(query)
        print(f"LLM response: {response}")
        print()
        print()
        answer = str(response.content).strip()
        print(f"LLM answer: {answer}")
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Generation failed: {e}")

    if not answer:
        raise HTTPException(
            status_code=502, detail="Generation returned an empty response."
        )

    return {"answer": answer}


@router.post("/generate-flashcards", response_model=FlashcardResponse)
def create_flashcards(request: FlashcardRequest):
    """
    Generate study flashcards from the user's retrieved course material.
    """
    try:
        cards = generate_flashcards(
            query_text=request.query,
            user_id=request.user_id,
            course_id=request.course_id,
            num_cards=request.num_cards,
        )
    except ValueError as e:
        raise HTTPException(status_code=502, detail=f"Generation failed: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {e}")

    return {"flashcards": cards}
