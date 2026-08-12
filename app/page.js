'use client';

import { useEffect, useState } from 'react';
import Header from './components/Header';
import { supabase } from '../lib/supabaseClient';

function IconDraft() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-marquee-red)" strokeWidth="1.8" style={{ verticalAlign: 'middle', marginRight: 8 }}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18M9 3v6" />
    </svg>
  );
}

function IconFaceOff() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-marquee-red)" strokeWidth="1.8" style={{ verticalAlign: 'middle', marginRight: 8 }}>
      <circle cx="7" cy="17" r="3" />
      <circle cx="17" cy="17" r="3" />
      <path d="M9 15L19 5M15 15L5 5" />
    </svg>
  );
}

function IconScore() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-marquee-red)" strokeWidth="1.8" style={{ verticalAlign: 'middle', marginRight: 8 }}>
      <path d="M8 21h8M12 17v4M6 4h12l-1 7a5 5 0 01-10 0L6 4z" />
      <path d="M6 6H3a3 3 0 003 3M18 6h3a3 3 0 01-3 3" />
    </svg>
  );
}

function IconWin() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-marquee-red)" strokeWidth="1.8" style={{ verticalAlign: 'middle', marginRight: 8 }}>
      <path d="M4 4l4 4M20 4l-4 4M4 4l16 16" />
      <path d="M4 20a3 3 0 013-3 3 3 0 013 3" />
    </svg>
  );
}

export default function Home() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data?.user || null));
  }, []);

  return (
    <div>
      <Header />

      {/* HERO — projector photo background */}
      <div
        style={{
          position: 'relative',
          backgroundImage: "url('/images/projector-hero.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          padding: '60px 20px',
          marginBottom: '8px',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(90deg, rgba(26,13,15,0.92) 0%, rgba(26,13,15,0.55) 55%, rgba(26,13,15,0.2) 100%)',
          }}
        />
        <div style={{ position: 'relative', maxWidth: 640, margin: '0 auto' }}>
          <h1 className="rc-title">Now Drafting</h1>
          <p className="rc-subtitle" style={{ fontSize: 18 }}>
            A fantasy league for movies that already exist. Draft the classics and favorites you love,
            face off head-to-head with friends and family, and settle once and for all whose taste in
            movies actually holds up.
          </p>

          <div style={{ display: 'flex', gap: 12, margin: '20px 0 0' }}>
            {user ? (
              <a href="/dashboard" className="rc-btn-primary">Go to Dashboard</a>
            ) : (
              <>
                <a href="/signup" className="rc-btn-primary">Get Your Ticket</a>
                <a href="/login" className="rc-btn-secondary">Log In</a>
              </>
            )}
          </div>
        </div>
      </div>

      <main className="rc-page">
        <h2 className="rc-section-title">How It Works</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
          <div className="rc-card">
            <p className="rc-card-title"><IconDraft />Draft your roster</p>
            <p className="rc-card-meta">
              Pick movies you love — any movie already released, from 1970s classics to last year&apos;s
              favorites. Once a movie&apos;s drafted, no one else in your league can take it.
            </p>
          </div>
          <div className="rc-card">
            <p className="rc-card-title"><IconFaceOff />Face off each week</p>
            <p className="rc-card-meta">
              Every week you play one movie from your roster against an opponent&apos;s pick.
              Scores stay hidden until both sides are revealed together.
            </p>
          </div>
          <div className="rc-card">
            <p className="rc-card-title"><IconScore />Scored on real data</p>
            <p className="rc-card-meta">
              Box office performance and TMDB&apos;s community score are combined with your own
              league&apos;s ratings — the people who actually watched decide as much as the numbers do.
            </p>
          </div>
          <div className="rc-card">
            <p className="rc-card-title"><IconWin />Win bragging rights</p>
            <p className="rc-card-meta">
              Best record after a full season wins the league. A separate &quot;Most Underrated
              Pick&quot; award goes to whoever&apos;s movie over-performed its reputation the most.
            </p>
          </div>
        </div>

        <h2 className="rc-section-title">The Rules, Briefly</h2>
        <ul className="rc-list">
          <li>12-week seasons, with matchups scheduled round-robin style</li>
          <li>8 movie picks per player, drafted snake-style before the season starts</li>
          <li>Each league sets its own content rating cap — family-friendly or anything goes</li>
          <li>Rosters lock after the draft — no trades once picks are made</li>
        </ul>
      </main>
    </div>
  );
}
