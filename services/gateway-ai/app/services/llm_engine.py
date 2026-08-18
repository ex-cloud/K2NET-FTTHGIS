"""
K2NET FTTH AI Gateway — Multi-Provider LLM Engine
Mendukung: OpenAI (GPT-4o / GPT-4o-mini) & Google Gemini (1.5-flash / 1.5-pro)
Semua output dalam mode streaming async generator.
"""
from typing import AsyncGenerator, Optional
import logging

logger = logging.getLogger(__name__)

# System prompt default untuk konteks K2NET FTTH GIS
KTFTH_SYSTEM_PROMPT = """Kamu adalah K2NET AI Assistant, asisten kecerdasan buatan cerdas yang khusus dirancang untuk platform manajemen infrastruktur FTTH GIS K2NET.

Bidang keahlianmu:
- Troubleshooting perangkat OLT/ONT (ZTE C300/C320/C600, Huawei MA5800, FiberHome AN5516)
- Interpretasi nilai redaman optik (dBm) dan analisis loss budget kabel fiber
- Konfigurasi jaringan GPON/EPON, VLAN, DHCP, PPPoE
- Tata cara survey lapangan, instalasi ODP/ODC, dan splicing kabel
- Analisis utilitas kapasitas ODP dan perencanaan perluasan jaringan
- Pembuatan tiket gangguan, draft notifikasi pelanggan, dan ringkasan audit log

Panduan Respons:
1. Gunakan format Markdown (heading, bullet, code block) untuk kejelasan.
2. Selalu sertakan langkah troubleshooting bernomor jika ada prosedur teknis.
3. Jika ada data dari knowledge base (ditandai [KONTEKS]), utamakan informasi tersebut.
4. Jika tidak yakin, katakan "Saya tidak memiliki data cukup" — jangan mengarang.
5. Respons dalam Bahasa Indonesia kecuali user menulis dalam bahasa lain.
"""


class LLMEngine:
    """Wrapper multi-provider LLM dengan streaming async generator."""

    def __init__(self, provider: Optional[str] = None, model: Optional[str] = None):
        from app.core.config import settings
        self.provider = provider or settings.DEFAULT_LLM_PROVIDER
        self.model = model or self._default_model()

    def _default_model(self) -> str:
        from app.core.config import settings
        if self.provider == "openai":
            return settings.OPENAI_CHAT_MODEL
        elif self.provider in ("ollama", "local"):
            return settings.OLLAMA_CHAT_MODEL
        return settings.GEMINI_CHAT_MODEL

    async def stream_chat(
        self,
        user_message: str,
        history: list[dict],
        contexts: list[str],
        system_prompt: Optional[str] = None,
    ) -> AsyncGenerator[str, None]:
        """
        Streaming generator: yields token string satu per satu.
        Kompatibel dengan SSE response di chat.py.
        """
        final_system = system_prompt or KTFTH_SYSTEM_PROMPT

        # Tambahkan konteks RAG ke system prompt jika ada
        if contexts:
            context_block = "\n\n".join(
                [f"[KONTEKS {i+1}]\n{ctx}" for i, ctx in enumerate(contexts)]
            )
            final_system += f"\n\n---\nKnowledge Base Relevan:\n{context_block}\n---"

        if self.provider == "openai":
            async for token in self._stream_openai(user_message, history, final_system):
                yield token
        elif self.provider == "gemini":
            async for token in self._stream_gemini(user_message, history, final_system):
                yield token
        elif self.provider in ("ollama", "local"):
            async for token in self._stream_ollama(user_message, history, final_system):
                yield token
        else:
            yield f"[Error] Provider '{self.provider}' tidak dikenal."

    async def _stream_openai(
        self,
        user_message: str,
        history: list[dict],
        system_prompt: str,
    ) -> AsyncGenerator[str, None]:
        """OpenAI streaming dengan async generator."""
        try:
            from openai import AsyncOpenAI
            from app.core.config import settings

            client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

            messages = [{"role": "system", "content": system_prompt}]
            for msg in history[-10:]:
                messages.append({"role": msg["role"], "content": msg["content"]})
            messages.append({"role": "user", "content": user_message})

            stream = await client.chat.completions.create(
                model=self.model,
                messages=messages,
                stream=True,
                temperature=0.3,
                max_tokens=2048,
            )

            async for chunk in stream:
                delta = chunk.choices[0].delta
                if delta.content:
                    yield delta.content

        except Exception as e:
            logger.error(f"OpenAI streaming error: {e}")
            yield f"\n\n[Error] Gagal mendapatkan respons dari OpenAI: {str(e)}"

    async def _stream_ollama(
        self,
        user_message: str,
        history: list[dict],
        system_prompt: str,
    ) -> AsyncGenerator[str, None]:
        """Local Ollama / On-Premise model streaming via OpenAI-compatible endpoint."""
        try:
            from openai import AsyncOpenAI
            from app.core.config import settings

            client = AsyncOpenAI(
                base_url=settings.OLLAMA_BASE_URL,
                api_key="ollama",
            )

            messages = [{"role": "system", "content": system_prompt}]
            for msg in history[-10:]:
                messages.append({"role": msg["role"], "content": msg["content"]})
            messages.append({"role": "user", "content": user_message})

            stream = await client.chat.completions.create(
                model=self.model or settings.OLLAMA_CHAT_MODEL,
                messages=messages,
                stream=True,
                temperature=0.3,
                max_tokens=2048,
            )

            async for chunk in stream:
                delta = chunk.choices[0].delta
                if delta.content:
                    yield delta.content

        except Exception as e:
            logger.error(f"Ollama streaming error: {e}")
            yield f"\n\n[Error] Gagal terhubung ke Local Ollama Engine ({settings.OLLAMA_BASE_URL}): {str(e)}"

    async def _stream_gemini(
        self,
        user_message: str,
        history: list[dict],
        system_prompt: str,
    ) -> AsyncGenerator[str, None]:
        """Google Gemini streaming dengan async generator."""
        try:
            import os
            import google.generativeai as genai
            from app.core.config import settings

            gemini_key = (
                settings.GEMINI_API_KEY
                or settings.GOOGLE_API_KEY
                or os.getenv("GEMINI_API_KEY")
                or os.getenv("GOOGLE_API_KEY")
            )
            if not gemini_key:
                raise ValueError("Gemini API Key belum dikonfigurasi.")

            genai.configure(api_key=gemini_key)
            model_name = self.model or settings.GEMINI_CHAT_MODEL
            if not model_name.startswith("models/") and "/" not in model_name:
                model_name = f"models/{model_name}"

            model = genai.GenerativeModel(
                model_name=model_name,
                system_instruction=system_prompt,
            )

            gemini_history = []
            for msg in history[-10:]:
                gemini_history.append({
                    "role": "user" if msg["role"] == "user" else "model",
                    "parts": [msg["content"]],
                })

            chat = model.start_chat(history=gemini_history)
            response = await chat.send_message_async(
                user_message,
                stream=True,
                generation_config={"temperature": 0.3, "max_output_tokens": 2048},
            )

            async for chunk in response:
                if chunk.text:
                    yield chunk.text

        except Exception as e:
            logger.warning(f"Gemini streaming failed ({e}), attempting fallback to Local Ollama...")
            # Otomatis beralih ke Local Ollama on-premise jika kuota Gemini habis
            try:
                yield f"\n\n*(Mengalihkan ke Local On-Premise Engine karena kuota cloud terbatas...)*\n\n"
                async for chunk in self._stream_ollama(user_message, history, system_prompt):
                    yield chunk
            except Exception as fallback_err:
                logger.error(f"Fallback to Ollama also failed: {fallback_err}")
                yield f"\n\n[Error] Gagal mendapatkan respons dari Gemini ({str(e)}) dan Local Fallback ({str(fallback_err)})."

    async def generate_embedding(self, text: str) -> list[float]:
        """Generate embedding vector untuk teks (digunakan saat indexing dokumen)."""
        from app.core.config import settings

        if self.provider == "openai":
            from openai import AsyncOpenAI
            client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
            response = await client.embeddings.create(
                model=settings.OPENAI_EMBEDDING_MODEL,
                input=text,
            )
            return response.data[0].embedding

        elif self.provider in ("ollama", "local"):
            from openai import AsyncOpenAI
            client = AsyncOpenAI(
                base_url=settings.OLLAMA_BASE_URL,
                api_key="ollama",
            )
            response = await client.embeddings.create(
                model=settings.OLLAMA_EMBEDDING_MODEL,
                input=text,
            )
            emb = response.data[0].embedding
            if len(emb) < 1536:
                emb = emb + [0.0] * (1536 - len(emb))
            return emb[:1536]

        elif self.provider == "gemini":
            import os
            import google.generativeai as genai
            gemini_key = (
                settings.GEMINI_API_KEY
                or settings.GOOGLE_API_KEY
                or os.getenv("GEMINI_API_KEY")
                or os.getenv("GOOGLE_API_KEY")
            )
            if not gemini_key:
                raise ValueError("Gemini API Key belum dikonfigurasi (setel GEMINI_API_KEY atau GOOGLE_API_KEY).")

            genai.configure(api_key=gemini_key)
            model_name = settings.GEMINI_EMBEDDING_MODEL
            if not model_name.startswith("models/"):
                model_name = f"models/{model_name}"

            result = genai.embed_content(
                model=model_name,
                content=text,
                task_type="retrieval_document",
            )
            emb = result["embedding"]
            if len(emb) < 1536:
                emb = emb + [0.0] * (1536 - len(emb))
            return emb[:1536]

        raise ValueError(f"Provider '{self.provider}' tidak didukung untuk embedding.")
