const { createClient } = require('@supabase/supabase-js');
const OpenAI = require('openai');
const Anthropic = require('@anthropic-ai/sdk');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function askQuestion(question) {
  // 1. Embed the question
  const embeddingResponse = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: question,
  });
  const questionEmbedding = embeddingResponse.data[0].embedding;

  // 2. Find matching chunks in Supabase
  const { data: matches, error } = await supabase.rpc('match_documents', {
    query_embedding: questionEmbedding,
    match_threshold: 0.5,
    match_count: 3,
  });

  if (error) {
    console.error('Match error:', error);
    return;
  }

  if (!matches || matches.length === 0) {
    console.log('No relevant content found.');
    return;
  }

  const context = matches.map((m) => m.content).join('\n\n');

  // 3. Ask Claude, giving it the retrieved context
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

  console.log('\nAnswer:', response.content[0].text);
}

// Test question — replace with something relevant to your ingested content
askQuestion('Who is Steve Jobs and what did he create?').then(() => process.exit());