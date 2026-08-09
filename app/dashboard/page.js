'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [leagues, setLeagues] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function load() {
      const { data } = await supabase.auth.getUser();
      if (!data?.user) {
        router.push('/login');
        return;
      }
      setUser(data.user);

      const { data: memberships } = await supabase
        .from('league_members')
        .select('leagues(id, name, content_rating_cap, status)')
        .eq('user_id', data.user.id);

      setLeagues((memberships || []).map((m) => m.leagues).filter(Boolean));
      setLoading(false);
    }
    load();
  }, [router]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
  }

  if (loading) return <p style={{ margin: 40, color: 'var(--color-cream-text)' }}>Loading...</p>;

  return (
    <div>
      <header className="rc-header">
        <span className="rc-brand">🎬 ReelContenders</span>
        <button onClick={handleLogout} className="rc-btn-secondary">Log Out</button>
      </header>
      <div className="rc-sprockets" />

      <main className="rc-page">
        <p className="rc-stat" style={{ marginBottom: 24 }}>Logged in as {user?.email}</p>

        <a href="/leagues/create" className="rc-btn-primary" style={{ marginBottom: 32, display: 'inline-block' }}>
          + Create a League
        </a>

        <h2 className="rc-section-title">Your Leagues</h2>
        {leagues.length === 0 && (
          <p className="rc-subtitle">
            You&apos;re not in any leagues yet. Create one above, or ask a friend for their invite link.
          </p>
        )}
        {leagues.map((league) => (
          <a key={league.id} href={`/leagues/${league.id}`} style={{ textDecoration: 'none' }}>
            <div className="rc-card">
              <p className="rc-card-title">{league.name}</p>
              <p className="rc-card-meta">{league.content_rating_cap} and under · {league.status}</p>
            </div>
          </a>
        ))}
      </main>
    </div>
  );
}
