'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';

export default function CreateLeague() {
  const [name, setName] = useState('');
  const [contentRatingCap, setContentRatingCap] = useState('PG-13');
  const [picksPerPlayer, setPicksPerPlayer] = useState(8);
  const [seasonWeeks, setSeasonWeeks] = useState(12);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data?.user) {
        router.push('/login');
      } else {
        setUser(data.user);
      }
    });
  }, [router]);

  async function handleCreate(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { data: league, error: leagueError } = await supabase
      .from('leagues')
      .insert({
        name,
        content_rating_cap: contentRatingCap,
        picks_per_player: picksPerPlayer,
        season_weeks: seasonWeeks,
        status: 'setup',
        created_by: user.id,
      })
      .select()
      .single();

    if (leagueError) {
      setError(leagueError.message);
      setLoading(false);
      return;
    }

    const { error: memberError } = await supabase.from('league_members').insert({
      league_id: league.id,
      user_id: user.id,
    });

    setLoading(false);

    if (memberError) {
      setError(memberError.message);
    } else {
      router.push(`/leagues/${league.id}`);
    }
  }

  return (
    <main style={{ maxWidth: 480, margin: '60px auto', padding: '0 20px' }}>
      <h1>🎬 Create a League</h1>
      <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <label style={labelStyle}>
          League name
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="e.g. The Paulsen Family League"
            style={inputStyle}
          />
        </label>

        <label style={labelStyle}>
          Content rating cap
          <select
            value={contentRatingCap}
            onChange={(e) => setContentRatingCap(e.target.value)}
            style={inputStyle}
          >
            <option value="G">G and under</option>
            <option value="PG">PG and under</option>
            <option value="PG-13">PG-13 and under</option>
            <option value="R">R and under</option>
            <option value="unrated">No restriction</option>
          </select>
        </label>

        <label style={labelStyle}>
          Picks per player
          <input
            type="number"
            min={3}
            max={12}
            value={picksPerPlayer}
            onChange={(e) => setPicksPerPlayer(Number(e.target.value))}
            style={inputStyle}
          />
        </label>

        <label style={labelStyle}>
          Season length (weeks)
          <input
            type="number"
            min={4}
            max={20}
            value={seasonWeeks}
            onChange={(e) => setSeasonWeeks(Number(e.target.value))}
            style={inputStyle}
          />
        </label>

        {error && <p style={{ color: '#c62828' }}>{error}</p>}

        <button type="submit" disabled={loading} style={buttonStyle}>
          {loading ? 'Creating...' : 'Create League'}
        </button>
      </form>
    </main>
  );
}

const labelStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  fontWeight: 600,
  fontSize: 14,
};

const inputStyle = {
  padding: '10px 12px',
  borderRadius: 6,
  border: '1px solid #ccc',
  fontSize: 16,
  fontWeight: 400,
};

const buttonStyle = {
  padding: '10px 12px',
  borderRadius: 6,
  border: 'none',
  backgroundColor: '#1a1a1a',
  color: 'white',
  fontSize: 16,
  cursor: 'pointer',
};
