import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request) {
  const { question } = await request.json();

  if (!question) {
    return Response.json({ error: 'No question provided' }, { status: 400 });
  }

  const embeddingResponse = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: question,
  });
  const questionEmbedding = embeddingResponse.data[0].embedding;

  const { data: matches, error } = await supabase.rpc('match_documents', {
    query_embedding: questionEmbedding,
    match_threshold: 0.5,
    match_count: 3,
  });

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  if (!matches || matches.length === 0) {
    return Response.json({ answer: "I don't have information on that yet." });
  }

  const context = matches.map((m) => m.content).join('\n\n');

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 500,
    messages: [
      {
        role: 'user',
        content: `Answer the question using only the context below. If the context doesn't contain the answer, say so.\n\nContext:\n${context}\n\nQuestion: ${question}`,
      },
    ],
  });

  return Response.json({ answer: response.content[0].text });
}