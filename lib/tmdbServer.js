import { supabaseAdmin } from './supabaseAdmin';

// TMDB's certification data lives on a separate endpoint from both
// /search/movie and /movie/{id}, so it always needs its own request.
async function fetchCertification(tmdbId) {
  const res = await fetch(
    `https://api.themoviedb.org/3/movie/${tmdbId}/release_dates?api_key=${process.env.TMDB_API_KEY}`
  );
  if (!res.ok) return 'NR';

  const data = await res.json();
  const us = (data.results || []).find((r) => r.iso_3166_1 === 'US');
  const cert = us?.release_dates?.find((rd) => rd.certification)?.certification;
  return cert || 'NR';
}

// Resolves content_rating for a batch of TMDB movies, reading the movies
// table cache first and only calling TMDB's release_dates endpoint for ids
// we haven't looked up before. Newly-looked-up ratings are cached back to
// the movies table so the next search/pick for the same movie is free.
//
// movies: array of { id, title, releaseDate, posterPath } (TMDB search/details shape)
// returns: Map<tmdbId, contentRating>
export async function getContentRatings(movies) {
  const ids = movies.map((m) => m.id);
  if (ids.length === 0) return new Map();

  const { data: cachedRows } = await supabaseAdmin
    .from('movies')
    .select('tmdb_id, content_rating')
    .in('tmdb_id', ids);

  const ratings = new Map();
  const cachedIds = new Set();
  for (const row of cachedRows || []) {
    if (row.content_rating) {
      ratings.set(row.tmdb_id, row.content_rating);
      cachedIds.add(row.tmdb_id);
    }
  }

  const uncached = movies.filter((m) => !cachedIds.has(m.id));
  if (uncached.length === 0) return ratings;

  const fetched = await Promise.all(
    uncached.map(async (m) => ({ movie: m, rating: await fetchCertification(m.id) }))
  );

  for (const { movie, rating } of fetched) {
    ratings.set(movie.id, rating);
  }

  // Best-effort cache write. Deliberately omits revenue/tmdb_score so we
  // never clobber values set at pick time for movies already in the table —
  // Postgres leaves omitted columns untouched on upsert conflict.
  try {
    await supabaseAdmin.from('movies').upsert(
      fetched.map(({ movie, rating }) => ({
        tmdb_id: movie.id,
        title: movie.title,
        release_date: movie.releaseDate || null,
        poster_path: movie.posterPath || null,
        content_rating: rating,
      })),
      { onConflict: 'tmdb_id' }
    );
  } catch (err) {
    console.error('Failed to cache content ratings:', err.message);
  }

  return ratings;
}

const WATCH_PROVIDERS_TTL_MS = 24 * 60 * 60 * 1000;

async function fetchWatchProviders(tmdbId) {
  const res = await fetch(
    `https://api.themoviedb.org/3/movie/${tmdbId}/watch/providers?api_key=${process.env.TMDB_API_KEY}`
  );
  if (!res.ok) return null;

  const data = await res.json();
  const us = data.results?.US;
  if (!us) return null;

  const mapProvider = (p) => ({ providerId: p.provider_id, name: p.provider_name, logoPath: p.logo_path });
  return {
    link: us.link || null,
    flatrate: (us.flatrate || []).map(mapProvider),
    rent: (us.rent || []).map(mapProvider),
    buy: (us.buy || []).map(mapProvider),
  };
}

// Resolves US watch-provider availability for a batch of tmdb ids, reading
// the movies table cache first. Unlike content_rating (permanent), streaming
// availability changes over time, so cached entries older than 24h are
// treated as stale and re-fetched.
//
// tmdbIds: array of tmdb movie ids
// returns: Map<tmdbId, providers | null>
export async function getWatchProviders(tmdbIds) {
  const ids = [...new Set(tmdbIds)].filter(Boolean);
  if (ids.length === 0) return new Map();

  const { data: cachedRows } = await supabaseAdmin
    .from('movies')
    .select('tmdb_id, watch_providers, watch_providers_cached_at')
    .in('tmdb_id', ids);

  const providers = new Map();
  const freshIds = new Set();
  const now = Date.now();
  for (const row of cachedRows || []) {
    const cachedAt = row.watch_providers_cached_at ? new Date(row.watch_providers_cached_at).getTime() : 0;
    if (row.watch_providers_cached_at && now - cachedAt < WATCH_PROVIDERS_TTL_MS) {
      providers.set(row.tmdb_id, row.watch_providers);
      freshIds.add(row.tmdb_id);
    }
  }

  const stale = ids.filter((id) => !freshIds.has(id));
  if (stale.length === 0) return providers;

  const fetched = await Promise.all(
    stale.map(async (id) => ({ id, data: await fetchWatchProviders(id) }))
  );

  for (const { id, data } of fetched) {
    providers.set(id, data);
  }

  try {
    await supabaseAdmin.from('movies').upsert(
      fetched.map(({ id, data }) => ({
        tmdb_id: id,
        watch_providers: data,
        watch_providers_cached_at: new Date().toISOString(),
      })),
      { onConflict: 'tmdb_id' }
    );
  } catch (err) {
    console.error('Failed to cache watch providers:', err.message);
  }

  return providers;
}
