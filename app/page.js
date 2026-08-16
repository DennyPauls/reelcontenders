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

function IconFamily() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-marquee-red)" strokeWidth="1.8" style={{ verticalAlign: 'middle', marginRight: 8 }}>
      <circle cx="8" cy="8" r="3" />
      <circle cx="17" cy="9" r="2.5" />
      <path d="M2 21v-1a6 6 0 016-6h0a6 6 0 016 6v1" />
      <path d="M14 21v-1a5 5 0 015-5h0a4 4 0 013 1.3" />
    </svg>
  );
}

function IconClapper() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-marquee-red)" strokeWidth="1.8" style={{ verticalAlign: 'middle', marginRight: 8 }}>
      <path d="M3 8l1.5-4h15L21 8" />
      <rect x="3" y="8" width="18" height="12" rx="1" />
      <path d="M7 8l1-4M12 8l1-4M17 8l1-4" />
    </svg>
  );
}

function IconPhone() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-marquee-red)" strokeWidth="1.8" style={{ verticalAlign: 'middle', marginRight: 8 }}>
      <rect x="7" y="2" width="10" height="20" rx="2" />
      <path d="M11 18h2" />
    </svg>
  );
}

function IconReveal() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-marquee-red)" strokeWidth="1.8" style={{ verticalAlign: 'middle', marginRight: 8 }}>
      <path d="M12 3l2.2 4.8 5.3.5-4 3.6 1.2 5.2L12 14.9 7.3 17.1l1.2-5.2-4-3.6 5.3-.5L12 3z" />
    </svg>
  );
}

function ModeLabel({ icon, children }) {
  return (
    <p
      style={{
        fontFamily: 'var(--font-display)',
        fontSize: 18,
        letterSpacing: '0.5px',
        textTransform: 'uppercase',
        color: 'var(--color-gold-bright)',
        margin: '0 0 16px',
      }}
    >
      {icon} {children}
    </p>
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

      <main className="rc-page rc-home-page">
        <h2 className="rc-section-title" style={{ fontSize: 34, textAlign: 'center', marginBottom: 28 }}>
          How It Works
        </h2>
        <div className="rc-two-col" style={{ marginBottom: 40 }}>
          <div>
            <ModeLabel icon="🏆">The League</ModeLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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
          </div>

          <div>
            <ModeLabel icon="🍿">Family Feature</ModeLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="rc-card">
                <p className="rc-card-title"><IconFamily />Add your family</p>
                <p className="rc-card-meta">
                  Name everyone playing — just plain names, no accounts or logins needed for
                  anyone but you.
                </p>
              </div>
              <div className="rc-card">
                <p className="rc-card-title"><IconClapper />Pick their movies</p>
                <p className="rc-card-meta">
                  You search and pick one movie for each person, right from your own phone.
                </p>
              </div>
              <div className="rc-card">
                <p className="rc-card-title"><IconPhone />Watch &amp; pass the phone</p>
                <p className="rc-card-meta">
                  Whenever you watch one, mark it watched and pass the phone around — everyone
                  rates it 1–10 before you move to the next.
                </p>
              </div>
              <div className="rc-card">
                <p className="rc-card-title"><IconReveal />The reveal</p>
                <p className="rc-card-meta">
                  Once every movie&apos;s been watched and rated, see who picked the winner —
                  no scores are shown until then.
                </p>
              </div>
            </div>
          </div>
        </div>

        <h2 className="rc-section-title" style={{ fontSize: 34, textAlign: 'center', marginBottom: 28 }}>
          The Rules, Briefly
        </h2>
        <div className="rc-two-col">
          <div>
            <ModeLabel icon="🏆">The League</ModeLabel>
            <ul className="rc-list">
              <li>12-week seasons, with matchups scheduled round-robin style</li>
              <li>8 movie picks per player, drafted snake-style before the season starts</li>
              <li>Each league sets its own content rating cap — family-friendly or anything goes</li>
              <li>Rosters lock after the draft — no trades once picks are made</li>
            </ul>
          </div>

          <div>
            <ModeLabel icon="🍿">Family Feature</ModeLabel>
            <ul className="rc-list">
              <li>1–4 week timeframe, movies watched in any order</li>
              <li>One person (the leader) runs the whole session — everyone else just needs to be in the room</li>
              <li>Each session sets its own content rating cap — family-friendly or anything goes</li>
              <li>No scores or standings shown until every movie&apos;s been rated</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
