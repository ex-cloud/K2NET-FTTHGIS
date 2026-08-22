#!/usr/bin/env python3
"""
K2NET FTTH AI Assistant — Local Knowledge Ingestion Tool (Upgraded)
Mengindeks seluruh dokumentasi kanonikal (/opt/project5/docs/00_... s/d 05_...)
ke dalam PostgreSQL pgvector (ai_documents & ai_document_chunks) dengan YAML Frontmatter metadata.

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


def parse_frontmatter(content: str) -> tuple[dict, str]:
    """Parse YAML frontmatter metadata dari file markdown."""
    meta = {}
    body = content
    if content.startswith("---"):
        parts = content.split("---", 2)
        if len(parts) >= 3:
            fm_text = parts[1].strip()
            body = parts[2].strip()
            for line in fm_text.splitlines():
                if ":" in line:
                    k, v = line.split(":", 1)
                    k = k.strip().lower()
                    v = v.strip().strip('"').strip("'")
                    if v.startswith("[") and v.endswith("]"):
                        tags_raw = v[1:-1].split(",")
                        meta[k] = [t.strip().strip('"').strip("'") for t in tags_raw if t.strip()]
                    else:
                        meta[k] = v
    return meta, body


async def ingest_directory(docs_dir: str, tenant_id: uuid.UUID, default_category: str = "GENERAL"):
    """Scan dan indeks semua file Markdown di folder kanonikal."""
    category_mapping = {
        "00_AI_Agent": "GENERAL",
        "01_Architecture": "NETWORK_CONFIG",
        "02_SOP_Troubleshooting": "TROUBLESHOOTING",
        "03_Infrastructure": "INFRASTRUCTURE",
        "04_GIS_Mapping": "GIS_MANUAL",
        "05_Plans_Roadmap": "PLANS",
    }
    allowed_dirs = set(category_mapping.keys())
    valid_categories = {"GENERAL", "NETWORK_CONFIG", "TROUBLESHOOTING", "INFRASTRUCTURE", "GIS_MANUAL", "PLANS"}
    valid_scopes = {"GLOBAL", "TENANT_INTERNAL", "PLATFORM_INTERNAL"}

    print(f"🔍 Scanning canonical documents in: {docs_dir}")
    files = glob.glob(os.path.join(docs_dir, "**/*.md"), recursive=True)
    files.extend(glob.glob(os.path.join(docs_dir, "**/*.txt"), recursive=True))

    if not files:
        print(f"⚠️ Tidak ada file dokumen ditemukan di {docs_dir}")
        return

    print(f"📚 Ditemukan {len(files)} total file kandidat.")
    engine = LLMEngine()
    chunker = DocumentChunker(
        chunk_size=settings.RAG_CHUNK_SIZE,
        overlap=settings.RAG_CHUNK_OVERLAP,
    )

    success_count = 0
    skipped_count = 0

    for file_path in sorted(files):
        rel_path = os.path.relpath(file_path, docs_dir)
        parts = rel_path.split(os.sep)
        top_folder = parts[0] if len(parts) > 1 else ""

        # Abaikan direktori arsip, server lama, note, temp, atau file root
        if top_folder not in allowed_dirs:
            print(f"   ⏩ Lewati non-canonical: {rel_path}")
            skipped_count += 1
            continue

        filename = Path(file_path).name
        if filename.startswith(".") or filename.startswith("#") or "dummy" in filename.lower():
            print(f"   ⏩ Lewati temporary/dummy file: {rel_path}")
            skipped_count += 1
            continue

        try:
            with open(file_path, "r", encoding="utf-8", errors="replace") as f:
                raw_content = f.read().strip()

            if len(raw_content) < 15:
                print(f"   ⚠️ Konten terlalu pendek: {rel_path}")
                skipped_count += 1
                continue

            fm, body_content = parse_frontmatter(raw_content)

            # Metadata Title
            title = fm.get("title") or Path(file_path).stem.replace("-", " ").replace("_", " ").title()

            # Metadata Category
            fm_cat = fm.get("category", "").upper()
            category = fm_cat if fm_cat in valid_categories else category_mapping.get(top_folder, default_category)

            # Metadata Scope
            fm_scope = fm.get("scope", "").upper()
            if fm_scope in valid_scopes:
                scope_val = fm_scope
            elif category in ("INFRASTRUCTURE", "NETWORK_CONFIG", "PLANS"):
                scope_val = "PLATFORM_INTERNAL"
            elif category in ("TROUBLESHOOTING", "GIS_MANUAL"):
                scope_val = "TENANT_INTERNAL"
            else:
                scope_val = "GLOBAL"

            print(f"\n📄 Memproses: '{title}' [{category} | {scope_val}] ({rel_path})...")

            # 1. Simpan master record
            doc_id = uuid.uuid4()
            async with get_db_session() as session:
                # Cek apakah file sudah ada
                check = await session.execute(
                    text("SELECT id FROM ai_documents WHERE tenant_id = :tenant_id AND file_name = :fn"),
                    {"tenant_id": str(tenant_id), "fn": rel_path},
                )
                existing = check.scalar()
                if existing:
                    # Update status existing to PROCESSING
                    doc_id = uuid.UUID(str(existing))
                    await session.execute(
                        text("DELETE FROM ai_document_chunks WHERE document_id = :doc_id"),
                        {"doc_id": str(doc_id)}
                    )
                    await session.execute(
                        text("""
                            UPDATE ai_documents 
                            SET title = :title, category = :category, scope = :scope, 
                                file_size_bytes = :size, status = 'PROCESSING', raw_content = :raw
                            WHERE id = :id
                        """),
                        {
                            "id": str(doc_id),
                            "title": title,
                            "category": category,
                            "scope": scope_val,
                            "size": len(raw_content.encode("utf-8")),
                            "raw": raw_content,
                        }
                    )
                else:
                    await session.execute(
                        text("""
                            INSERT INTO ai_documents
                                (id, tenant_id, title, category, scope, file_name, file_size_bytes, mime_type, status, raw_content)
                            VALUES
                                (:id, :tenant_id, :title, :category, :scope, :file_name, :size, 'text/markdown', 'PROCESSING', :raw)
                        """),
                        {
                            "id": str(doc_id),
                            "tenant_id": str(tenant_id),
                            "title": title,
                            "category": category,
                            "scope": scope_val,
                            "file_name": rel_path,
                            "size": len(raw_content.encode("utf-8")),
                            "raw": raw_content,
                        },
                    )

            # 2. Chunking
            chunks = chunker.chunk_text(body_content if len(body_content) > 10 else raw_content)
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
                            "scope": scope_val,
                            "category": category,
                            "title": title,
                        },
                    )
                    stored_count += 1
                    await asyncio.sleep(0.5)
                except Exception as chunk_err:
                    print(f"   ❌ Gagal membuat embedding chunk {i}: {chunk_err}")

            # 4. Selesai
            if stored_count > 0:
                await vector_store.update_document_status(
                    doc_id, tenant_id, "INDEXED", chunk_count=stored_count
                )
                print(f"   ✅ Sukses diindeks: {stored_count}/{len(chunks)} chunks disimpan di pgvector.")
                success_count += 1
            else:
                await vector_store.update_document_status(
                    doc_id, tenant_id, "FAILED", chunk_count=0, error_message="0 vector chunks generated"
                )
                print(f"   ❌ Gagal: 0 chunks dibuat.")

        except Exception as file_err:
            print(f"   ❌ Gagal memproses {rel_path}: {file_err}")

    print(f"\n✨ Ringkasan Ingestion: {success_count} berhasil diindeks, {skipped_count} dilewati.")


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
        default="/opt/project5/docs",
        help="Path direktori dokumen kanonikal yang akan diindeks"
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
        await ingest_directory(args.dir, tenant_uuid)
    finally:
        await close_db()
        print("\n🎉 Ingestion selesai! Knowledge base lokal siap digunakan oleh AI Assistant.")


if __name__ == "__main__":
    asyncio.run(main())
