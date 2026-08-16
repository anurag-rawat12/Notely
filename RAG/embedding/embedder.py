import uuid

from qdrant_client import models
from qdrant_client.models import PointStruct, Document

from qdrant_store.qdrant_client import (
    get_qdrant_client,
    ensure_collection,
    COLLECTION_NAME,
)

EMBED_MODEL = "sentence-transformers/all-MiniLM-L6-v2"


def embed_and_upload(
    chunks: list[str],
    document_name: str,
    user_id: str,
    course_id: str,
) -> int:
    client = get_qdrant_client()
    ensure_collection(client)

    points = [
        PointStruct(
            id=str(uuid.uuid4()),
            vector=Document(text=chunk, model=EMBED_MODEL),
            payload={
                "text": chunk,
                "document": document_name,
                "chunk_index": i,
                "user_id": user_id,
                "course_id": course_id,
            },
        )
        for i, chunk in enumerate(chunks)
    ]

    client.upsert(collection_name=COLLECTION_NAME, points=points)
    return len(points)


def query_documents(query_text: str, user_id: str, course_id: str, limit: int = 5):
    client = get_qdrant_client()
    return client.query_points(
        collection_name=COLLECTION_NAME,
        query=Document(text=query_text, model=EMBED_MODEL),
        query_filter=models.Filter(
            must=[
                models.FieldCondition(
                    key="user_id", match=models.MatchValue(value=user_id)
                ),
                models.FieldCondition(
                    key="course_id", match=models.MatchValue(value=course_id)
                ),
            ]
        ),
        limit=limit,
    )
