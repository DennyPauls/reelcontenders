'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';
import Header from '../../components/Header';

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

  if (loading) return <p style={{ margin: 40, color: 'var(--color-cream-text)' }}>Loading...</p>;
  if (error && !league) return <p style={{ margin: 40, color: '#e3897d' }}>{error}</p>;

  return (
    <div>
      <Header />

      <main className="rc-page">
        <h1 className="rc-title">{league.name}</h1>
        <p className="rc-stat" style={{ marginBottom: 24 }}>
          {league.content_rating_cap} and under · {league.picks_per_player} picks per player ·{' '}
          {league.season_weeks}-week season
        </p>

        {!isMember && (
          <div style={{ margin: '20px 0' }}>
            <button onClick={handleJoin} disabled={joining} className="rc-btn-primary">
              {joining ? 'Joining...' : 'Join this League'}
            </button>
            {error && <p className="rc-error">{error}</p>}
          </div>
        )}

        {isMember && (
          <>
            <div className="rc-card">
              <p className="rc-card-title">Invite Friends</p>
              <p className="rc-card-meta" style={{ marginBottom: 12 }}>
                Share this page&apos;s link — anyone who opens it can join.
              </p>
              <button onClick={copyInviteLink} className="rc-btn-secondary" style={{ borderColor: 'var(--color-marquee-red)', color: 'var(--color-marquee-red)' }}>
                {copied ? 'Copied!' : 'Copy Invite Link'}
              </button>
            </div>

            <a href={`/leagues/${id}/draft`} className="rc-btn-primary" style={{ display: 'inline-block', marginTop: 8 }}>
              {league.status === 'setup' ? 'Go to Waiting Room' : league.status === 'drafting' ? 'Enter Draft Room' : 'View Draft Results'}
            </a>
          </>
        )}

        <h2 className="rc-section-title">Members ({members.length})</h2>
        <ul className="rc-list">
          {members.map((m) => (
            <li key={m.user_id}>
              {m.users?.display_name || m.users?.email}
              {league.created_by === m.user_id && <span className="rc-stat"> — commissioner</span>}
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
