import { NextRequest, NextResponse } from "next/server";
import { pipeline, env } from "@xenova/transformers";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Configuration for Vercel's read-only filesystem
env.allowLocalModels = false;
env.cacheDir = "/tmp/transformers-cache";

const MODEL_ID = "Xenova/all-MiniLM-L6-v2";

// Singleton to load the pipeline once
class EmbeddingPipeline {
  static instance: any = null;

  static async getInstance() {
    if (this.instance === null) {
      console.log("Loading embedding model...");
      this.instance = await pipeline("feature-extraction", MODEL_ID);
      console.log("Model loaded successfully.");
    }
    return this.instance;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    // Load the model and tokenizer
    const extractor = await EmbeddingPipeline.getInstance();

    // Generate embedding
    // 'pooling: mean' and 'normalize: true' match the Python SentenceTransformer behavior
    const output = await extractor(text, { pooling: "mean", normalize: true });

    // Extract the raw array from the Tensor
    const embedding = Array.from(output.data);

    return NextResponse.json({ embedding });
  } catch (error: any) {
    console.error("Embedding Error (Local):", error);
    return NextResponse.json({ 
      error: error.message,
      stack: error.stack,
      detail: "Check Vercel logs for more info"
    }, { status: 500 });
  }
}
