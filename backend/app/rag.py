"""RAG module — Chroma in-memory vector store with sentence-transformers.

Loads markdown knowledge files at startup, chunks by section,
embeds with all-MiniLM-L6-v2, and exposes a retrieve() function.
"""

from __future__ import annotations

import logging
import re
from pathlib import Path

logger = logging.getLogger(__name__)

_collection = None
_initialized = False

KNOWLEDGE_DIR = Path(__file__).parent.parent / "knowledge"


def _chunk_markdown(text: str, source: str) -> list[dict]:
    """Split markdown into chunks by ## headers. Each chunk ~200-400 tokens."""
    sections = re.split(r"\n(?=## )", text)
    chunks = []
    for section in sections:
        section = section.strip()
        if not section or len(section) < 20:
            continue
        header_match = re.match(r"^##\s+(.+)", section)
        header = header_match.group(1) if header_match else "intro"
        chunks.append({
            "text": section,
            "metadata": {"source": source, "section": header},
        })
    return chunks


def init_rag() -> None:
    """Load knowledge files into Chroma. Call once at startup."""
    global _collection, _initialized

    if _initialized:
        return

    if not KNOWLEDGE_DIR.exists():
        logger.warning(f"Knowledge directory not found: {KNOWLEDGE_DIR}")
        _initialized = True
        return

    md_files = list(KNOWLEDGE_DIR.glob("*.md"))
    if not md_files:
        logger.warning("No markdown files found in knowledge/")
        _initialized = True
        return

    try:
        import chromadb
        from chromadb.utils.embedding_functions import SentenceTransformerEmbeddingFunction
    except ImportError:
        logger.warning("chromadb or sentence-transformers not installed — RAG disabled")
        _initialized = True
        return

    logger.info(f"Initializing RAG with {len(md_files)} knowledge files...")

    embedding_fn = SentenceTransformerEmbeddingFunction(
        model_name="all-MiniLM-L6-v2"
    )

    client = chromadb.Client()
    _collection = client.create_collection(
        name="design_knowledge",
        embedding_function=embedding_fn,
    )

    all_docs = []
    all_ids = []
    all_metadatas = []

    for md_file in md_files:
        content = md_file.read_text(encoding="utf-8")
        chunks = _chunk_markdown(content, source=md_file.name)
        for i, chunk in enumerate(chunks):
            doc_id = f"{md_file.stem}_{i}"
            all_docs.append(chunk["text"])
            all_ids.append(doc_id)
            all_metadatas.append(chunk["metadata"])

    if all_docs:
        _collection.add(
            documents=all_docs,
            ids=all_ids,
            metadatas=all_metadatas,
        )
        logger.info(f"RAG loaded: {len(all_docs)} chunks from {len(md_files)} files")

    _initialized = True


def retrieve(query: str, n_results: int = 3) -> list[str]:
    """Retrieve top-N relevant chunks for a query."""
    if _collection is None:
        return []

    try:
        results = _collection.query(
            query_texts=[query],
            n_results=n_results,
        )
        docs = results.get("documents", [[]])[0]
        return docs
    except Exception as e:
        logger.warning(f"RAG retrieval failed: {e}")
        return []


def format_rag_context(chunks: list[str]) -> str:
    """Format retrieved chunks into a string for prompt injection."""
    if not chunks:
        return ""
    context_parts = [
        "Reference knowledge (use to inform your response):",
        "---",
    ]
    for i, chunk in enumerate(chunks, 1):
        context_parts.append(f"[{i}] {chunk}")
        context_parts.append("---")
    return "\n".join(context_parts)
