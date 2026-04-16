/**
 * generate-embeddings.mjs
 *
 * Reads all .md files from backend/knowledge_base, chunks them,
 * generates embeddings via HuggingFace API, and saves everything
 * to data/embeddings.json — eliminating the need for Supabase.
 *
 * Usage:
 *   node scripts/generate-embeddings.mjs
 *
 * Requires HUGGINGFACE_API_KEY in .env.local
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");

// ── Config ──────────────────────────────────────────────────────
const KNOWLEDGE_DIR = path.join(ROOT, "backend", "knowledge_base");
const OUTPUT_FILE = path.join(ROOT, "data", "embeddings.json");
const MODEL_ID = "sentence-transformers/all-MiniLM-L6-v2";
const MAX_CHUNK_LEN = 800;

// ── Load API key from .env.local ────────────────────────────────
function loadEnv() {
  const envPath = path.join(ROOT, ".env.local");
  if (!fs.existsSync(envPath)) {
    console.error("Error: .env.local not found");
    process.exit(1);
  }
  const lines = fs.readFileSync(envPath, "utf-8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim();
    process.env[key] = value;
  }
}

loadEnv();
const API_KEY = process.env.HUGGINGFACE_API_KEY;
if (!API_KEY) {
  console.error("Error: HUGGINGFACE_API_KEY not found in .env.local");
  process.exit(1);
}

// ── Helpers ─────────────────────────────────────────────────────
function normalize(text) {
  return text.replace(/\s+/g, " ").trim();
}

function getTitle(content, fileName) {
  for (const line of content.split("\n")) {
    if (line.trim().startsWith("# ")) {
      return line.trim().replace(/^# /, "").trim();
    }
  }
  return fileName.replace(/_/g, " ").replace(/\.md$/, "").replace(/\b\w/g, (c) => c.toUpperCase());
}

function chunkContent(content, fileName) {
  const title = getTitle(content, fileName);
  const blocks = content
    .split(/\n\s*\n+/)
    .map(normalize)
    .filter(Boolean);

  const chunks = [];
  let buffer = "";

  for (const block of blocks) {
    if (buffer.length + block.length <= MAX_CHUNK_LEN) {
      buffer = buffer ? buffer + "\n\n" + block : block;
    } else {
      if (buffer) chunks.push({ content: buffer, title, file_name: fileName });
      buffer = block;
    }
  }
  if (buffer) chunks.push({ content: buffer, title, file_name: fileName });
  return chunks;
}

import { HfInference } from "@huggingface/inference";

const hf = new HfInference(API_KEY);

async function getEmbedding(text) {
  const output = await hf.featureExtraction({
    model: MODEL_ID,
    inputs: text,
  });
  // Handle potential nested array from SDK
  return Array.isArray(output[0]) ? output[0] : output;
}

// ── Main ────────────────────────────────────────────────────────
async function main() {
  if (!fs.existsSync(KNOWLEDGE_DIR)) {
    console.error(`Error: Knowledge directory not found: ${KNOWLEDGE_DIR}`);
    process.exit(1);
  }

  const mdFiles = fs
    .readdirSync(KNOWLEDGE_DIR)
    .filter((f) => f.endsWith(".md"))
    .sort();

  console.log(`Found ${mdFiles.length} markdown files in knowledge_base`);

  // Chunk all files
  const allChunks = [];
  for (const file of mdFiles) {
    const content = fs.readFileSync(path.join(KNOWLEDGE_DIR, file), "utf-8");
    const chunks = chunkContent(content, file);
    allChunks.push(...chunks);
    console.log(`  ${file} → ${chunks.length} chunk(s)`);
  }

  console.log(`\nTotal chunks: ${allChunks.length}. Generating embeddings...\n`);

  // Generate embeddings
  const documents = [];
  for (let i = 0; i < allChunks.length; i++) {
    const chunk = allChunks[i];
    process.stdout.write(`  [${i + 1}/${allChunks.length}] ${chunk.file_name}...`);
    const embedding = await getEmbedding(chunk.content);
    documents.push({
      content: chunk.content,
      metadata: { title: chunk.title, file_name: chunk.file_name },
      embedding,
    });
    console.log(` ✓ (dim=${embedding.length})`);
  }

  // Save to JSON
  const outputDir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(documents, null, 2));

  console.log(`\n✅ Saved ${documents.length} embedded chunks to ${OUTPUT_FILE}`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
