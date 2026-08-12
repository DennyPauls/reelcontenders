'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';

export default function Header() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data?.user || null);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  }

  return (
    <>
      <header className="rc-header" style={{ position: 'relative', overflow: 'hidden' }}>
        {/* textured background: ghosted theater-seat backs + gradient, sits behind everything */}
        <svg
          width="100%"
          height="100%"
          preserveAspectRatio="none"
          viewBox="0 0 700 70"
          style={{ position: 'absolute', inset: 0, zIndex: 0 }}
        >
          <defs>
            <linearGradient id="rc-header-bg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-marquee-red)" stopOpacity="0.35" />
              <stop offset="100%" stopColor="var(--color-ink)" stopOpacity="1" />
            </linearGradient>
          </defs>
          <rect width="700" height="70" fill="url(#rc-header-bg)" />
          <g opacity="0.5">
            <g id="rc-seat">
              <path
                d="M2,26 L2,16 Q2,4 16,4 Q30,4 30,16 L30,26 Z"
                fill="var(--color-marquee-red)"
                stroke="var(--color-cream-text)"
                strokeWidth="1.2"
              />
            </g>
            {Array.from({ length: 23 }).map((_, i) => (
              <use key={i} href="#rc-seat" x={i * 32} />
            ))}
          </g>
          <rect y="26" width="700" height="44" fill="var(--color-ink)" />
          <rect width="700" height="70" fill="var(--color-ink)" opacity="0.35" />
        </svg>

        <div
          style={{
            position: 'relative',
            zIndex: 1,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            width: '100%',
          }}
        >
          <a
            href="/"
            className="rc-brand"
            style={{ display: 'flex', alignItems: 'center', gap: 10 }}
          >
            <svg width="28" height="27" viewBox="0 0 28 27">
              <rect x="0" y="7" width="28" height="20" rx="2" fill="var(--color-cream-text)" stroke="var(--color-ink)" strokeWidth="1" />
              <line x1="0" y1="13" x2="28" y2="13" stroke="var(--color-ink)" strokeWidth="2" />
              <line x1="4" y1="7" x2="8" y2="13" stroke="var(--color-ink)" strokeWidth="2" />
              <line x1="12" y1="7" x2="16" y2="13" stroke="var(--color-ink)" strokeWidth="2" />
              <line x1="20" y1="7" x2="24" y2="13" stroke="var(--color-ink)" strokeWidth="2" />
              <polygon points="0,0 28,0 28,7 0,9" fill="var(--color-ink)" />
              <line x1="4" y1="0" x2="9" y2="7" stroke="var(--color-cream-text)" strokeWidth="2" />
              <line x1="12" y1="0" x2="17" y2="7" stroke="var(--color-cream-text)" strokeWidth="2" />
              <line x1="20" y1="0" x2="25" y2="7" stroke="var(--color-cream-text)" strokeWidth="2" />
            </svg>
            REELCONTENDERS
          </a>

          {!loading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              {user ? (
                <>
                  <span className="rc-stat">
                    {user.user_metadata?.display_name || user.email}
                  </span>
                  <button onClick={handleLogout} className="rc-btn-secondary">Log Out</button>
                </>
              ) : (
                <>
                  <a href="/login" className="rc-btn-secondary">Log In</a>
                  <a href="/signup" className="rc-btn-primary">Sign Up</a>
                </>
              )}
            </div>
          )}
        </div>
      </header>
      <div className="rc-sprockets" />
    </>
  );
}
