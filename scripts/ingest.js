const { createClient } = require('@supabase/supabase-js');
const OpenAI = require('openai');
const fs = require('fs');
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

// Read file path and source title from command-line arguments
const filePath = process.argv[2];
const sourceTitle = process.argv[3] || 'untitled';

if (!filePath) {
  console.error('Usage: node scripts/ingest.js <file-path> "<source-title>"');
  process.exit(1);
}

const text = fs.readFileSync(filePath, 'utf-8');
ingest(text, sourceTitle).then(() => console.log('Done'));