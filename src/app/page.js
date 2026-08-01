'use client';

import { useState, useRef } from 'react';

export default function Home() {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  async function handleAsk(text) {
    const q = text || question;
    if (!q.trim()) return;
    setLoading(true);
    setAnswer('');

    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q }),
      });
      const data = await res.json();
      const answerText = data.answer || data.error || 'Something went wrong.';
      setAnswer(answerText);
      playAnswer(answerText);
    } catch (err) {
      setAnswer('Error reaching the server.');
    }

    setLoading(false);
  }

  async function playAnswer(text) {
    const res = await fetch('/api/speak', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audio.play();
  }

  async function startRecording() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorderRef.current = mediaRecorder;
    audioChunksRef.current = [];

    mediaRecorder.ondataavailable = (e) => audioChunksRef.current.push(e.data);
    mediaRecorder.onstop = async () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');

      setLoading(true);
      const res = await fetch('/api/transcribe', { method: 'POST', body: formData });
      const data = await res.json();
      setQuestion(data.text);
      handleAsk(data.text);
    };

    mediaRecorder.start();
    setRecording(true);
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  }

  return (
    <main style={{ maxWidth: 600, margin: '80px auto', padding: 20, fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: 24, marginBottom: 20 }}>Hi Simon</h1>
      <textarea
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="Ask a question..."
        rows={3}
        style={{ width: '100%', padding: 10, fontSize: 16 }}
      />
      <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
        <button
          onClick={() => handleAsk()}
          disabled={loading}
          style={{ padding: '10px 20px', fontSize: 16, cursor: 'pointer' }}
        >
          {loading ? 'Thinking...' : 'Ask'}
        </button>
        <button
          onClick={recording ? stopRecording : startRecording}
          style={{ padding: '10px 20px', fontSize: 16, cursor: 'pointer', background: recording ? '#f44' : '#eee' }}
        >
          {recording ? '⏹ Stop' : '🎤 Talk'}
        </button>
      </div>
      {answer && (
        <div style={{ marginTop: 20, padding: 15, background: '#f5f5f5', borderRadius: 8, whiteSpace: 'pre-wrap' }}>
          {answer}
        </div>
      )}
    </main>
  );
}