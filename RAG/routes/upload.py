import shutil
from pathlib import Path

from fastapi import APIRouter, HTTPException, UploadFile, Form

from parsers.parser import parse_document
from chunking.chunker import chunk_document
from embedding.embedder import embed_and_upload

router = APIRouter()

TEMP_DIR = Path("temp")
TEMP_DIR.mkdir(exist_ok=True)


@router.post("/upload")
async def upload_document(
    file: UploadFile,
    user_id: str = Form(...),
    course_id: str = Form(...),
):
    """
    Upload a document (PDF, DOCX, PPTX, etc.), parse it, chunk it,
    embed it, and store it in Qdrant scoped to the given user and course.
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided.")

    temp_path = TEMP_DIR / file.filename

    try:
        with temp_path.open("wb") as f:
            shutil.copyfileobj(file.file, f)
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to save uploaded file: {e}"
        )

    try:
        markdown, image_chunks = parse_document(str(temp_path))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse document: {e}")
    finally:
        temp_path.unlink(missing_ok=True)  # always clean up, even if parsing fails

    if not markdown.strip():
        raise HTTPException(
            status_code=422, detail="No extractable text found in the document."
        )

    chunks = chunk_document(markdown)

    if not chunks:
        raise HTTPException(status_code=422, detail="Document produced no chunks.")

    try:
        uploaded_count = embed_and_upload(
            chunks=chunks,
            document_name=file.filename,
            user_id=user_id,
            course_id=course_id,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to store embeddings: {e}")

    return {
        "status": "completed",
        "filename": file.filename,
        "chunks_created": uploaded_count,
        "images_found": len(image_chunks),
    }
