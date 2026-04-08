"use client";

import { useState } from "react";
import { Bot, Loader2, Search, ShieldCheck } from "lucide-react";
import { supabase } from "@/lib/supabase";

const SUGGESTED_QUESTIONS = [
  "What kind of data engineer is Shashank?",
  "Does he have Snowflake and dbt experience?",
  "Has he worked with Azure Databricks and Spark?",
  "What AWS services has he used?",
  "Has he worked on real-time or CDC pipelines?",
  "Why is he a fit for a Senior Data Engineer role?",
  "Summarize his BigQuery and Airflow experience.",
];

// Internal API route
const embedApiBase = "/api/embed";

export default function RecruiterAssistant() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function ask(prefill?: string) {
    const finalQuestion = (prefill ?? question).trim();
    if (!finalQuestion) return;

    setQuestion(finalQuestion);
    setLoading(true);
    setError("");
    setAnswer("");

    try {
      // 1. Get embedding from backend
      const embedRes = await fetch(embedApiBase, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: finalQuestion }),
      });

      if (!embedRes.ok) {
        let errorMsg = "Failed to generate search vector.";
        try {
          const errorData = await embedRes.json();
          errorMsg = errorData.error || errorMsg;
          console.error("Server Error Detail:", errorData);
        } catch {
          const textError = await embedRes.text();
          console.error("Raw Server Error:", textError);
          if (textError.includes("FUNCTION_INVOCATION_TIMEOUT")) {
            errorMsg = "Request timed out (Hugging Face is waking up). Please try again in 10 seconds.";
          }
        }
        throw new Error(errorMsg);
      }
      const { embedding } = await embedRes.json();

      // 2. Search Supabase
      if (!supabase) {
        throw new Error("Supabase client not initialized. Check your environment variables.");
      }

      const { data: documents, error: supabaseError } = await supabase.rpc("match_documents", {
        query_embedding: embedding,
        match_threshold: 0.3,
        match_count: 5,
      });

      if (supabaseError) throw new Error(supabaseError.message);
      if (!documents || documents.length === 0) {
        setAnswer("I do not have enough evidence in the current portfolio knowledge to answer that confidently.");
        return;
      }

      // 3. Build prompt
      const contextText = documents
        .map((doc: any, i: number) => `[Source ${i + 1}]\nTitle: ${doc.metadata?.title}\nEvidence:\n${doc.content}`)
        .join("\n\n");

      const prompt = `
You are a grounded portfolio assistant for Shashank Chakrawarty.

Rules you must follow:
1. Use only the evidence provided in the sources.
2. Do not invent skills, projects, timelines, tools, or numbers.
3. If the answer is not supported, say: 'I do not have enough evidence in the current portfolio knowledge to answer that confidently.'
4. Prefer concise bullets instead of long paragraphs.

User question:
${finalQuestion}

Evidence sources:
${contextText}
`.trim();

      // 4. Call Groq (via Next.js API route)
      const chatRes = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      if (!chatRes.ok) throw new Error("Failed to generate response.");
      const { answer: finalAnswer } = await chatRes.json();
      setAnswer(finalAnswer);

    } catch (err: any) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setAnswer("");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="scroll-mt-24" id="recruiter-ai">
      <div className="rounded-3xl border border-cyan-500/20 bg-slate-900/50 p-6 md:p-8 backdrop-blur-sm shadow-[0_0_40px_rgba(6,182,212,0.08)]">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-2xl font-semibold text-white flex items-center gap-2">
              <Bot className="w-6 h-6 text-cyan-400" /> Recruiter AI Assistant
            </h3>
            <p className="mt-2 text-sm md:text-base text-slate-300 max-w-3xl leading-relaxed">
              Ask about experience, projects, cloud stack, business impact, or role fit. Responses are grounded only in curated portfolio knowledge and return sources for verification.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-300">
            <ShieldCheck className="w-4 h-4" /> Evidence-based answers
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {SUGGESTED_QUESTIONS.map((item) => (
            <button
              key={item}
              onClick={() => ask(item)}
              className="rounded-full border border-slate-700 bg-slate-800/70 px-3 py-1.5 text-sm text-slate-200 hover:border-cyan-500/40 hover:text-cyan-300 transition-colors"
            >
              {item}
            </button>
          ))}
        </div>

        <div className="mt-6 flex flex-col gap-3 md:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && ask()}
              placeholder="Type a recruiter question..."
              className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 py-3 pl-11 pr-4 text-sm text-white outline-none transition-colors placeholder:text-slate-500 focus:border-cyan-500/50"
            />
          </div>
          <button
            onClick={() => ask()}
            disabled={loading}
            className="rounded-2xl bg-cyan-600 px-5 py-3 text-sm font-medium text-white transition-all hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Thinking
              </span>
            ) : (
              "Ask"
            )}
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {error}
          </div>
        )}

        {answer && (
          <div className="mt-6">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
              <div className="text-xs uppercase tracking-[0.24em] text-cyan-400">Answer</div>
              <div className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-200">{answer}</div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
