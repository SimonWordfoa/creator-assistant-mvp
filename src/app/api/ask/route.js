import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function generateQueryVariants(question) {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 300,
    messages: [
      {
        role: 'user',
        content: `Generate 3 different reworded versions of this question, each capturing a slightly different angle or phrasing. Return ONLY the 3 questions, one per line, no numbering or extra text.\n\nQuestion: ${question}`,
      },
    ],
  });
  const text = response.content[0].text;
  const variants = text.split('\n').map((q) => q.trim()).filter(Boolean);
  return [question, ...variants]; // include original + variants
}

async function searchChunks(query) {
  const embeddingResponse = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: query,
  });
  const embedding = embeddingResponse.data[0].embedding;

  const { data, error } = await supabase.rpc('match_documents', {
    query_embedding: embedding,
    match_threshold: 0.5,
    match_count: 3,
  });

  if (error) {
    console.error('Search error:', error);
    return [];
  }
  return data || [];
}

export async function POST(request) {
  const { question } = await request.json();

  if (!question) {
    return Response.json({ error: 'No question provided' }, { status: 400 });
  }

  // Generate multiple query variants
  const queryVariants = await generateQueryVariants(question);

  // Search with all variants
  const allResults = await Promise.all(queryVariants.map((q) => searchChunks(q)));

  // Flatten and deduplicate by content
  const seen = new Set();
  const combinedChunks = [];
  for (const results of allResults) {
    for (const chunk of results) {
      if (!seen.has(chunk.content)) {
        seen.add(chunk.content);
        combinedChunks.push(chunk);
      }
    }
  }

  if (combinedChunks.length === 0) {
    return Response.json({ answer: "I don't have information on that yet." });
  }

  const context = combinedChunks.map((c) => c.content).join('\n\n');

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