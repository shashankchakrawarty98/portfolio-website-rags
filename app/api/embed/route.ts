import { NextRequest, NextResponse } from "next/server";
import { HfInference } from "@huggingface/inference";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const apiKey = process.env.HUGGINGFACE_API_KEY;
  
  if (!apiKey) {
    return NextResponse.json({ error: "Hugging Face API Key is missing" }, { status: 500 });
  }

  const hf = new HfInference(apiKey);
  const MODEL_ID = "sentence-transformers/all-MiniLM-L6-v2";

  try {
    const { text } = await req.json();

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    // Generate embedding using the official SDK
    const output = await hf.featureExtraction({
      model: MODEL_ID,
      inputs: text,
    });
    
    console.log("Hugging Face API Success");

    // Handle potential nested array from SDK
    const embedding = Array.isArray(output[0]) ? output[0] : output;

    return NextResponse.json({ embedding });
  } catch (error: any) {
    console.error("Hugging Face API Error:", error);
    return NextResponse.json({ 
      error: error.message,
      detail: "Hugging Face Cloud API failed. Check your API key and quota."
    }, { status: 500 });
  }
}
