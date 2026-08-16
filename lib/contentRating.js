// Pure rating-comparison helpers — safe to import from client or server code.
// MPAA order, least to most restrictive. 'NR' (not rated / unknown) is treated
// as more restrictive than 'R' so it's blocked under any cap except 'unrated'.
export const RATING_ORDER = ['G', 'PG', 'PG-13', 'R'];

// contentRating: 'G' | 'PG' | 'PG-13' | 'R' | 'NR' | null (not yet looked up)
// cap: league.content_rating_cap — 'G' | 'PG' | 'PG-13' | 'R' | 'unrated'
export function isRatingAllowed(contentRating, cap) {
  if (!cap || cap === 'unrated') return true;
  const capIndex = RATING_ORDER.indexOf(cap);
  if (capIndex === -1) return true;

  const ratingIndex = RATING_ORDER.indexOf(contentRating);
  if (ratingIndex === -1) return false; // NR, unrecognized, or still null

  return ratingIndex <= capIndex;
}
