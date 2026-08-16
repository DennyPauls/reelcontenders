'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';
import Header from '../../components/Header';

export default function CreateLeague() {
  const [mode, setMode] = useState(null); // null | 'league'
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

  if (mode === null) {
    return (
      <div>
        <Header />

        <main className="rc-page" style={{ maxWidth: 560 }}>
          <h1 className="rc-title">Start Something</h1>
          <p className="rc-subtitle">Pick the format that fits your group.</p>

          <div style={{ display: 'flex', flexDirection: 'row', gap: 16 }}>
            <button
              onClick={() => setMode('league')}
              className="rc-card"
              style={{ flex: 1, minWidth: 0, textAlign: 'left', cursor: 'pointer', border: 'none', borderLeft: '4px solid var(--color-marquee-red)' }}
            >
              <p style={{ fontSize: 28, margin: '0 0 8px' }}>🏆</p>
              <p className="rc-card-title">The League</p>
              <p className="rc-card-meta">
                A full fantasy season — everyone has their own account, drafts a roster, and plays
                weekly head-to-head matchups over the season.
              </p>
            </button>

            <button
              onClick={() => router.push('/family/create')}
              className="rc-card"
              style={{ flex: 1, minWidth: 0, textAlign: 'left', cursor: 'pointer', border: 'none', borderLeft: '4px solid var(--color-gold)' }}
            >
              <p style={{ fontSize: 28, margin: '0 0 8px' }}>🍿</p>
              <p className="rc-card-title">Family Feature</p>
              <p className="rc-card-meta">
                One person runs the whole thing on their own phone — name your family, pick a movie
                for each person, then pass the phone around to rate them once you've watched.
              </p>
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div>
      <Header />

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
