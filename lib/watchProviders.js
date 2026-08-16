// Pure formatting helper — safe to import from client or server code.
// providers shape (cached in movies.watch_providers): { link, flatrate, rent, buy }
// where each of flatrate/rent/buy is an array of { providerId, name, logoPath }.
//
// Prefers subscription (flatrate) availability since it's most actionable,
// falling back to rent then buy. Returns null when nothing is available.
const MAX_PROVIDERS_SHOWN = 2;

export function summarizeProviders(providers) {
  if (!providers) return null;

  const pick = (list, label) => (list && list.length > 0 ? { label, list } : null);
  const match =
    pick(providers.flatrate, 'Stream on') ||
    pick(providers.rent, 'Rent on') ||
    pick(providers.buy, 'Buy on');
  if (!match) return null;

  const names = match.list.map((p) => p.name);
  const shown = names.slice(0, MAX_PROVIDERS_SHOWN);
  const moreCount = names.length - shown.length;
  const text = `${match.label} ${shown.join(', ')}${moreCount > 0 ? ` +${moreCount} more` : ''}`;

  return { label: match.label, names: shown, moreCount, text, link: providers.link || null };
}
