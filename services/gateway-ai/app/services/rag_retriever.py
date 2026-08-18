"""
K2NET FTTH AI Gateway — RAG Retriever
Text chunking, embedding generation & contextual prompt builder.
"""
from typing import Optional
import uuid
import logging
import re

logger = logging.getLogger(__name__)


class RAGRetriever:
    """
    Retriever Dokumen RAG (Retrieval-Augmented Generation).
    Mengambil potongan dokumen yang relevan dari pgvector berdasarkan query user.
    SEMUA query WAJIB terisolasi per tenant.
    """

    def __init__(self, tenant_id: uuid.UUID, provider: Optional[str] = None):
        self.tenant_id = tenant_id
        self.provider = provider

    async def retrieve_context(
        self,
        query: str,
        limit: int = 4,
        scope: str = "GENERAL",
        min_similarity: float = 0.3,
    ) -> tuple[list[str], list[dict]]:
        """
        Ambil konteks relevan dari knowledge base tenant.
        
        Returns:
            contexts: List string konten chunk untuk dimasukkan ke LLM prompt
            sources: List metadata source untuk ditampilkan di UI (citation)
        """
        from app.db.vector_store import vector_store
        from app.services.llm_engine import LLMEngine

        # 1. Generate embedding untuk query user
        engine = LLMEngine(provider=self.provider)
        try:
            query_embedding = await engine.generate_embedding(query)
        except Exception as e:
            logger.warning(f"Embedding generation failed (RAG skip): {e}")
            return [], []

        # 2. Similarity search di pgvector (tenant-scoped)
        chunks = await vector_store.similarity_search(
            query_embedding=query_embedding,
            tenant_id=self.tenant_id,
            scope=scope,
            limit=limit,
            min_similarity=min_similarity,
        )

        if not chunks:
            return [], []

        # 3. Susun list konteks dan metadata sumber
        contexts = []
        sources = []

        for chunk in chunks:
            contexts.append(chunk["content"])
            sources.append({
                "document_id": chunk["document_id"],
                "title": chunk["document_title"],
                "category": chunk["category"],
                "chunk_index": chunk["chunk_index"],
                "similarity_score": round(float(chunk["similarity_score"]), 4),
                "content_preview": chunk["content"][:120] + "...",
            })

        logger.info(
            f"RAG retrieved {len(chunks)} chunks for tenant={self.tenant_id}, scope={scope}, "
            f"min_sim={chunks[0]['similarity_score']:.4f} ~ max_sim={chunks[-1]['similarity_score']:.4f}"
        )
        return contexts, sources


class DocumentChunker:
    """
    Text splitter berbasis token count dengan overlap.
    Digunakan saat mengindeks dokumen ke knowledge base.
    """

    def __init__(self, chunk_size: int = 500, overlap: int = 50):
        self.chunk_size = chunk_size
        self.overlap = overlap

    def chunk_text(self, text: str) -> list[str]:
        """
        Split teks menjadi chunk berukuran ~chunk_size kata dengan overlap.
        """
        # Normalisasi whitespace
        text = re.sub(r'\s+', ' ', text.strip())

        # Split menjadi kalimat
        sentences = re.split(r'(?<=[.!?])\s+', text)

        chunks = []
        current_chunk = []
        current_size = 0

        for sentence in sentences:
            word_count = len(sentence.split())

            if current_size + word_count > self.chunk_size and current_chunk:
                chunks.append(" ".join(current_chunk))
                # Buat overlap dengan mengambil kata-kata terakhir
                overlap_words = " ".join(current_chunk).split()[-self.overlap:]
                current_chunk = overlap_words + sentence.split()
                current_size = len(current_chunk)
            else:
                current_chunk.extend(sentence.split())
                current_size += word_count

        if current_chunk:
            chunks.append(" ".join(current_chunk))

        return chunks

    def count_tokens(self, text: str) -> int:
        """Estimasi token count (1 token ≈ 0.75 kata dalam BPE tokenizer)."""
        try:
            import tiktoken
            enc = tiktoken.get_encoding("cl100k_base")
            return len(enc.encode(text))
        except Exception:
            # Fallback: estimasi kasar
            return int(len(text.split()) * 1.3)
