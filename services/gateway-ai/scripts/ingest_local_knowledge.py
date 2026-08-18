#!/usr/bin/env python3
"""
K2NET FTTH AI Assistant — Local Knowledge Ingestion Tool
Mengindeks seluruh dokumentasi lokal (docs/Server/rekomendasi, SOP, manual arsitektur)
ke dalam PostgreSQL pgvector (ai_documents & ai_document_chunks) secara otomatis.

Usage:
    python scripts/ingest_local_knowledge.py --tenant-id <UUID> [--dir /path/to/docs]
"""

import os
import sys
import asyncio
import uuid
import argparse
import glob
from pathlib import Path

# Add project root to sys.path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.core.config import settings
from app.db.session import init_db, close_db, get_db_session
from app.db.vector_store import vector_store
from app.services.rag_retriever import DocumentChunker
from app.services.llm_engine import LLMEngine
from sqlalchemy import text


async def ingest_directory(docs_dir: str, tenant_id: uuid.UUID, category: str = "GENERAL"):
    """Scan dan indeks semua file Markdown dan TXT di direktori target."""
    print(f"🔍 Scanning documents in: {docs_dir}")
    files = glob.glob(os.path.join(docs_dir, "**/*.md"), recursive=True)
    files.extend(glob.glob(os.path.join(docs_dir, "**/*.txt"), recursive=True))

    if not files:
        print(f"⚠️ Tidak ada file markdown/txt ditemukan di {docs_dir}")
        return

    print(f"📚 Ditemukan {len(files)} file dokumen untuk diindeks.")
    engine = LLMEngine()
    chunker = DocumentChunker(
        chunk_size=settings.RAG_CHUNK_SIZE,
        overlap=settings.RAG_CHUNK_OVERLAP,
    )

    for file_path in files:
        rel_path = os.path.relpath(file_path, docs_dir)
        title = Path(file_path).stem.replace("-", " ").replace("_", " ").title()

        try:
            with open(file_path, "r", encoding="utf-8", errors="replace") as f:
                content = f.read().strip()

            if not content:
                continue

            print(f"\n📄 Memproses: {title} ({rel_path})...")

            # 1. Simpan master record
            doc_id = uuid.uuid4()
            sql = text("""
                INSERT INTO ai_documents
                    (id, tenant_id, title, category, file_name, file_size_bytes, mime_type, status)
                VALUES
                    (:id, :tenant_id, :title, :category, :file_name, :size, 'text/markdown', 'PROCESSING')
            """)
            async with get_db_session() as session:
                await session.execute(
                    sql,
                    {
                        "id": str(doc_id),
                        "tenant_id": str(tenant_id),
                        "title": title,
                        "category": category,
                        "file_name": rel_path,
                        "size": len(content.encode("utf-8")),
                    },
                )

            # 2. Chunking
            chunks = chunker.chunk_text(content)
            print(f"   ✂️  Dibuat {len(chunks)} chunks...")

            # 3. Embedding & Store
            stored_count = 0
            for i, chunk_text in enumerate(chunks):
                try:
                    embedding = await engine.generate_embedding(chunk_text)
                    token_count = chunker.count_tokens(chunk_text)
                    await vector_store.store_chunk(
                        document_id=doc_id,
                        tenant_id=tenant_id,
                        chunk_index=i,
                        content=chunk_text,
                        token_count=token_count,
                        embedding=embedding,
                        metadata={
                            "source_file": rel_path,
                            "chunk_index": i,
                            "total_chunks": len(chunks),
                        },
                    )
                    stored_count += 1
                except Exception as chunk_err:
                    print(f"   ❌ Gagal membuat embedding chunk {i}: {chunk_err}")

            # 4. Selesai
            await vector_store.update_document_status(
                doc_id, tenant_id, "INDEXED", chunk_count=stored_count
            )
            print(f"   ✅ Sukses diindeks: {stored_count}/{len(chunks)} chunks disimpan di pgvector.")

        except Exception as file_err:
            print(f"   ❌ Gagal memproses {rel_path}: {file_err}")


async def main():
    parser = argparse.ArgumentParser(description="K2NET Local Knowledge Ingestion Tool")
    parser.add_argument(
        "--tenant-id",
        type=str,
        default="00000000-0000-0000-0000-000000000000",
        help="UUID Tenant target untuk mengisolasi knowledge base (Default: Global/Superadmin)"
    )
    parser.add_argument(
        "--dir",
        type=str,
        default="/opt/project5/docs/Server/rekomendasi",
        help="Path direktori dokumen lokal yang akan diindeks"
    )
    parser.add_argument(
        "--category",
        type=str,
        default="GENERAL",
        help="Kategori: GENERAL | SOP | NETWORK_CONFIG | TROUBLESHOOTING | GIS_MANUAL"
    )
    args = parser.parse_args()

    tenant_uuid = uuid.UUID(args.tenant_id)
    print("🚀 Inisialisasi Database Connection Pool...")
    db_url = os.getenv("DATABASE_URL") or settings.DATABASE_URL
    if not db_url:
        print("❌ DATABASE_URL belum disetel! Harap setel environment variable DATABASE_URL.")
        sys.exit(1)

    init_db(db_url)
    try:
        await ingest_directory(args.dir, tenant_uuid, args.category)
    finally:
        await close_db()
        print("\n🎉 Selesai! Knowledge base lokal siap digunakan oleh AI Assistant.")


if __name__ == "__main__":
    asyncio.run(main())
