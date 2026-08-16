import os
from dotenv import load_dotenv
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams

load_dotenv()

COLLECTION_NAME = "documents"


def get_qdrant_client() -> QdrantClient:
    return QdrantClient(
        url=os.getenv("QDRANT_ENDPOINT"),
        api_key=os.getenv("QDRANT_API_KEY"),
        cloud_inference=True,
    )


def ensure_collection(client: QdrantClient):
    if not client.collection_exists(COLLECTION_NAME):
        client.create_collection(
            collection_name=COLLECTION_NAME,
            vectors_config=VectorParams(size=384, distance=Distance.COSINE),
        )

    # Create payload indexes so filtering by these fields works —
    # Qdrant requires an explicit index before you can use a field
    # in query_filter, otherwise it throws a 400 Bad Request.
    client.create_payload_index(
        collection_name=COLLECTION_NAME,
        field_name="user_id",
        field_schema="keyword",
    )
    client.create_payload_index(
        collection_name=COLLECTION_NAME,
        field_name="course_id",
        field_schema="keyword",
    )
