import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

interface Document {
  content: string;
  metadata: { title: string; file_name: string };
  embedding: number[];
}

// Cosine similarity between two vectors
function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Cache the embeddings in memory after first load
let cachedDocuments: Document[] | null = null;

function loadDocuments(): Document[] {
  if (cachedDocuments) return cachedDocuments;

  const filePath = path.join(process.cwd(), "data", "embeddings.json");
  if (!fs.existsSync(filePath)) {
    throw new Error("embeddings.json not found. Run: node scripts/generate-embeddings.mjs");
  }

  const raw = fs.readFileSync(filePath, "utf-8");
  cachedDocuments = JSON.parse(raw) as Document[];
  return cachedDocuments;
}

export async function POST(req: NextRequest) {
  try {
    const { query_embedding, match_threshold = 0.3, match_count = 5 } = await req.json();

    if (!query_embedding || !Array.isArray(query_embedding)) {
      return NextResponse.json({ error: "query_embedding is required" }, { status: 400 });
    }

    const documents = loadDocuments();

    // Compute similarity for every document
    const scored = documents
      .map((doc) => ({
        content: doc.content,
        metadata: doc.metadata,
        similarity: cosineSimilarity(query_embedding, doc.embedding),
      }))
      .filter((d) => d.similarity >= match_threshold)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, match_count);

    return NextResponse.json(scored);
  } catch (error: any) {
    console.error("Search API Error:", error);
    return NextResponse.json(
      { error: error.message || "Search failed" },
      { status: 500 }
    );
  }
}
