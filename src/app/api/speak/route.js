import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(request) {
  const { text } = await request.json();

  if (!text) {
    return Response.json({ error: 'No text provided' }, { status: 400 });
  }

  const mp3 = await openai.audio.speech.create({
    model: 'tts-1',
    voice: 'alloy',
    input: text,
  });

  const buffer = Buffer.from(await mp3.arrayBuffer());
  return new Response(buffer, {
    headers: { 'Content-Type': 'audio/mpeg' },
  });
}