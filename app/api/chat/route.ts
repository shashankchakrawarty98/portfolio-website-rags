import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { Groq } from 'groq-sdk';

export async function POST(req: NextRequest) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.error("GROQ_API_KEY is missing");
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  }

  const groq = new Groq({ apiKey });

  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'user', content: prompt },
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0,
    });

    const answer = completion.choices[0]?.message?.content || '';

    return NextResponse.json({ answer });
  } catch (error: any) {
    console.error('Groq API Error:', error);
    return NextResponse.json({ error: 'Failed to generate response' }, { status: 500 });
  }
}
