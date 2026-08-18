"""
K2NET FTTH AI Gateway — RAG Retriever (Hybrid Search: pgvector + PostgreSQL BM25 FTS + RRF)
Menggabungkan pencarian semantik vektor dengan Full-Text Search PostgreSQL
menggunakan algoritma Reciprocal Rank Fusion (RRF) untuk akurasi teknis maksimal.
"""
from typing import Optional, List, Dict
import uuid
import logging
import re

logger = logging.getLogger(__name__)

# ─── Konstanta RRF ────────────────────────────────────────────────────────────
# Nilai k=60 adalah default optimal yang direkomendasikan oleh penelitian RRF asli
_RRF_K = 60


def _reciprocal_rank_fusion(
    vector_results: List[Dict],
    keyword_results: List[Dict],
    top_k: int = 4,
) -> List[Dict]:
    """
    Menggabungkan hasil pencarian vektor dan kata kunci menggunakan RRF.
    RRF Score = Σ 1 / (k + rank_i)  untuk setiap kandidat dari setiap retriever.
    """
    scores: Dict[str, float] = {}
    merged: Dict[str, Dict] = {}

    for rank, chunk in enumerate(vector_results):
        cid = chunk["chunk_id"]
        scores[cid] = scores.get(cid, 0.0) + 1.0 / (_RRF_K + rank + 1)
        if cid not in merged:
            merged[cid] = chunk.copy()
            merged[cid]["search_method"] = "vector"

    for rank, chunk in enumerate(keyword_results):
        cid = chunk["chunk_id"]
        scores[cid] = scores.get(cid, 0.0) + 1.0 / (_RRF_K + rank + 1)
        if cid not in merged:
            merged[cid] = chunk.copy()
            merged[cid]["search_method"] = "keyword"
        else:
            merged[cid]["search_method"] = "hybrid"

    # Urutkan berdasarkan skor RRF dan ambil top_k
    sorted_chunks = sorted(scores.items(), key=lambda x: x[1], reverse=True)
    results = []
    for cid, rrf_score in sorted_chunks[:top_k]:
        chunk = merged[cid].copy()
        chunk["similarity_score"] = round(rrf_score * 5, 4)  # Normalize for UI display
        results.append(chunk)

    return results


class RAGRetriever:
    """
    Retriever Dokumen RAG dengan Hybrid Search (Semantik + BM25 Keyword) via RRF.
    SEMUA query WAJIB terisolasi per tenant (Multi-Tenant ABAC).
    """

    def __init__(self, tenant_id: uuid.UUID, provider: Optional[str] = None):
        self.tenant_id = tenant_id
        self.provider = provider

    async def retrieve_context(
        self,
        query: str,
        limit: int = 4,
        scope: str = "GENERAL",
        min_similarity: float = 0.25,
    ) -> tuple[list[str], list[dict]]:
        """
        Hybrid Search: Ambil konteks relevan dari knowledge base tenant.
        1. pgvector Cosine Similarity Search
        2. PostgreSQL Full-Text Search (tsvector + plainto_tsquery)
        3. Reciprocal Rank Fusion (RRF) untuk menggabungkan hasil

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
            logger.warning(f"Embedding generation failed, falling back to keyword search: {e}")
            query_embedding = None

        # 2a. Vector Search (jika embedding tersedia)
        vector_chunks: List[Dict] = []
        if query_embedding:
            try:
                vector_chunks = await vector_store.similarity_search(
                    query_embedding=query_embedding,
                    tenant_id=self.tenant_id,
                    scope=scope,
                    limit=limit * 2,  # Ambil lebih banyak untuk RRF
                    min_similarity=min_similarity,
                )
            except Exception as e:
                logger.warning(f"pgvector search failed: {e}")

        # 2b. PostgreSQL BM25 Full-Text Search (tsvector)
        keyword_chunks: List[Dict] = []
        try:
            keyword_chunks = await vector_store.fulltext_search(
                query=query,
                tenant_id=self.tenant_id,
                scope=scope,
                limit=limit * 2,
            )
        except Exception as e:
            logger.debug(f"Full-text search skipped: {e}")

        # 3. Gabungkan hasil dengan RRF (atau gunakan hasil tunggal jika salah satu kosong)
        if vector_chunks and keyword_chunks:
            final_chunks = _reciprocal_rank_fusion(vector_chunks, keyword_chunks, top_k=limit)
            logger.info(
                f"[Hybrid RRF] tenant={self.tenant_id}: vector={len(vector_chunks)} + keyword={len(keyword_chunks)} → merged={len(final_chunks)} chunks"
            )
        elif vector_chunks:
            final_chunks = vector_chunks[:limit]
            logger.info(f"[Vector Only] tenant={self.tenant_id}: {len(final_chunks)} chunks")
        elif keyword_chunks:
            final_chunks = keyword_chunks[:limit]
            logger.info(f"[Keyword Only] tenant={self.tenant_id}: {len(final_chunks)} chunks")
        else:
            return [], []

        # 4. Susun list konteks dan metadata sumber
        contexts = []
        sources = []

        for chunk in final_chunks:
            contexts.append(chunk["content"])
            sources.append({
                "document_id": chunk["document_id"],
                "title": chunk.get("title") or chunk.get("document_title", "Dokumen"),
                "category": chunk.get("category", "GENERAL"),
                "chunk_index": chunk.get("chunk_index", 0),
                "similarity_score": round(float(chunk.get("similarity_score", 0.0)), 4),
                "content_preview": chunk["content"][:120] + "...",
                "search_method": chunk.get("search_method", "vector"),
            })

        return contexts, sources

    async def retrieve_context_with_embedding(
        self,
        query: str,
        query_embedding: List[float],
        limit: int = 4,
        scope: str = "GENERAL",
    ) -> tuple[list[str], list[dict], List[float]]:
        """
        Variant yang menerima embedding yang sudah di-generate (untuk menghindari duplikasi kalkulasi).
        Digunakan oleh semantic cache pipeline di chat.py.
        Returns (contexts, sources, query_embedding).
        """
        from app.db.vector_store import vector_store

        vector_chunks = []
        try:
            vector_chunks = await vector_store.similarity_search(
                query_embedding=query_embedding,
                tenant_id=self.tenant_id,
                scope=scope,
                limit=limit * 2,
                min_similarity=0.25,
            )
        except Exception as e:
            logger.warning(f"pgvector search (reuse-embedding) failed: {e}")

        keyword_chunks = []
        try:
            keyword_chunks = await vector_store.fulltext_search(
                query=query,
                tenant_id=self.tenant_id,
                scope=scope,
                limit=limit * 2,
            )
        except Exception as e:
            logger.debug(f"FTS (reuse-embedding) skipped: {e}")

        if vector_chunks and keyword_chunks:
            final_chunks = _reciprocal_rank_fusion(vector_chunks, keyword_chunks, top_k=limit)
        elif vector_chunks:
            final_chunks = vector_chunks[:limit]
        elif keyword_chunks:
            final_chunks = keyword_chunks[:limit]
        else:
            return [], [], query_embedding

        contexts = [c["content"] for c in final_chunks]
        sources = [
            {
                "document_id": c["document_id"],
                "title": c.get("title") or c.get("document_title", "Dokumen"),
                "category": c.get("category", "GENERAL"),
                "chunk_index": c.get("chunk_index", 0),
                "similarity_score": round(float(c.get("similarity_score", 0.0)), 4),
                "content_preview": c["content"][:120] + "...",
                "search_method": c.get("search_method", "vector"),
            }
            for c in final_chunks
        ]
        return contexts, sources, query_embedding


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
