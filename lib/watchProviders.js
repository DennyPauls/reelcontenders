// Pure formatting helper — safe to import from client or server code.
// providers shape (cached in movies.watch_providers): { link, flatrate, rent, buy }
// where each of flatrate/rent/buy is an array of { providerId, name, logoPath }.
//
// Prefers subscription (flatrate) availability since it's most actionable,
// falling back to rent then buy. Returns null when nothing is available.
export function summarizeProviders(providers) {
  if (!providers) return null;

  const flatrate = providers.flatrate || [];
  if (flatrate.length > 0) {
    return { label: 'Stream on', names: flatrate.map((p) => p.name), link: providers.link || null };
  }

  const rent = providers.rent || [];
  if (rent.length > 0) {
    return { label: 'Rent on', names: rent.map((p) => p.name), link: providers.link || null };
  }

  const buy = providers.buy || [];
  if (buy.length > 0) {
    return { label: 'Buy on', names: buy.map((p) => p.name), link: providers.link || null };
  }

  return null;
}
