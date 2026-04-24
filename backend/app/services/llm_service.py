"""
Shared LLM and embedding helpers.

Text generation uses Groq chat completions with a Llama model.
Embeddings use the locally configured sentence-transformers model so
vector search stays independent from the chat provider.
"""

import logging
from importlib import import_module
from typing import Any, Iterator, List, Optional

from app.config import settings

logger = logging.getLogger(__name__)

_groq_client: Optional[Any] = None
_embedding_model: Optional[Any] = None


def is_configured() -> bool:
    return bool(settings.groq_api_key)


def _get_groq_client() -> Any:
    global _groq_client
    if _groq_client is None:
        if not settings.groq_api_key:
            raise RuntimeError("Groq API key not configured")
        try:
            Groq = import_module("groq").Groq
        except ImportError as exc:
            raise RuntimeError(
                "groq is not installed. Install backend dependencies to enable text generation."
            ) from exc
        _groq_client = Groq(api_key=settings.groq_api_key)
    return _groq_client


def _build_messages(prompt: str, system_prompt: Optional[str] = None) -> List[dict]:
    messages: List[dict] = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    messages.append({"role": "user", "content": prompt})
    return messages


def generate_text(prompt: str, system_prompt: Optional[str] = None, temperature: float = 0.2) -> str:
    client = _get_groq_client()
    completion = client.chat.completions.create(
        model=settings.groq_model,
        messages=_build_messages(prompt, system_prompt),
        temperature=temperature,
    )
    return completion.choices[0].message.content or ""


def stream_text(
    prompt: str,
    system_prompt: Optional[str] = None,
    temperature: float = 0.2,
) -> Iterator[str]:
    client = _get_groq_client()
    stream = client.chat.completions.create(
        model=settings.groq_model,
        messages=_build_messages(prompt, system_prompt),
        temperature=temperature,
        stream=True,
    )
    for chunk in stream:
        if not chunk.choices:
            continue
        delta = chunk.choices[0].delta.content or ""
        if delta:
            yield delta


def _get_embedding_model():
    global _embedding_model
    if _embedding_model is None:
        try:
            SentenceTransformer = import_module("sentence_transformers").SentenceTransformer
        except ImportError as exc:
            raise RuntimeError(
                "sentence-transformers is not installed. Install backend dependencies to enable embeddings."
            ) from exc

        model_name = settings.pinecone_embedding_model
        if model_name.startswith("sentence-transformers/"):
            model_name = model_name.split("/", 1)[1]
        logger.info("Loading embedding model: %s", model_name)
        _embedding_model = SentenceTransformer(model_name)
    return _embedding_model


def embed_text(text: str) -> List[float]:
    model = _get_embedding_model()
    if model is None:
        raise RuntimeError("Embedding model not available")
    vector = model.encode(text[:4000], normalize_embeddings=True)
    return vector.tolist()
