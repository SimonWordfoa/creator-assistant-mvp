'use client';

import { useState } from 'react';

export default function Home() {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleAsk() {
    if (!question.trim()) return;
    setLoading(true);
    setAnswer('');

    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      });
      const data = await res.json();
      setAnswer(data.answer || data.error || 'Something went wrong.');
    } catch (err) {
      setAnswer('Error reaching the server.');
    }

    setLoading(false);
  }

  return (
    <main style={{ maxWidth: 600, margin: '80px auto', padding: 20, fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: 24, marginBottom: 20 }}>Ask the Assistant</h1>
      <textarea
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="Ask a question..."
        rows={3}
        style={{ width: '100%', padding: 10, fontSize: 16 }}
      />
      <button
        onClick={handleAsk}
        disabled={loading}
        style={{ marginTop: 10, padding: '10px 20px', fontSize: 16, cursor: 'pointer' }}
      >
        {loading ? 'Thinking...' : 'Ask'}
      </button>
      {answer && (
        <div style={{ marginTop: 20, padding: 15, background: '#f5f5f5', borderRadius: 8, whiteSpace: 'pre-wrap' }}>
          {answer}
        </div>
      )}
    </main>
  );
}