import os
import re
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client, Client
import requests

# Load environment variables
BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
HUGGINGFACE_API_KEY = os.getenv("HUGGINGFACE_API_KEY")
KNOWLEDGE_DIR = Path(os.getenv("RAG_KNOWLEDGE_DIR", "knowledge_base"))

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env")
    exit(1)

if not HUGGINGFACE_API_KEY:
    print("Error: HUGGINGFACE_API_KEY must be set in .env")
    exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
MODEL_ID = "sentence-transformers/all-MiniLM-L6-v2"

def get_embedding(text: str) -> list[float]:
    api_url = f"https://api-inference.huggingface.co/pipeline/feature-extraction/{MODEL_ID}"
    headers = {"Authorization": f"Bearer {HUGGINGFACE_API_KEY}"}
    response = requests.post(api_url, headers=headers, json={"inputs": text, "options": {"wait_for_model": True}})
    if response.status_code != 200:
        raise Exception(f"Hugging Face API Error: {response.text}")
    return response.json()

def normalize_text(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()

def get_title(content: str, file_name: str) -> str:
    for line in content.splitlines():
        if line.strip().startswith("# "):
            return line.strip().removeprefix("# ").strip()
    return file_name.replace("_", " ").replace(".md", "").title()

def chunk_content(content: str, file_name: str, max_len: int = 800) -> list[dict]:
    title = get_title(content, file_name)
    blocks = [normalize_text(b) for b in re.split(r"\n\s*\n+", content) if b.strip()]
    chunks = []
    buffer = ""
    for block in blocks:
        if len(buffer) + len(block) <= max_len:
            buffer = (buffer + "\n\n" + block).strip()
        else:
            if buffer:
                chunks.append({"content": buffer, "title": title, "file_name": file_name})
            buffer = block
    if buffer:
        chunks.append({"content": buffer, "title": title, "file_name": file_name})
    return chunks

def main():
    if not KNOWLEDGE_DIR.exists():
        print(f"Error: Knowledge directory {KNOWLEDGE_DIR} not found")
        return

    print(f"Syncing knowledge base from {KNOWLEDGE_DIR} to Supabase...")
    
    # Optional: Clear existing documents
    # supabase.table("portfolio_documents").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()

    all_chunks = []
    for md_file in KNOWLEDGE_DIR.glob("*.md"):
        print(f"Processing {md_file.name}...")
        content = md_file.read_text(encoding="utf-8")
        all_chunks.extend(chunk_content(content, md_file.name))

    print(f"Generated {len(all_chunks)} chunks. Embedding and uploading...")
    
    for chunk in all_chunks:
        print(f"Embedding chunk from {chunk['file_name']}...")
        embedding = get_embedding(chunk["content"])
        data = {
            "content": chunk["content"],
            "metadata": {
                "title": chunk["title"],
                "file_name": chunk["file_name"]
            },
            "embedding": embedding
        }
        res = supabase.table("portfolio_documents").insert(data).execute()
        if hasattr(res, 'error') and res.error:
            print(f"Error inserting chunk: {res.error}")
        else:
            print(f"Uploaded chunk from {chunk['file_name']}")

    print("Sync complete!")

if __name__ == "__main__":
    main()
