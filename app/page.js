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
    <div>
      <header className="rc-header">
        <span className="rc-brand">🎬 ReelContenders</span>
      </header>
      <div className="rc-sprockets" />

      <main className="rc-page">
        <h1 className="rc-title">Now Drafting</h1>
        <p className="rc-subtitle">A fantasy league for movies that already exist.</p>

        <div style={{ display: 'flex', gap: 12, margin: '20px 0 8px' }}>
          <a href="/signup" className="rc-btn-primary">Sign Up</a>
          <a href="/login" className="rc-btn-secondary">Log In</a>
        </div>

        <h2 className="rc-section-title">System Check</h2>

        {loading && <p className="rc-stat">Checking connections...</p>}

        {status && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
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
              <div className="rc-card">
                <p className="rc-card-title">Sample pull from TMDB</p>
                <p className="rc-card-meta">
                  {status.tmdb.sampleMovie.title} ({status.tmdb.sampleMovie.releaseDate}) — rating{' '}
                  {status.tmdb.sampleMovie.rating}/10
                </p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function StatusCard({ title, connected, message }) {
  return (
    <div
      className="rc-card"
      style={{ borderLeftColor: connected ? '#3f6b3a' : '#7a1f2b' }}
    >
      <p className="rc-card-title">
        {connected ? '✅' : '❌'} {title}
      </p>
      <p className="rc-card-meta">{message}</p>
    </div>
  );
}
