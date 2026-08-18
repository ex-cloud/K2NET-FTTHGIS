"""
K2NET FTTH AI Gateway — Async Database Session (SQLAlchemy + asyncpg)
"""
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.pool import NullPool
from contextlib import asynccontextmanager
from typing import AsyncGenerator
import logging

logger = logging.getLogger(__name__)

_engine = None
_session_factory = None


def init_db(database_url: str, pool_size: int = 10, max_overflow: int = 5) -> None:
    """Inisialisasi async engine dan session factory. Dipanggil saat app startup."""
    global _engine, _session_factory

    _engine = create_async_engine(
        database_url,
        pool_size=pool_size,
        max_overflow=max_overflow,
        pool_pre_ping=True,       # Cek koneksi sebelum digunakan
        pool_recycle=3600,        # Recycle koneksi tiap 1 jam
        echo=False,
    )
    _session_factory = async_sessionmaker(
        _engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )
    logger.info("Database engine initialized successfully.")


async def close_db() -> None:
    """Dispose engine pool saat shutdown."""
    global _engine
    if _engine:
        await _engine.dispose()
        logger.info("Database engine disposed.")


@asynccontextmanager
async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    """Context manager untuk mendapatkan session database async."""
    if not _session_factory:
        raise RuntimeError("Database not initialized. Call init_db() first.")
    async with _session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


async def check_db_connection() -> bool:
    """Health check — verifikasi koneksi PostgreSQL aktif."""
    try:
        from sqlalchemy import text
        async with get_db_session() as session:
            await session.execute(text("SELECT 1"))
        return True
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        return False
