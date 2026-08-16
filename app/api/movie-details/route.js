import { getContentRatings } from '../../../lib/tmdbServer';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';

// Fetches full movie details (including box office revenue) at the moment
// a pick is made, and persists them server-side so a client can never write
// fabricated revenue/score/rating values into the movies table directly.
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return Response.json({ error: 'Missing movie id' }, { status: 400 });
  }

  try {
    const tmdbRes = await fetch(
      `https://api.themoviedb.org/3/movie/${id}?api_key=${process.env.TMDB_API_KEY}`
    );
    if (!tmdbRes.ok) throw new Error(`TMDB responded with status ${tmdbRes.status}`);
    const m = await tmdbRes.json();

    const ratings = await getContentRatings([
      { id: m.id, title: m.title, releaseDate: m.release_date, posterPath: m.poster_path },
    ]);
    const contentRating = ratings.get(m.id) || 'NR';

    const { error: upsertError } = await supabaseAdmin.from('movies').upsert({
      tmdb_id: m.id,
      title: m.title,
      release_date: m.release_date || null,
      poster_path: m.poster_path || null,
      revenue: m.revenue || 0,
      tmdb_score: m.vote_average || 0,
      content_rating: contentRating,
    });
    if (upsertError) throw new Error(upsertError.message);

    return Response.json({
      tmdbId: m.id,
      title: m.title,
      releaseDate: m.release_date || null,
      posterPath: m.poster_path || null,
      revenue: m.revenue || 0,
      tmdbScore: m.vote_average || 0,
      contentRating,
    });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
