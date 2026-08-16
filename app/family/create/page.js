'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';
import { isRatingAllowed } from '../../../lib/contentRating';
import Header from '../../components/Header';

export default function CreateFamilySession() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [step, setStep] = useState('details'); // 'details' | 'picks'
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Details step
  const [name, setName] = useState('');
  const [contentRatingCap, setContentRatingCap] = useState('PG-13');
  const [weeks, setWeeks] = useState(2);
  const [playerNames, setPlayerNames] = useState(['', '']);

  // Picks step — leader searches and picks one movie per player, in order.
  const [session, setSession] = useState(null);
  const [players, setPlayers] = useState([]);
  const [pickIndex, setPickIndex] = useState(0);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [pickingId, setPickingId] = useState(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data?.user) {
        router.push(`/login?redirect=${encodeURIComponent('/family/create')}`);
      } else {
        setUser(data.user);
      }
    });
  }, [router]);

  useEffect(() => {
    if (step !== 'picks' || query.trim().length < 2) {
      setResults([]);
      return;
    }
    const timeout = setTimeout(async () => {
      setSearching(true);
      const res = await fetch(`/api/movie-search?query=${encodeURIComponent(query)}`);
      const data = await res.json();
      setSearching(false);
      setResults(data.results || []);
    }, 400);
    return () => clearTimeout(timeout);
  }, [query, step]);

  function updatePlayerName(i, value) {
    setPlayerNames((prev) => prev.map((n, idx) => (idx === i ? value : n)));
  }

  function addPlayerField() {
    setPlayerNames((prev) => [...prev, '']);
  }

  function removePlayerField(i) {
    setPlayerNames((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function handleCreateDetails(e) {
    e.preventDefault();
    setError('');

    const cleanedNames = playerNames.map((n) => n.trim()).filter(Boolean);
    if (cleanedNames.length < 1) {
      setError('Add at least one player.');
      return;
    }

    setLoading(true);

    const { data: sessionRow, error: sessionError } = await supabase
      .from('family_sessions')
      .insert({
        name,
        content_rating_cap: contentRatingCap,
        weeks,
        status: 'setup',
        created_by: user.id,
      })
      .select()
      .single();

    if (sessionError) {
      setError(sessionError.message);
      setLoading(false);
      return;
    }

    const playerRows = cleanedNames.map((n, i) => ({
      session_id: sessionRow.id,
      name: n,
      player_order: i,
    }));

    const { data: playerData, error: playersError } = await supabase
      .from('family_players')
      .insert(playerRows)
      .select();

    setLoading(false);

    if (playersError) {
      setError(playersError.message);
      return;
    }

    setSession(sessionRow);
    setPlayers((playerData || []).sort((a, b) => a.player_order - b.player_order));
    setStep('picks');
  }

  async function handlePickMovie(movie) {
    const currentPlayer = players[pickIndex];
    if (!currentPlayer) return;

    if (!isRatingAllowed(movie.contentRating, session.content_rating_cap)) {
      setError(`${movie.title} exceeds this session's ${session.content_rating_cap} cap.`);
      return;
    }

    setPickingId(movie.id);
    setError('');

    const detailsRes = await fetch(`/api/movie-details?id=${movie.id}`);
    const details = await detailsRes.json();

    if (details.error) {
      setError('Could not load movie details. Try again.');
      setPickingId(null);
      return;
    }

    if (!isRatingAllowed(details.contentRating, session.content_rating_cap)) {
      setError(`${details.title} exceeds this session's ${session.content_rating_cap} cap.`);
      setPickingId(null);
      return;
    }

    const { error: pickError } = await supabase.from('family_picks').insert({
      session_id: session.id,
      player_id: currentPlayer.id,
      tmdb_id: details.tmdbId,
    });

    setPickingId(null);

    if (pickError) {
      if (pickError.code === '23505') {
        setError('That movie was already picked for someone else in this session — pick another.');
      } else {
        setError(pickError.message);
      }
      return;
    }

    setQuery('');
    setResults([]);

    if (pickIndex + 1 >= players.length) {
      await supabase.from('family_sessions').update({ status: 'active' }).eq('id', session.id);
      router.push(`/family/${session.id}`);
    } else {
      setPickIndex((i) => i + 1);
    }
  }

  if (!user) return null;

  return (
    <div>
      <Header />

      <main className="rc-page" style={{ maxWidth: 480 }}>
        {step === 'details' && (
          <>
            <h1 className="rc-title">Family Feature</h1>
            <p className="rc-subtitle">Set up a movie night for the family.</p>

            <form onSubmit={handleCreateDetails} className="rc-form">
              <label className="rc-label">
                Session name
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="e.g. Paulsen Movie Nights"
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
                Timeframe (weeks)
                <input
                  type="number"
                  min={1}
                  max={4}
                  value={weeks}
                  onChange={(e) => setWeeks(Number(e.target.value))}
                  className="rc-input"
                />
              </label>

              <div>
                <p className="rc-label" style={{ marginBottom: 8 }}>
                  Players
                </p>
                {playerNames.map((n, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                    <input
                      type="text"
                      value={n}
                      onChange={(e) => updatePlayerName(i, e.target.value)}
                      placeholder={`Player ${i + 1} name`}
                      className="rc-input"
                      style={{ flex: 1 }}
                    />
                    {playerNames.length > 1 && (
                      <button type="button" onClick={() => removePlayerField(i)} className="rc-btn-secondary">
                        Remove
                      </button>
                    )}
                  </div>
                ))}
                <button type="button" onClick={addPlayerField} className="rc-btn-secondary">
                  + Add Player
                </button>
              </div>

              {error && <p className="rc-error">{error}</p>}

              <button type="submit" disabled={loading} className="rc-btn-primary">
                {loading ? 'Setting up...' : 'Continue to Movie Picks'}
              </button>
            </form>
          </>
        )}

        {step === 'picks' && players[pickIndex] && (
          <>
            <h1 className="rc-title">Pick a Movie</h1>
            <p className="rc-subtitle">
              For {players[pickIndex].name} · Player {pickIndex + 1} of {players.length}
            </p>

            <input
              type="text"
              placeholder="Search for a movie..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="rc-input"
              style={{ width: '100%', marginBottom: 12 }}
            />
            {searching && <p className="rc-stat">Searching...</p>}
            {error && <p className="rc-error" style={{ marginBottom: 8 }}>{error}</p>}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {results.map((movie) => {
                const allowed = isRatingAllowed(movie.contentRating, session.content_rating_cap);
                return (
                  <div
                    key={movie.id}
                    className="rc-card"
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: allowed ? 1 : 0.5 }}
                  >
                    <div>
                      <p className="rc-card-title">{movie.title}</p>
                      <p className="rc-card-meta">
                        {movie.releaseDate?.slice(0, 4)} · TMDB {movie.voteAverage?.toFixed(1)}/10 · {movie.contentRating}
                      </p>
                      {!allowed && (
                        <p className="rc-card-meta" style={{ color: '#e3897d' }}>
                          Exceeds session's {session.content_rating_cap} cap
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handlePickMovie(movie)}
                      disabled={!allowed || pickingId === movie.id}
                      className="rc-btn-secondary"
                      style={{ borderColor: 'var(--color-marquee-red)', color: 'var(--color-marquee-red)' }}
                    >
                      {!allowed ? 'Capped' : pickingId === movie.id ? 'Picking...' : 'Pick'}
                    </button>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
