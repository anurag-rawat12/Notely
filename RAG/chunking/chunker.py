from langchain_text_splitters import RecursiveCharacterTextSplitter


def chunk_document(
    document: str,
    chunk_size: int = 1000,
    chunk_overlap: int = 100,
) -> list[str]:
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        separators=[
            "\n## ",
            "\n### ",
            "\n\n",
            "\n",
            ". ",
            " ",
        ],
    )
    return text_splitter.split_text(document)
