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
            for msg in history[-10:]:  # Ambil max 10 pesan terakhir
                messages.append({"role": msg["role"], "content": msg["content"]})
            messages.append({"role": "user", "content": user_message})

            stream = await client.chat.completions.create(
                model=self.model,
                messages=messages,
                stream=True,
                temperature=0.3,        # Rendah = lebih faktual untuk teknis
                max_tokens=2048,
            )

            async for chunk in stream:
                delta = chunk.choices[0].delta
                if delta.content:
                    yield delta.content

        except Exception as e:
            logger.error(f"OpenAI streaming error: {e}")
            yield f"\n\n[Error] Gagal mendapatkan respons dari OpenAI: {str(e)}"

    async def _stream_gemini(
        self,
        user_message: str,
        history: list[dict],
        system_prompt: str,
    ) -> AsyncGenerator[str, None]:
        """Google Gemini streaming dengan async generator."""
        try:
            import google.generativeai as genai
            from app.core.config import settings

            genai.configure(api_key=settings.GEMINI_API_KEY)
            model = genai.GenerativeModel(
                model_name=self.model,
                system_instruction=system_prompt,
            )

            # Susun history untuk Gemini format
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
            logger.error(f"Gemini streaming error: {e}")
            yield f"\n\n[Error] Gagal mendapatkan respons dari Gemini: {str(e)}"

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

        elif self.provider == "gemini":
            import google.generativeai as genai
            genai.configure(api_key=settings.GEMINI_API_KEY)
            result = genai.embed_content(
                model=settings.GEMINI_EMBEDDING_MODEL,
                content=text,
                task_type="retrieval_document",
            )
            return result["embedding"]

        raise ValueError(f"Provider '{self.provider}' tidak didukung untuk embedding.")
