import { getWatchProviders } from '../../../lib/tmdbServer';

// Batch lookup: rosters and matchup lists need providers for many movies at
// once, not one at a time like movie-details.
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const idsParam = searchParams.get('ids');

  if (!idsParam) {
    return Response.json({ providers: {} });
  }

  const ids = idsParam
    .split(',')
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isFinite(n));

  if (ids.length === 0) {
    return Response.json({ providers: {} });
  }

  try {
    const providersMap = await getWatchProviders(ids);
    return Response.json({ providers: Object.fromEntries(providersMap) });
  } catch (err) {
    return Response.json({ providers: {}, error: err.message }, { status: 500 });
  }
}
