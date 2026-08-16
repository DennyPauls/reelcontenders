'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '../../../../lib/supabaseClient';
import { isRatingAllowed } from '../../../../lib/contentRating';
import Header from '../../../components/Header';

export default function DraftRoom() {
  const { id } = useParams();
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [league, setLeague] = useState(null);
  const [members, setMembers] = useState([]);
  const [picks, setPicks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [pickingId, setPickingId] = useState(null);

  const loadAll = useCallback(async () => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) {
      router.push(`/login?redirect=${encodeURIComponent(`/leagues/${id}/draft`)}`);
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
      .select('user_id, joined_at, users(display_name, email)')
      .eq('league_id', id)
      .order('joined_at', { ascending: true });
    setMembers(memberData || []);

    const { data: pickData } = await supabase
      .from('draft_picks')
      .select('id, user_id, tmdb_id, pick_number, movies(title, poster_path, release_date)')
      .eq('league_id', id)
      .order('pick_number', { ascending: true });
    setPicks(pickData || []);

    setLoading(false);
  }, [id, router]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    if (query.trim().length < 2) {
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
  }, [query]);

  async function handleStartDraft() {
    const { error: updateError } = await supabase
      .from('leagues')
      .update({ status: 'drafting' })
      .eq('id', id);
    if (!updateError) {
      setLeague((prev) => ({ ...prev, status: 'drafting' }));
    }
  }

  async function handlePick(movie) {
    if (!isRatingAllowed(movie.contentRating, league.content_rating_cap)) {
      setError(`${movie.title} exceeds this league's ${league.content_rating_cap} cap.`);
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

    if (!isRatingAllowed(details.contentRating, league.content_rating_cap)) {
      setError(`${details.title} exceeds this league's ${league.content_rating_cap} cap.`);
      setPickingId(null);
      return;
    }

    const { error: upsertError } = await supabase.from('movies').upsert({
      tmdb_id: details.tmdbId,
      title: details.title,
      release_date: details.releaseDate,
      poster_path: details.posterPath,
      revenue: details.revenue,
      tmdb_score: details.tmdbScore,
      content_rating: details.contentRating,
    });

    if (upsertError) {
      setError(upsertError.message);
      setPickingId(null);
      return;
    }

    const nextPickNumber = picks.length + 1;

    const { error: pickError } = await supabase.from('draft_picks').insert({
      league_id: id,
      user_id: user.id,
      tmdb_id: details.tmdbId,
      pick_number: nextPickNumber,
    });

    setPickingId(null);

    if (pickError) {
      if (pickError.code === '23505') {
        setError('That movie was just taken by someone else — pick another.');
      } else {
        setError(pickError.message);
      }
      return;
    }

    setQuery('');
    setResults([]);

    const totalNeeded = members.length * league.picks_per_player;
    if (nextPickNumber >= totalNeeded) {
      await supabase.from('leagues').update({ status: 'active' }).eq('id', id);
    }

    loadAll();
  }

  if (loading) return <p style={{ margin: 40, color: 'var(--color-cream-text)' }}>Loading...</p>;
  if (error && !league) return <p style={{ margin: 40, color: '#e3897d' }}>{error}</p>;

  const isCreator = league.created_by === user?.id;
  const totalNeeded = members.length * league.picks_per_player;
  const draftedTmdbIds = new Set(picks.map((p) => p.tmdb_id));

  const n = members.length;
  const totalPicksMade = picks.length;
  const round = Math.floor(totalPicksMade / n);
  const posInRound = totalPicksMade % n;
  const orderIndex = round % 2 === 0 ? posInRound : n - 1 - posInRound;
  const currentTurnMember = members[orderIndex];
  const isMyTurn = currentTurnMember?.user_id === user?.id;
  const draftComplete = totalPicksMade >= totalNeeded;

  return (
    <div>
      <Header />

      <main className="rc-page">
        <h1 className="rc-title">{league.name} — Draft</h1>
        <p className="rc-stat" style={{ marginBottom: 24 }}>
          {members.length} players · {league.picks_per_player} picks each · {totalPicksMade}/{totalNeeded} picks made
        </p>

        {league.status === 'setup' && (
          <div className="rc-card">
            <p className="rc-card-title">Waiting Room</p>
            <p className="rc-card-meta" style={{ marginBottom: 12 }}>
              {members.length} joined so far. {isCreator ? 'Start whenever you\'re ready.' : 'Waiting for the commissioner to start the draft.'}
            </p>
            <ul style={{ paddingLeft: 18, marginBottom: 16 }}>
              {members.map((m) => (
                <li key={m.user_id}>{m.users?.display_name || m.users?.email}</li>
              ))}
            </ul>
            {isCreator && (
              <button onClick={handleStartDraft} className="rc-btn-primary">Start Draft</button>
            )}
          </div>
        )}

        {league.status === 'drafting' && !draftComplete && (
          <>
            <div className="rc-card" style={{ borderLeftColor: isMyTurn ? '#3f6b3a' : '#7a1f2b' }}>
              <p className="rc-card-title">
                {isMyTurn ? "It's your pick!" : `Waiting on ${currentTurnMember?.users?.display_name || currentTurnMember?.users?.email}`}
              </p>
              <p className="rc-card-meta">Round {round + 1}, pick {posInRound + 1}</p>
            </div>

            {isMyTurn && (
              <div style={{ margin: '20px 0' }}>
                <input
                  type="text"
                  placeholder="Search for a movie to draft..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="rc-input"
                  style={{ width: '100%' }}
                />
                {searching && <p className="rc-stat" style={{ marginTop: 8 }}>Searching...</p>}
                {error && <p className="rc-error" style={{ marginTop: 8 }}>{error}</p>}

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
                  {results.map((movie) => {
                    const taken = draftedTmdbIds.has(movie.id);
                    const allowed = isRatingAllowed(movie.contentRating, league.content_rating_cap);
                    const disabled = taken || !allowed || pickingId === movie.id;
                    return (
                      <div key={movie.id} className="rc-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: taken || !allowed ? 0.5 : 1 }}>
                        <div>
                          <p className="rc-card-title">{movie.title}</p>
                          <p className="rc-card-meta">
                            {movie.releaseDate?.slice(0, 4)} · TMDB {movie.voteAverage?.toFixed(1)}/10 · {movie.contentRating}
                          </p>
                          {!allowed && !taken && (
                            <p className="rc-card-meta" style={{ color: '#e3897d' }}>
                              Exceeds league's {league.content_rating_cap} cap
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => handlePick(movie)}
                          disabled={disabled}
                          className="rc-btn-secondary"
                          style={{ borderColor: 'var(--color-marquee-red)', color: 'var(--color-marquee-red)' }}
                        >
                          {taken ? 'Taken' : !allowed ? 'Capped' : pickingId === movie.id ? 'Drafting...' : 'Draft'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}

        {draftComplete && (
          <div className="rc-card">
            <p className="rc-card-title">🏆 Draft Complete</p>
            <p className="rc-card-meta">Rosters are locked in. Matchups come next.</p>
          </div>
        )}

        <h2 className="rc-section-title">Rosters</h2>
        {members.map((m) => (
          <div key={m.user_id} style={{ marginBottom: 20 }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: 'var(--color-gold-bright)', marginBottom: 6 }}>
              {m.users?.display_name || m.users?.email}
              {currentTurnMember?.user_id === m.user_id && league.status === 'drafting' && !draftComplete && ' — on the clock'}
            </p>
            <ul className="rc-list">
              {picks
                .filter((p) => p.user_id === m.user_id)
                .map((p) => (
                  <li key={p.id}>{p.movies?.title} ({p.movies?.release_date?.slice(0, 4)})</li>
                ))}
              {picks.filter((p) => p.user_id === m.user_id).length === 0 && (
                <li style={{ color: 'var(--color-muted)' }}>No picks yet</li>
              )}
            </ul>
          </div>
        ))}
      </main>
    </div>
  );
}
