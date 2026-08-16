'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';
import GradientRankCard, { RANK_GRADIENTS } from '../../components/GradientRankCard';
import Header from '../../components/Header';

export default function FamilySessionPage() {
  const { id } = useParams();
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [players, setPlayers] = useState([]);
  const [picks, setPicks] = useState([]);
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [votingPickId, setVotingPickId] = useState(null);
  const [selectedRating, setSelectedRating] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [revealAll, setRevealAll] = useState(false);

  const loadAll = useCallback(async () => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) {
      router.push(`/login?redirect=${encodeURIComponent(`/family/${id}`)}`);
      return;
    }
    setUser(userData.user);

    const { data: sessionData, error: sessionError } = await supabase
      .from('family_sessions')
      .select('*')
      .eq('id', id)
      .single();

    if (sessionError || !sessionData) {
      setError('Session not found.');
      setLoading(false);
      return;
    }

    const { data: playerData } = await supabase
      .from('family_players')
      .select('id, name, player_order')
      .eq('session_id', id)
      .order('player_order', { ascending: true });
    const activePlayers = playerData || [];
    setPlayers(activePlayers);

    const { data: pickData } = await supabase
      .from('family_picks')
      .select('id, player_id, tmdb_id, watched, watched_at, movies(title, poster_path, release_date)')
      .eq('session_id', id);
    const activePicks = pickData || [];
    setPicks(activePicks);

    const pickIds = activePicks.map((p) => p.id);
    const { data: ratingData } = pickIds.length
      ? await supabase.from('family_ratings').select('pick_id, player_id, rating').in('pick_id', pickIds)
      : { data: [] };
    const activeRatings = ratingData || [];
    setRatings(activeRatings);

    // Auto-transition to "complete" once every pick has a rating from every player.
    const ratingCountByPick = {};
    activeRatings.forEach((r) => {
      ratingCountByPick[r.pick_id] = (ratingCountByPick[r.pick_id] || 0) + 1;
    });
    const allRated =
      activePicks.length > 0 &&
      activePicks.every((p) => (ratingCountByPick[p.id] || 0) >= activePlayers.length);

    let finalSession = sessionData;
    if (allRated && sessionData.status !== 'complete') {
      const { data: updated } = await supabase
        .from('family_sessions')
        .update({ status: 'complete' })
        .eq('id', id)
        .select()
        .single();
      finalSession = updated || { ...sessionData, status: 'complete' };
    }
    setSession(finalSession);

    setLoading(false);
  }, [id, router]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // Safety net: if everyone's already rated the movie currently being voted
  // on (e.g. the leader navigated back into a finished round), fall back to
  // the hub instead of showing a voting screen with no one left to vote.
  useEffect(() => {
    if (!votingPickId || players.length === 0) return;
    const ratedIds = new Set(ratings.filter((r) => r.pick_id === votingPickId).map((r) => r.player_id));
    const remaining = players.filter((p) => !ratedIds.has(p.id));
    if (remaining.length === 0) {
      setVotingPickId(null);
    }
  }, [votingPickId, ratings, players]);

  async function handleMarkWatched(pickId) {
    await supabase
      .from('family_picks')
      .update({ watched: true, watched_at: new Date().toISOString() })
      .eq('id', pickId);
    setPicks((prev) => prev.map((p) => (p.id === pickId ? { ...p, watched: true } : p)));
    setVotingPickId(pickId);
    setSelectedRating(null);
  }

  async function handleSubmitRating(currentVoter, remainingCount) {
    if (!selectedRating || !currentVoter) return;
    setSubmitting(true);
    setError('');

    const { error: ratingError } = await supabase.from('family_ratings').upsert(
      { pick_id: votingPickId, player_id: currentVoter.id, rating: selectedRating },
      { onConflict: 'pick_id,player_id' }
    );

    setSubmitting(false);

    if (ratingError) {
      setError(ratingError.message);
      return;
    }

    const wasLastVoter = remainingCount <= 1;
    setSelectedRating(null);
    await loadAll();
    if (wasLastVoter) {
      setVotingPickId(null);
    }
  }

  if (loading) return <p style={{ margin: 40, color: 'var(--color-cream-text)' }}>Loading...</p>;
  if (error && !session) return <p style={{ margin: 40, color: '#e3897d' }}>{error}</p>;

  const ratingsByPick = {};
  ratings.forEach((r) => {
    (ratingsByPick[r.pick_id] ||= []).push(r);
  });

  const totalPicks = picks.length;
  const ratedCount = picks.filter((p) => (ratingsByPick[p.id]?.length || 0) >= players.length).length;

  // --- Reveal ---
  if (session.status === 'complete') {
    const averageFor = (pickId) => {
      const rows = ratingsByPick[pickId] || [];
      if (rows.length === 0) return 0;
      return rows.reduce((sum, r) => sum + r.rating, 0) / rows.length;
    };

    const ranked = [...picks]
      .map((p) => ({ ...p, avg: averageFor(p.id), player: players.find((pl) => pl.id === p.player_id) }))
      .sort((a, b) => b.avg - a.avg);

    const winner = ranked[0];

    return (
      <div>
        <Header />
        <main className="rc-page">
          <h1 className="rc-title">{session.name}</h1>
          <p className="rc-subtitle" style={{ marginBottom: 24 }}>And the winner is...</p>

          {winner && (
            <GradientRankCard label="Winner" gradient={RANK_GRADIENTS[0]}>
              <p style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 700, color: 'var(--color-ink)' }}>
                {winner.movies?.title}
              </p>
              <p style={{ margin: '0 0 4px', color: 'var(--color-ink)' }}>
                Picked by {winner.player?.name}
              </p>
              <p style={{ margin: 0, fontSize: 14, color: 'var(--color-muted)' }}>
                {winner.avg.toFixed(1)} average rating
              </p>
            </GradientRankCard>
          )}

          {!revealAll ? (
            <button onClick={() => setRevealAll(true)} className="rc-btn-primary" style={{ marginTop: 20 }}>
              See Full Ranking
            </button>
          ) : (
            <>
              <h2 className="rc-section-title">Full Ranking</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {ranked.map((p, i) => (
                  <div
                    key={p.id}
                    className="rc-card"
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  >
                    <div>
                      <p className="rc-card-title" style={{ fontSize: 16 }}>
                        {i + 1}. {p.movies?.title}
                      </p>
                      <p className="rc-card-meta">Picked by {p.player?.name}</p>
                    </div>
                    <span className="rc-stat">{p.avg.toFixed(1)} avg</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </main>
      </div>
    );
  }

  // --- Voting ---
  if (votingPickId) {
    const votingPick = picks.find((p) => p.id === votingPickId);
    const alreadyRatedIds = new Set((ratingsByPick[votingPickId] || []).map((r) => r.player_id));
    const remainingPlayers = players.filter((p) => !alreadyRatedIds.has(p.id));
    const currentVoter = remainingPlayers[0];

    if (!currentVoter) {
      // The effect above will clear votingPickId and fall back to the hub.
      return null;
    }

    return (
      <div>
        <Header />
        <main className="rc-page" style={{ maxWidth: 420, textAlign: 'center' }}>
          <p className="rc-stat" style={{ marginBottom: 8 }}>{votingPick?.movies?.title}</p>
          <h1 className="rc-title" style={{ fontSize: 30 }}>Pass to {currentVoter.name}</h1>
          <p className="rc-subtitle">Rate this movie 1–10</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, margin: '20px 0' }}>
            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                onClick={() => setSelectedRating(n)}
                className="rc-btn-secondary"
                style={{
                  padding: '14px 0',
                  fontSize: 18,
                  background: selectedRating === n ? 'var(--color-gold)' : 'transparent',
                  color: selectedRating === n ? 'var(--color-ink)' : 'var(--color-gold-bright)',
                }}
              >
                {n}
              </button>
            ))}
          </div>

          {error && <p className="rc-error">{error}</p>}

          <button
            onClick={() => handleSubmitRating(currentVoter, remainingPlayers.length)}
            disabled={!selectedRating || submitting}
            className="rc-btn-primary"
            style={{ width: '100%' }}
          >
            {submitting ? 'Submitting...' : 'Submit & Next'}
          </button>

          <p className="rc-stat" style={{ marginTop: 20 }}>
            {ratedCount} of {totalPicks} movies rated
          </p>
        </main>
      </div>
    );
  }

  // --- Hub ---
  return (
    <div>
      <Header />
      <main className="rc-page">
        <h1 className="rc-title">{session.name}</h1>
        <p
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 28,
            fontWeight: 700,
            letterSpacing: '0.5px',
            color: 'var(--color-gold)',
            margin: '0 0 24px',
          }}
        >
          {ratedCount} of {totalPicks} movies rated
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {picks.map((pick) => {
            const player = players.find((p) => p.id === pick.player_id);
            const ratedByCount = ratingsByPick[pick.id]?.length || 0;
            const isFullyRated = ratedByCount >= players.length && players.length > 0;

            return (
              <div
                key={pick.id}
                className="rc-card"
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <div>
                  <p className="rc-card-title">{pick.movies?.title}</p>
                  <p className="rc-card-meta" style={{ fontWeight: 700, color: 'var(--color-marquee-red)' }}>
                    Picked by {player?.name}
                  </p>
                </div>
                {isFullyRated ? (
                  <span className="rc-stat">Rated ✓</span>
                ) : pick.watched ? (
                  <button
                    onClick={() => {
                      setVotingPickId(pick.id);
                      setSelectedRating(null);
                    }}
                    className="rc-btn-primary"
                  >
                    Continue Rating
                  </button>
                ) : (
                  <button onClick={() => handleMarkWatched(pick.id)} className="rc-btn-primary">
                    Watched — Rate It
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
