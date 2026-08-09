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
      <p style={{ color: '#666', marginTop: 0 }}>System check — confirming everything is wired up correctly.</p>

      {loading && <p>Checking connections...</p>}

      {status && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 24 }}>
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
