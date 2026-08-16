'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '../../../../lib/supabaseClient';
import { summarizeProviders } from '../../../../lib/watchProviders';
import Header from '../../../components/Header';

function scoreMovie(revenue, tmdbScore, rating) {
  const boxOffice = Math.min(40, (revenue || 0) / 10_000_000);
  const tmdbPoints = Math.min(30, (tmdbScore || 0) * 3);
  const ratingPoints = Math.min(20, (rating || 0) * 2);
  return { boxOffice, tmdbPoints, ratingPoints, total: boxOffice + tmdbPoints + ratingPoints };
}

// Standard "circle method" round-robin schedule. Returns an array of rounds,
// each an array of [indexA, indexB] pairs. -1 means a bye that round.
function generateRoundRobin(n) {
  const players = [...Array(n).keys()];
  if (n % 2 !== 0) players.push(-1);
  const total = players.length;
  const roundsCount = total - 1;
  const half = total / 2;
  let arr = [...players];
  const schedule = [];
  for (let r = 0; r < roundsCount; r++) {
    const pairs = [];
    for (let i = 0; i < half; i++) {
      pairs.push([arr[i], arr[total - 1 - i]]);
    }
    schedule.push(pairs);
    const fixed = arr[0];
    const rest = arr.slice(1);
    rest.unshift(rest.pop());
    arr = [fixed, ...rest];
  }
  return schedule;
}

export default function SeasonPage() {
  const { id } = useParams();
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [league, setLeague] = useState(null);
  const [members, setMembers] = useState([]);
  const [matchups, setMatchups] = useState([]);
  const [movieTitles, setMovieTitles] = useState({});
  const [watchProviders, setWatchProviders] = useState({});
  const [roster, setRoster] = useState([]);
  const [lockedScores, setLockedScores] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedMovie, setSelectedMovie] = useState('');
  const [rating, setRating] = useState(7);
  const [submitting, setSubmitting] = useState(false);

  const loadAll = useCallback(async () => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) {
      router.push(`/login?redirect=${encodeURIComponent(`/leagues/${id}/season`)}`);
      return;
    }
    setUser(userData.user);

    const { data: leagueData } = await supabase.from('leagues').select('*').eq('id', id).single();
    if (!leagueData) {
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
    const orderedMembers = memberData || [];
    setMembers(orderedMembers);

    // Generate the season schedule the first time anyone visits this page.
    const { data: existingRounds } = await supabase
      .from('rounds')
      .select('id')
      .eq('league_id', id)
      .limit(1);

    if ((!existingRounds || existingRounds.length === 0) && orderedMembers.length >= 2) {
      const schedule = generateRoundRobin(orderedMembers.length);
      const cycleLength = schedule.length;
      for (let week = 0; week < 12; week++) {
        const { data: roundRow } = await supabase
          .from('rounds')
          .insert({ league_id: id, round_number: week + 1 })
          .select()
          .single();

        const weekPairs = schedule[week % cycleLength];
        const matchupRows = weekPairs.map(([aIdx, bIdx]) => {
          const isBye = aIdx === -1 || bIdx === -1;
          const realIdx = aIdx === -1 ? bIdx : aIdx;
          if (isBye) {
            return {
              round_id: roundRow.id,
              player_a_id: orderedMembers[realIdx].user_id,
              player_b_id: null,
              is_bye: true,
              status: 'revealed',
            };
          }
          return {
            round_id: roundRow.id,
            player_a_id: orderedMembers[aIdx].user_id,
            player_b_id: orderedMembers[bIdx].user_id,
            is_bye: false,
            status: 'pending',
          };
        });
        await supabase.from('matchups').insert(matchupRows);
      }
    }

    const { data: matchupData } = await supabase
      .from('matchups')
      .select('*, rounds(round_number)')
      .eq('rounds.league_id', id);

    // rounds.league_id filter via embedded table needs a manual pass since PostgREST
    // filters on embedded tables only restrict the embed, not the parent — so fetch via rounds instead.
    const { data: roundsForLeague } = await supabase
      .from('rounds')
      .select('id, round_number')
      .eq('league_id', id)
      .order('round_number', { ascending: true });

    const roundIds = (roundsForLeague || []).map((r) => r.id);
    const roundNumberById = Object.fromEntries((roundsForLeague || []).map((r) => [r.id, r.round_number]));

    const { data: allMatchups } = await supabase
      .from('matchups')
      .select('*')
      .in('round_id', roundIds.length ? roundIds : ['00000000-0000-0000-0000-000000000000']);

    const withRoundNumber = (allMatchups || []).map((m) => ({ ...m, round_number: roundNumberById[m.round_id] }));
    withRoundNumber.sort((a, b) => a.round_number - b.round_number);
    setMatchups(withRoundNumber);

    // Fetch titles for any movies referenced in matchups
    const tmdbIds = new Set();
    withRoundNumber.forEach((m) => {
      if (m.player_a_tmdb_id) tmdbIds.add(m.player_a_tmdb_id);
      if (m.player_b_tmdb_id) tmdbIds.add(m.player_b_tmdb_id);
    });
    if (tmdbIds.size > 0) {
      const { data: movieRows } = await supabase
        .from('movies')
        .select('tmdb_id, title')
        .in('tmdb_id', [...tmdbIds]);
      setMovieTitles(Object.fromEntries((movieRows || []).map((mv) => [mv.tmdb_id, mv.title])));

      const wpRes = await fetch(`/api/watch-providers?ids=${[...tmdbIds].join(',')}`);
      const wpData = await wpRes.json();
      setWatchProviders(wpData.providers || {});
    }

    // This user's roster
    const { data: rosterData } = await supabase
      .from('draft_picks')
      .select('tmdb_id, movies(title, revenue, tmdb_score)')
      .eq('league_id', id)
      .eq('user_id', userData.user.id);
    setRoster(rosterData || []);

    // Locked scores for movies already played once
    const { data: lockedData } = await supabase
      .from('movie_league_scores')
      .select('tmdb_id, total_score')
      .eq('league_id', id);
    setLockedScores(Object.fromEntries((lockedData || []).map((l) => [l.tmdb_id, l.total_score])));

    setLoading(false);
  }, [id, router]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  async function handleSubmitPick(matchup, isPlayerA) {
    setSubmitting(true);
    setError('');

    const pick = roster.find((r) => r.tmdb_id === Number(selectedMovie));
    if (!pick) {
      setError('Pick a movie first.');
      setSubmitting(false);
      return;
    }

    let total = lockedScores[pick.tmdb_id];

    if (total === undefined) {
      const scored = scoreMovie(pick.movies.revenue, pick.movies.tmdb_score, rating);
      total = scored.total;
      await supabase.from('movie_league_scores').upsert({
        league_id: id,
        tmdb_id: pick.tmdb_id,
        box_office_points: scored.boxOffice,
        tmdb_score_points: scored.tmdbPoints,
        league_rating_avg: rating,
        league_rating_points: scored.ratingPoints,
        total_score: total,
        locked: true,
      });
    }

    const updateFields = isPlayerA
      ? { player_a_tmdb_id: pick.tmdb_id, player_a_score: total }
      : { player_b_tmdb_id: pick.tmdb_id, player_b_score: total };

    const otherScore = isPlayerA ? matchup.player_b_score : matchup.player_a_score;
    if (otherScore !== null && otherScore !== undefined) {
      const aScore = isPlayerA ? total : matchup.player_a_score;
      const bScore = isPlayerA ? matchup.player_b_score : total;
      updateFields.status = 'revealed';
      updateFields.winner_id =
        aScore === bScore ? null : aScore > bScore ? matchup.player_a_id : matchup.player_b_id;
    }

    await supabase.from('matchups').update(updateFields).eq('id', matchup.id);

    setSubmitting(false);
    setSelectedMovie('');
    setRating(7);
    loadAll();
  }

  if (loading) return <p style={{ margin: 40, color: 'var(--color-cream-text)' }}>Loading...</p>;
  if (error && !league) return <p style={{ margin: 40, color: '#e3897d' }}>{error}</p>;

  const nameFor = (userId) => {
    const m = members.find((mm) => mm.user_id === userId);
    return m?.users?.display_name || m?.users?.email || 'Unknown';
  };

  // Standings
  const standings = members.map((m) => {
    let wins = 0, losses = 0, totalScore = 0;
    matchups.forEach((mu) => {
      if (mu.is_bye || mu.status !== 'revealed') return;
      const isA = mu.player_a_id === m.user_id;
      const isB = mu.player_b_id === m.user_id;
      if (!isA && !isB) return;
      totalScore += isA ? (mu.player_a_score || 0) : (mu.player_b_score || 0);
      if (mu.winner_id === m.user_id) wins++;
      else if (mu.winner_id !== null) losses++;
    });
    return { ...m, wins, losses, totalScore };
  }).sort((a, b) => b.wins - a.wins || b.totalScore - a.totalScore);

  // Current week = earliest round with any non-revealed, non-bye matchup
  const activeMatchup = matchups.find((m) => !m.is_bye && m.status !== 'revealed');
  const currentRoundNumber = activeMatchup?.round_number;
  const currentRoundMatchups = matchups.filter((m) => m.round_number === currentRoundNumber);
  const seasonComplete = !activeMatchup && matchups.length > 0;

  return (
    <div>
      <Header />
      <main className="rc-page">
        <h1 className="rc-title">{league.name} — Season</h1>
        <p className="rc-stat" style={{ marginBottom: 24 }}>
          {seasonComplete ? 'Season complete' : `Week ${currentRoundNumber} of 12`}
        </p>

        <h2 className="rc-section-title">Standings</h2>
        <ul className="rc-list" style={{ marginBottom: 32 }}>
          {standings.map((s, i) => (
            <li key={s.user_id}>
              #{i + 1} {s.users?.display_name || s.users?.email} — {s.wins}-{s.losses}{' '}
              <span className="rc-stat">({s.totalScore.toFixed(1)} pts)</span>
            </li>
          ))}
        </ul>

        {!seasonComplete && (
          <>
            <h2 className="rc-section-title">This Week</h2>
            {currentRoundMatchups.map((mu) => {
              if (mu.is_bye) {
                return (
                  <div key={mu.id} className="rc-card">
                    <p className="rc-card-title">{nameFor(mu.player_a_id)} — Bye Week</p>
                  </div>
                );
              }
              const isA = mu.player_a_id === user.id;
              const isB = mu.player_b_id === user.id;
              const myScoreSet = isA ? mu.player_a_score != null : isB ? mu.player_b_score != null : true;
              const canPick = (isA || isB) && !myScoreSet;

              return (
                <div key={mu.id} className="rc-card">
                  <p className="rc-card-title">
                    {nameFor(mu.player_a_id)} vs {nameFor(mu.player_b_id)}
                  </p>
                  {mu.status === 'revealed' ? (
                    <>
                      <p className="rc-card-meta">
                        {movieTitles[mu.player_a_tmdb_id] || '—'} ({mu.player_a_score?.toFixed(1)}) vs{' '}
                        {movieTitles[mu.player_b_tmdb_id] || '—'} ({mu.player_b_score?.toFixed(1)}) —{' '}
                        {mu.winner_id ? `${nameFor(mu.winner_id)} wins` : 'Tie'}
                      </p>
                      {[mu.player_a_tmdb_id, mu.player_b_tmdb_id].map((tid) => {
                        const summary = summarizeProviders(watchProviders[tid]);
                        if (!summary) return null;
                        return (
                          <p
                            key={tid}
                            className="rc-stat"
                            style={{ fontSize: 13, color: 'var(--color-marquee-red)' }}
                          >
                            {movieTitles[tid]}: {summary.text}
                          </p>
                        );
                      })}
                    </>
                  ) : canPick ? (
                    <div style={{ marginTop: 10 }}>
                      <select
                        value={selectedMovie}
                        onChange={(e) => setSelectedMovie(e.target.value)}
                        className="rc-input"
                        style={{ marginBottom: 10, width: '100%' }}
                      >
                        <option value="">Choose a movie from your roster...</option>
                        {roster.map((r) => (
                          <option key={r.tmdb_id} value={r.tmdb_id}>
                            {r.movies?.title} {lockedScores[r.tmdb_id] !== undefined ? '(already scored)' : ''}
                          </option>
                        ))}
                      </select>
                      {selectedMovie && lockedScores[Number(selectedMovie)] === undefined && (
                        <label className="rc-label" style={{ marginBottom: 10 }}>
                          Your rating (1–10)
                          <input
                            type="number"
                            min={1}
                            max={10}
                            value={rating}
                            onChange={(e) => setRating(Number(e.target.value))}
                            className="rc-input"
                          />
                        </label>
                      )}
                      <button
                        onClick={() => handleSubmitPick(mu, isA)}
                        disabled={!selectedMovie || submitting}
                        className="rc-btn-primary"
                      >
                        {submitting ? 'Submitting...' : 'Submit Pick'}
                      </button>
                      {error && <p className="rc-error">{error}</p>}
                    </div>
                  ) : (
                    <p className="rc-card-meta">
                      {isA || isB ? 'Waiting on your opponent to submit their pick.' : 'Not your matchup this week.'}
                    </p>
                  )}
                </div>
              );
            })}
          </>
        )}

        <h2 className="rc-section-title">Past Weeks</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8 }}>
          {matchups
            .filter((m) => m.status === 'revealed' && !m.is_bye)
            .map((mu) => (
              <div
                key={mu.id}
                style={{
                  background: 'var(--color-paper)',
                  borderLeft: '3px solid var(--color-marquee-red)',
                  borderRadius: 3,
                  padding: '10px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                  <div style={{ fontSize: 12, color: '#5a5347' }}>
                    <span style={{ color: 'var(--color-marquee-red)', fontWeight: 600 }}>
                      Wk {mu.round_number}
                    </span>
                    {'  '}
                    {nameFor(mu.player_a_id)} ({movieTitles[mu.player_a_tmdb_id]}) vs{' '}
                    {nameFor(mu.player_b_id)} ({movieTitles[mu.player_b_tmdb_id]})
                  </div>
                  <div
                    style={{
                      background: 'var(--color-marquee-red)',
                      color: 'var(--color-paper)',
                      fontSize: 10,
                      fontWeight: 600,
                      padding: '4px 10px',
                      borderRadius: 20,
                      whiteSpace: 'nowrap',
                      letterSpacing: '0.03em',
                    }}
                  >
                    {mu.winner_id ? `★ ${nameFor(mu.winner_id).toUpperCase()}` : 'TIE'}
                  </div>
                </div>
                {[mu.player_a_tmdb_id, mu.player_b_tmdb_id].map((tid) => {
                  const summary = summarizeProviders(watchProviders[tid]);
                  if (!summary) return null;
                  return (
                    <p
                      key={tid}
                      className="rc-stat"
                      style={{ fontSize: 13, color: 'var(--color-marquee-red)', margin: 0 }}
                    >
                      {movieTitles[tid]}: {summary.text}
                    </p>
                  );
                })}
              </div>
            ))}
        </div>
        <p className="rc-stat" style={{ fontSize: 11, marginBottom: 24 }}>
          Streaming availability provided by{' '}
          <a href="https://www.justwatch.com/" target="_blank" rel="noreferrer">JustWatch</a>.
        </p>
      </main>
    </div>
  );
}
