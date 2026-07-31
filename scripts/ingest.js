const { createClient } = require('@supabase/supabase-js');
const OpenAI = require('openai');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function chunkText(text, chunkSize = 500) {
  const words = text.split(' ');
  const chunks = [];
  for (let i = 0; i < words.length; i += chunkSize) {
    chunks.push(words.slice(i, i + chunkSize).join(' '));
  }
  return chunks;
}

async function ingest(text, sourceTitle) {
  const chunks = chunkText(text);

  for (const chunk of chunks) {
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: chunk,
    });
    const embedding = embeddingResponse.data[0].embedding;

    const { error } = await supabase.from('documents').insert({
      content: chunk,
      embedding,
      metadata: { source: sourceTitle },
    });

    if (error) console.error('Insert error:', error);
    else console.log('Inserted chunk from', sourceTitle);
  }
}

// Test run — replace this with a real paragraph to test
const sampleText = `Steve Jobs (1955–2011) was an American inventor and business leader who co-founded, left, and returned to Apple Inc., while also shaping the animation studio Pixar. He helped change modern technology through the creation of famous devices like the iPhone, iPod, and Macintosh computer.`;
ingest(sampleText, 'test-source').then(() => console.log('Done'));