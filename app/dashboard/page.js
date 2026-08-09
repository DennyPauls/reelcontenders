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

  if (loading) return <p style={{ margin: 40 }}>Loading...</p>;

  return (
    <main style={{ maxWidth: 600, margin: '60px auto', padding: '0 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>🎬 ReelContenders</h1>
        <button onClick={handleLogout} style={secondaryButtonStyle}>Log Out</button>
      </div>
      <p style={{ color: '#666' }}>Logged in as <strong>{user?.email}</strong></p>

      <div style={{ margin: '24px 0' }}>
        <a href="/leagues/create" style={buttonStyle}>+ Create a League</a>
      </div>

      <h2 style={{ fontSize: 18 }}>Your Leagues</h2>
      {leagues.length === 0 && (
        <p style={{ color: '#999' }}>
          You&apos;re not in any leagues yet. Create one above, or ask a friend for their invite link.
        </p>
      )}
      <ul style={{ paddingLeft: 0, listStyle: 'none' }}>
        {leagues.map((league) => (
          <li key={league.id} style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16, marginBottom: 12 }}>
            <a href={`/leagues/${league.id}`} style={{ fontWeight: 600, textDecoration: 'none', color: '#1a1a1a' }}>
              {league.name}
            </a>
            <p style={{ margin: '4px 0 0', color: '#666', fontSize: 14 }}>
              {league.content_rating_cap} and under · {league.status}
            </p>
          </li>
        ))}
      </ul>
    </main>
  );
}

const buttonStyle = {
  display: 'inline-block',
  padding: '10px 16px',
  borderRadius: 6,
  backgroundColor: '#1a1a1a',
  color: 'white',
  textDecoration: 'none',
  fontSize: 16,
};

const secondaryButtonStyle = {
  padding: '8px 14px',
  borderRadius: 6,
  border: 'none',
  backgroundColor: '#1a1a1a',
  color: 'white',
  fontSize: 14,
  cursor: 'pointer',
};
