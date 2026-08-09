'use client';

import { useEffect, useState } from 'react';

export default function Home() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/test-connection')
      .then((res) => res.json())
      .then((data) => {
        setStatus(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <main style={{ maxWidth: 600, margin: '60px auto', padding: '0 20px' }}>
      <h1 style={{ marginBottom: 4 }}>🎬 ReelContenders</h1>
      <p style={{ color: '#666', marginTop: 0 }}>
        A fantasy league for movies that already exist.
      </p>

      <div style={{ display: 'flex', gap: 12, margin: '20px 0' }}>
        <a href="/signup" style={buttonStyle}>Sign Up</a>
        <a href="/login" style={secondaryButtonStyle}>Log In</a>
      </div>

      <hr style={{ margin: '32px 0', border: 'none', borderTop: '1px solid #eee' }} />

      <p style={{ color: '#999', fontSize: 14 }}>System check — confirming everything is wired up correctly.</p>

      {loading && <p>Checking connections...</p>}

      {status && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 16 }}>
          <StatusCard
            title="Database (Supabase)"
            connected={status.supabase.connected}
            message={status.supabase.message}
          />
          <StatusCard
            title="Movie Data (TMDB)"
            connected={status.tmdb.connected}
            message={status.tmdb.message}
          />

          {status.tmdb.sampleMovie && (
            <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16 }}>
              <p style={{ margin: 0, fontWeight: 600 }}>Sample movie pulled live from TMDB:</p>
              <p style={{ margin: '8px 0 0' }}>
                {status.tmdb.sampleMovie.title} ({status.tmdb.sampleMovie.releaseDate}) — rating{' '}
                {status.tmdb.sampleMovie.rating}/10
              </p>
            </div>
          )}
        </div>
      )}
    </main>
  );
}

function StatusCard({ title, connected, message }) {
  return (
    <div
      style={{
        border: `1px solid ${connected ? '#2e7d32' : '#c62828'}`,
        backgroundColor: connected ? '#edf7ed' : '#fdecea',
        borderRadius: 8,
        padding: 16,
      }}
    >
      <p style={{ margin: 0, fontWeight: 600 }}>
        {connected ? '✅' : '❌'} {title}
      </p>
      <p style={{ margin: '4px 0 0', color: '#333' }}>{message}</p>
    </div>
  );
}

const buttonStyle = {
  padding: '10px 20px',
  borderRadius: 6,
  backgroundColor: '#1a1a1a',
  color: 'white',
  textDecoration: 'none',
  fontSize: 16,
};

const secondaryButtonStyle = {
  padding: '10px 20px',
  borderRadius: 6,
  border: '1px solid #1a1a1a',
  color: '#1a1a1a',
  textDecoration: 'none',
  fontSize: 16,
};
