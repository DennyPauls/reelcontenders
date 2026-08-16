'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';
import Header from '../components/Header';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [leagues, setLeagues] = useState([]);
  const [familySessions, setFamilySessions] = useState([]);
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

      const { data: sessions } = await supabase
        .from('family_sessions')
        .select('id, name, status, weeks')
        .eq('created_by', data.user.id)
        .order('created_at', { ascending: false });

      setFamilySessions(sessions || []);
      setLoading(false);
    }
    load();
  }, [router]);

  if (loading) return <p style={{ margin: 40, color: 'var(--color-cream-text)' }}>Loading...</p>;

  return (
    <div>
      <Header />

      <main className="rc-page">
        <a href="/leagues/create" className="rc-btn-primary" style={{ marginBottom: 32, display: 'inline-block' }}>
          + Start Something New
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

        <h2 className="rc-section-title">Family Feature Sessions</h2>
        {familySessions.length === 0 && (
          <p className="rc-subtitle">
            No family sessions yet. Start one above — no accounts needed for anyone but you.
          </p>
        )}
        {familySessions.map((session) => (
          <a key={session.id} href={`/family/${session.id}`} style={{ textDecoration: 'none' }}>
            <div className="rc-card">
              <p className="rc-card-title">{session.name}</p>
              <p className="rc-card-meta">{session.weeks}-week timeframe · {session.status}</p>
            </div>
          </a>
        ))}
      </main>
    </div>
  );
}
