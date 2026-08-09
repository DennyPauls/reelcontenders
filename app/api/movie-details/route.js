// Fetches full movie details (including box office revenue) at the moment
// a pick is made, so we have real data to score it with later.
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

    return Response.json({
      tmdbId: m.id,
      title: m.title,
      releaseDate: m.release_date || null,
      posterPath: m.poster_path || null,
      revenue: m.revenue || 0,
      tmdbScore: m.vote_average || 0,
    });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
