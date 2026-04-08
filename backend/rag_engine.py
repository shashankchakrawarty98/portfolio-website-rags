from __future__ import annotations

import os
import re
from dataclasses import dataclass
from pathlib import Path
from typing import List, Dict, Any

import numpy as np
from groq import Groq
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


@dataclass
class Chunk:
    chunk_id: str
    file_name: str
    title: str
    text: str
    content_preview: str


class PortfolioRAG:
    def __init__(self, knowledge_dir: str, groq_api_key: str | None = None) -> None:
        self.knowledge_dir = Path(knowledge_dir)
        if not self.knowledge_dir.exists():
            raise FileNotFoundError(f"Knowledge directory not found: {self.knowledge_dir}")

        self.chunks: List[Chunk] = self._load_chunks()
        self.vectorizer = TfidfVectorizer(stop_words="english", ngram_range=(1, 2))
        self.doc_matrix = self.vectorizer.fit_transform([chunk.text for chunk in self.chunks])
        self.client = Groq(api_key=groq_api_key) if groq_api_key else None

    def _read_title(self, content: str, file_name: str) -> str:
        for line in content.splitlines():
            if line.strip().startswith("# "):
                return line.strip().removeprefix("# ").strip()
        return file_name.replace("_", " ").replace(".md", "").title()

    def _normalize(self, text: str) -> str:
        return re.sub(r"\s+", " ", text).strip()

    def _split_into_chunks(self, content: str, file_name: str) -> List[Chunk]:
        title = self._read_title(content, file_name)
        blocks = [self._normalize(block) for block in re.split(r"\n\s*\n+", content) if block.strip()]
        chunks: List[Chunk] = []
        buffer = ""
        idx = 0
        for block in blocks:
            candidate = (buffer + "\n\n" + block).strip() if buffer else block
            if len(candidate) <= 900:
                buffer = candidate
            else:
                if buffer:
                    chunks.append(
                        Chunk(
                            chunk_id=f"{file_name}:{idx}",
                            file_name=file_name,
                            title=title,
                            text=buffer,
                            content_preview=buffer[:180],
                        )
                    )
                    idx += 1
                buffer = block
        if buffer:
            chunks.append(
                Chunk(
                    chunk_id=f"{file_name}:{idx}",
                    file_name=file_name,
                    title=title,
                    text=buffer,
                    content_preview=buffer[:180],
                )
            )
        return chunks

    def _load_chunks(self) -> List[Chunk]:
        chunks: List[Chunk] = []
        for file_path in sorted(self.knowledge_dir.glob("*.md")):
            content = file_path.read_text(encoding="utf-8")
            chunks.extend(self._split_into_chunks(content, file_path.name))
        if not chunks:
            raise ValueError("No knowledge files found.")
        return chunks

    def retrieve(self, question: str, top_k: int = 5) -> List[Dict[str, Any]]:
        question_vec = self.vectorizer.transform([question])
        scores = cosine_similarity(question_vec, self.doc_matrix).flatten()
        ranked_indices = np.argsort(scores)[::-1]

        results: List[Dict[str, Any]] = []
        for idx in ranked_indices[:top_k]:
            chunk = self.chunks[idx]
            score = float(scores[idx])
            if score <= 0:
                continue
            results.append(
                {
                    "chunk_id": chunk.chunk_id,
                    "file_name": chunk.file_name,
                    "title": chunk.title,
                    "text": chunk.text,
                    "score": score,
                }
            )
        return results

    def _build_prompt(self, question: str, contexts: List[Dict[str, Any]], mode: str) -> str:
        context_text = "\n\n".join(
            f"[Source {i+1}]\nTitle: {ctx['title']}\nFile: {ctx['file_name']}\nEvidence:\n{ctx['text']}"
            for i, ctx in enumerate(contexts)
        )
        audience_line = {
            "recruiter": "Answer in recruiter-friendly language with crisp bullets and business impact where available.",
            "technical": "Answer in technically precise but concise language.",
        }.get(mode, "Answer clearly and concisely.")

        return f"""
You are a grounded portfolio assistant for Shashank Chakrawarty.

Rules you must follow:
1. Use only the evidence provided in the sources.
2. Do not invent skills, projects, timelines, tools, or numbers.
3. If the evidence is partial, say: 'Based on the available portfolio knowledge...'
4. If the answer is not supported, say: 'I do not have enough evidence in the current portfolio knowledge to answer that confidently.'
5. Never claim certainty beyond the supplied evidence.
6. Prefer concise bullets instead of long paragraphs.

{audience_line}

User question:
{question}

Evidence sources:
{context_text}
""".strip()

    def answer(self, question: str, mode: str = "recruiter") -> Dict[str, Any]:
        contexts = self.retrieve(question, top_k=5)
        if not contexts:
            return {
                "answer": "I do not have enough evidence in the current portfolio knowledge to answer that confidently.",
                "sources": [],
            }

        if not self.client:
            bullets = []
            for ctx in contexts[:3]:
                bullets.append(f"- {ctx['text']}")
            answer = "Based on the available portfolio knowledge:\n" + "\n".join(bullets)
            answer = "Based on the available portfolio knowledge:\n" + "\n".join(bullets)
            return {"answer": answer, "sources": []}

        prompt = self._build_prompt(question, contexts, mode)
        response = self.client.chat.completions.create(
            messages=[
                {"role": "user", "content": prompt},
            ],
            model="llama-3.3-70b-versatile",
            temperature=0,
        )
        answer = response.choices[0].message.content.strip()
        return {
            "answer": answer,
            "sources": [],
        }
