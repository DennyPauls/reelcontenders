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
    <div>
      <header className="rc-header">
        <a href="/" className="rc-brand">🎬 ReelContenders</a>
      </header>
      <div className="rc-sprockets" />

      <main className="rc-page" style={{ maxWidth: 480 }}>
        <h1 className="rc-title">Start a League</h1>
        <p className="rc-subtitle">Set the rules for your table.</p>

        <form onSubmit={handleCreate} className="rc-form">
          <label className="rc-label">
            League name
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="e.g. The Paulsen Family League"
              className="rc-input"
            />
          </label>

          <label className="rc-label">
            Content rating cap
            <select
              value={contentRatingCap}
              onChange={(e) => setContentRatingCap(e.target.value)}
              className="rc-input"
            >
              <option value="G">G and under</option>
              <option value="PG">PG and under</option>
              <option value="PG-13">PG-13 and under</option>
              <option value="R">R and under</option>
              <option value="unrated">No restriction</option>
            </select>
          </label>

          <label className="rc-label">
            Picks per player
            <input
              type="number"
              min={3}
              max={12}
              value={picksPerPlayer}
              onChange={(e) => setPicksPerPlayer(Number(e.target.value))}
              className="rc-input"
            />
          </label>

          <label className="rc-label">
            Season length (weeks)
            <input
              type="number"
              min={4}
              max={20}
              value={seasonWeeks}
              onChange={(e) => setSeasonWeeks(Number(e.target.value))}
              className="rc-input"
            />
          </label>

          {error && <p className="rc-error">{error}</p>}

          <button type="submit" disabled={loading} className="rc-btn-primary">
            {loading ? 'Creating...' : 'Create League'}
          </button>
        </form>
      </main>
    </div>
  );
}
