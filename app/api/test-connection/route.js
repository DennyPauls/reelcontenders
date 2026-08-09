import { createClient } from '@supabase/supabase-js';

// This runs on the server, so the TMDB key never reaches the browser.
export async function GET() {
  const result = {
    supabase: { connected: false, message: '' },
    tmdb: { connected: false, message: '', sampleMovie: null },
  };

  // --- Test Supabase connection ---
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    const { error } = await supabase.from('leagues').select('id').limit(1);
    if (error) throw error;
    result.supabase.connected = true;
    result.supabase.message = 'Connected to your Supabase database successfully.';
  } catch (err) {
    result.supabase.message = `Could not connect to Supabase: ${err.message}`;
  }

  // --- Test TMDB connection ---
  try {
    const tmdbRes = await fetch(
      `https://api.themoviedb.org/3/movie/popular?api_key=${process.env.TMDB_API_KEY}`
    );
    if (!tmdbRes.ok) throw new Error(`TMDB responded with status ${tmdbRes.status}`);
    const data = await tmdbRes.json();
    const first = data.results?.[0];
    result.tmdb.connected = true;
    result.tmdb.message = 'Connected to TMDB successfully.';
    result.tmdb.sampleMovie = first
      ? {
          title: first.title,
          releaseDate: first.release_date,
          rating: first.vote_average,
          posterPath: first.poster_path,
        }
      : null;
  } catch (err) {
    result.tmdb.message = `Could not connect to TMDB: ${err.message}`;
  }

  return Response.json(result);
}
