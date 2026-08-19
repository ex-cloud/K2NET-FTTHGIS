"""
K2NET FTTH AI Gateway — FastAPI Application Entry Point
"""
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import logging
import sys

# ── Logging Setup ─────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    stream=sys.stdout,
)
logger = logging.getLogger(__name__)


# ── Lifespan: Startup & Shutdown ─────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    from app.core.config import settings
    from app.db.session import init_db, close_db

    logger.info(f"🚀 K2NET AI Gateway starting on port {settings.PORT}")
    logger.info(f"🤖 LLM Provider: {settings.DEFAULT_LLM_PROVIDER}")

    # Init database connection pool
    init_db(
        database_url=settings.DATABASE_URL,
        pool_size=settings.DB_POOL_SIZE,
        max_overflow=settings.DB_MAX_OVERFLOW,
    )
    logger.info("✅ Database pool initialized")

    yield  # App is running

    # Shutdown: dispose DB pool
    await close_db()
    logger.info("🛑 K2NET AI Gateway shutdown complete")


# ── FastAPI App Instance ──────────────────────────────────────────────────────
app = FastAPI(
    title="K2NET FTTH AI Assistant Gateway",
    description="RAG-powered AI Assistant with SSE streaming for K2NET FTTH GIS Platform",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# ── CORS Middleware ───────────────────────────────────────────────────────────
from app.core.config import settings

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["X-Request-ID"],
)


# ── Global Exception Handler ─────────────────────────────────────────────────
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error", "detail": str(exc)},
    )


# ── Route Registrations ───────────────────────────────────────────────────────
from app.api.routes.health import router as health_router
from app.api.routes.chat import router as chat_router
from app.api.routes.sessions import router as sessions_router
from app.api.routes.documents import router as documents_router
from app.api.routes.providers import router as providers_router
from app.api.routes.graph import router as graph_router

app.include_router(health_router)
app.include_router(chat_router)
app.include_router(sessions_router)
app.include_router(documents_router)
app.include_router(providers_router)
app.include_router(graph_router)


# ── Entry Point ───────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=settings.PORT,
        log_level=settings.LOG_LEVEL.lower(),
        access_log=True,
    )
