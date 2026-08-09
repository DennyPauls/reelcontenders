'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';

export default function LeaguePage() {
  const { id } = useParams();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [league, setLeague] = useState(null);
  const [members, setMembers] = useState([]);
  const [isMember, setIsMember] = useState(false);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) {
        router.push(`/login?redirect=${encodeURIComponent(`/leagues/${id}`)}`);
        return;
      }
      setUser(userData.user);

      const { data: leagueData, error: leagueError } = await supabase
        .from('leagues')
        .select('*')
        .eq('id', id)
        .single();

      if (leagueError || !leagueData) {
        setError('League not found.');
        setLoading(false);
        return;
      }
      setLeague(leagueData);

      const { data: memberData } = await supabase
        .from('league_members')
        .select('user_id, users(display_name, email)')
        .eq('league_id', id);

      setMembers(memberData || []);
      setIsMember((memberData || []).some((m) => m.user_id === userData.user.id));
      setLoading(false);
    }
    load();
  }, [id, router]);

  async function handleJoin() {
    setJoining(true);
    setError('');
    const { error: joinError } = await supabase
      .from('league_members')
      .insert({ league_id: id, user_id: user.id });

    setJoining(false);

    if (joinError) {
      setError(joinError.message);
    } else {
      setIsMember(true);
      setMembers((prev) => [
        ...prev,
        { user_id: user.id, users: { display_name: user.user_metadata?.display_name, email: user.email } },
      ]);
    }
  }

  function copyInviteLink() {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) return <p style={{ margin: 40 }}>Loading...</p>;
  if (error && !league) return <p style={{ margin: 40, color: '#c62828' }}>{error}</p>;

  const isCreator = league.created_by === user?.id;

  return (
    <main style={{ maxWidth: 600, margin: '60px auto', padding: '0 20px' }}>
      <h1 style={{ marginBottom: 4 }}>🎬 {league.name}</h1>
      <p style={{ color: '#666', marginTop: 0 }}>
        {league.content_rating_cap} and under · {league.picks_per_player} picks per player ·{' '}
        {league.season_weeks}-week season
      </p>

      {!isMember && (
        <div style={{ margin: '20px 0' }}>
          <button onClick={handleJoin} disabled={joining} style={buttonStyle}>
            {joining ? 'Joining...' : 'Join this League'}
          </button>
          {error && <p style={{ color: '#c62828' }}>{error}</p>}
        </div>
      )}

      {isMember && (
        <div style={{ margin: '20px 0', padding: 16, border: '1px solid #ddd', borderRadius: 8 }}>
          <p style={{ margin: 0, fontWeight: 600 }}>Invite friends</p>
          <p style={{ margin: '4px 0 12px', color: '#666', fontSize: 14 }}>
            Share this page&apos;s link — anyone who opens it can join.
          </p>
          <button onClick={copyInviteLink} style={secondaryButtonStyle}>
            {copied ? 'Copied!' : 'Copy Invite Link'}
          </button>
        </div>
      )}

      <h2 style={{ fontSize: 18, marginTop: 32 }}>Members ({members.length})</h2>
      <ul style={{ paddingLeft: 20 }}>
        {members.map((m) => (
          <li key={m.user_id}>
            {m.users?.display_name || m.users?.email}
            {league.created_by === m.user_id && ' (commissioner)'}
          </li>
        ))}
      </ul>

      {isCreator && (
        <p style={{ color: '#999', fontSize: 14, marginTop: 24 }}>
          Draft setup comes next — once enough friends have joined, you&apos;ll be able to start the draft here.
        </p>
      )}
    </main>
  );
}

const buttonStyle = {
  padding: '10px 16px',
  borderRadius: 6,
  border: 'none',
  backgroundColor: '#1a1a1a',
  color: 'white',
  fontSize: 16,
  cursor: 'pointer',
};

const secondaryButtonStyle = {
  padding: '8px 14px',
  borderRadius: 6,
  border: '1px solid #1a1a1a',
  backgroundColor: 'white',
  color: '#1a1a1a',
  fontSize: 14,
  cursor: 'pointer',
};
