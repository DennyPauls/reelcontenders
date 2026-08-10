'use client';

import { useEffect, useState } from 'react';
import Header from '../components/Header';

export default function Status() {
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
      <Header />
      <main className="rc-page">
        <h1 className="rc-title">System Status</h1>
        <p className="rc-subtitle">Internal check — confirming the database and movie data source are connected.</p>

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
    <div className="rc-card" style={{ borderLeftColor: connected ? '#3f6b3a' : '#7a1f2b' }}>
      <p className="rc-card-title">
        {connected ? '✅' : '❌'} {title}
      </p>
      <p className="rc-card-meta">{message}</p>
    </div>
  );
}
