from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import time

from routes.upload import router as upload_router
from routes.generation import router as generation_router

app = FastAPI(title="Notely RAG Pipeline")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
@app.get("/health")
@app.get("/ping")
def health_check():
    return {
        "status": "ok",
        "service": "notely-rag-fastapi",
        "timestamp": time.time(),
    }


app.include_router(upload_router)
app.include_router(generation_router)
