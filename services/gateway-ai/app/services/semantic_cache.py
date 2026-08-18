"""
K2NET FTTH AI Gateway — Native Async Redis Semantic Cache
Menyediakan caching cerdas berbasis Cosine Similarity untuk respons AI.
Tanpa dependensi eksternal: Berjalan menggunakan protokol RESP async bawaan Python.
"""
import asyncio
import json
import logging
import math
import time
from typing import Optional, List, Dict, Any

logger = logging.getLogger(__name__)


def _encode_resp(*args) -> bytes:
    """Mengodekan argumen perintah Redis ke format RESP (REdis Serialization Protocol)."""
    buf = [f"*{len(args)}\r\n".encode("utf-8")]
    for arg in args:
        if isinstance(arg, bytes):
            s = arg
        else:
            s = str(arg).encode("utf-8")
        buf.append(f"${len(s)}\r\n".encode("utf-8"))
        buf.append(s)
        buf.append(b"\r\n")
    return b"".join(buf)


async def _read_resp(reader: asyncio.StreamReader) -> Any:
    """Membaca balasan protokol RESP dari Redis server."""
    line = await reader.readline()
    if not line:
        return None

    prefix = line[:1]
    payload = line[1:-2]  # strip prefix & \r\n

    if prefix == b"+":  # Simple string
        return payload.decode("utf-8", errors="replace")
    elif prefix == b"-":  # Error
        err_msg = payload.decode("utf-8", errors="replace")
        logger.warning(f"Redis error response: {err_msg}")
        return None
    elif prefix == b":":  # Integer
        return int(payload)
    elif prefix == b"$":  # Bulk string
        length = int(payload)
        if length == -1:
            return None
        data = await reader.readexactly(length)
        await reader.readexactly(2)  # consume trailing \r\n
        return data.decode("utf-8", errors="replace")
    elif prefix == b"*":  # Array
        count = int(payload)
        if count == -1:
            return None
        items = []
        for _ in range(count):
            items.append(await _read_resp(reader))
        return items
    return None


def _cosine_similarity(vec1: List[float], vec2: List[float]) -> float:
    """Menghitung kemiripan kosinus antara 2 vektor embedding."""
    if not vec1 or not vec2 or len(vec1) != len(vec2):
        return 0.0
    dot_product = sum(a * b for a, b in zip(vec1, vec2))
    norm_a = math.sqrt(sum(a * a for a in vec1))
    norm_b = math.sqrt(sum(b * b for b in vec2))
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot_product / (norm_a * norm_b)


class SemanticCacheManager:
    """Manajer Semantic Caching mandiri terhubung ke container Docker ftth-redis."""

    def __init__(self, host: str = "ftth-redis", port: int = 6379, default_ttl: int = 86400):
        self.host = host
        self.port = port
        self.default_ttl = default_ttl
        self.enabled = True
        self._lock = asyncio.Lock()

    async def _execute_command(self, *args) -> Any:
        """Membuka koneksi async singkat ke Redis dan mengeksekusi perintah."""
        if not self.enabled:
            return None
        try:
            reader, writer = await asyncio.wait_for(
                asyncio.open_connection(self.host, self.port),
                timeout=1.5
            )
            writer.write(_encode_resp(*args))
            await writer.drain()
            result = await asyncio.wait_for(_read_resp(reader), timeout=2.0)
            writer.close()
            await writer.wait_closed()
            return result
        except Exception as e:
            logger.debug(f"Redis cache connection failed ({self.host}:{self.port}): {e}")
            return None

    async def ping(self) -> bool:
        """Memeriksa apakah Redis container aktif."""
        res = await self._execute_command("PING")
        return res == "PONG"

    async def get_cached_answer(
        self,
        query_embedding: List[float],
        tenant_id: str,
        threshold: float = 0.96,
    ) -> Optional[Dict[str, Any]]:
        """
        Mencari cache jawaban yang memiliki Cosine Similarity >= threshold.
        Mengembalikan None jika tidak ada cache yang cocok.
        """
        if not query_embedding:
            return None

        # Ambil seluruh keys cache milik tenant ini
        pattern = f"ai:semcache:{tenant_id}:*"
        keys = await self._execute_command("KEYS", pattern)
        if not keys or not isinstance(keys, list):
            return None

        best_match: Optional[Dict[str, Any]] = None
        highest_sim = 0.0

        for k in keys[:25]:  # Batasi periksa 25 cache terbaru
            raw_val = await self._execute_command("GET", k)
            if not raw_val:
                continue

            try:
                data = json.loads(raw_val)
                cached_vec = data.get("embedding")
                if not cached_vec:
                    continue

                sim = _cosine_similarity(query_embedding, cached_vec)
                if sim > highest_sim and sim >= threshold:
                    highest_sim = sim
                    best_match = {
                        "content": data.get("response", ""),
                        "sources": data.get("sources", []),
                        "similarity": sim,
                        "cached_at": data.get("cached_at", time.time()),
                        "tokens": data.get("tokens", 0),
                    }
            except Exception:
                continue

        if best_match:
            logger.info(
                f"[SemanticCache HIT ⚡] Found match with similarity={highest_sim:.4f} for tenant={tenant_id}"
            )
        return best_match

    async def store_answer(
        self,
        query: str,
        query_embedding: List[float],
        response: str,
        sources: List[Dict[str, Any]],
        tenant_id: str,
        tokens: int = 0,
        ttl: Optional[int] = None,
    ) -> bool:
        """Menyimpan pasangan pertanyaan, vektor, dan jawaban ke Redis dengan TTL."""
        if not query or not query_embedding or not response:
            return False

        cache_ttl = ttl or self.default_ttl
        key_id = f"{int(time.time())}_{abs(hash(query)) % 1000000}"
        key = f"ai:semcache:{tenant_id}:{key_id}"

        payload = json.dumps({
            "query": query,
            "embedding": query_embedding,
            "response": response,
            "sources": sources,
            "tokens": tokens,
            "cached_at": time.time(),
        })

        res = await self._execute_command("SET", key, payload, "EX", cache_ttl)
        return res == "OK"


# Singleton instance semantic cache
semantic_cache = SemanticCacheManager()
