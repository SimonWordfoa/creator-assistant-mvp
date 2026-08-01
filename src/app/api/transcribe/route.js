import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(request) {
  const formData = await request.formData();
  const audioFile = formData.get('audio');

  if (!audioFile) {
    return Response.json({ error: 'No audio provided' }, { status: 400 });
  }

  const transcription = await openai.audio.transcriptions.create({
    file: audioFile,
    model: 'whisper-1',
  });

  return Response.json({ text: transcription.text });
}