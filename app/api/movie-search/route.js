// Runs on the server so the TMDB key stays hidden from the browser.
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');

  if (!query || query.trim().length < 2) {
    return Response.json({ results: [] });
  }

  try {
    const tmdbRes = await fetch(
      `https://api.themoviedb.org/3/search/movie?api_key=${process.env.TMDB_API_KEY}&query=${encodeURIComponent(
        query
      )}&include_adult=false`
    );
    const data = await tmdbRes.json();

    const results = (data.results || [])
      .filter((m) => m.poster_path && m.release_date) // skip junk entries with no real data
      .slice(0, 10)
      .map((m) => ({
        id: m.id,
        title: m.title,
        releaseDate: m.release_date,
        posterPath: m.poster_path,
        voteAverage: m.vote_average,
      }));

    return Response.json({ results });
  } catch (err) {
    return Response.json({ results: [], error: err.message }, { status: 500 });
  }
}
