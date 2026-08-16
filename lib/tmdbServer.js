import { supabase } from './supabaseClient';

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

  const { data: cachedRows } = await supabase
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
    await supabase.from('movies').upsert(
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
