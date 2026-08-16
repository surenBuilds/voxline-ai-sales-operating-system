// Safety-net filter: rejects companies that are very likely actually
// Azerbaijani or Turkish, regardless of what the geographic search query
// returned for an "Armenia" search.
//
// Why this exists: a bounding-box or even an administrative-boundary query
// against a public, community-edited dataset (OpenStreetMap) can still
// leak neighboring-country entities near a border, or the border relation
// itself can have gaps/errors. Armenia's borders with Azerbaijan and
// Turkey are politically sensitive (closed borders / active conflict
// history), so this system treats accidentally contacting a business
// there as a hard failure to prevent — independent of (and in addition
// to) the geographic query logic. Georgia and Iran are NOT filtered here:
// Armenia has normal open relations with both, and they are legitimate
// expansion markets in their own right (see AUTO_DISCOVERY_REGIONS).
//
// This is intentionally conservative: it's fine to occasionally skip a
// legitimate Armenian business with an ambiguous name (it just stays
// unprocessed, no harm done); it is NOT fine to contact a business in
// Azerbaijan or Turkey.

// Azerbaijani Latin alphabet uses a letter essentially unique to it in
// this region: ə (U+0259/U+018F) — a strong, low-false-positive signal.
const AZERBAIJANI_LETTER = /[əƏ]/;

// Word-level signals for Azerbaijani and Turkish that don't rely on
// special characters (names are sometimes transliterated without them).
const AZERBAIJANI_WORDS = /\b(kənd|kend|saylı|sayli|məktəb|mektebi?|filiali?|respublika)\b/i;
const TURKISH_WORDS = /\b(ilkokulu|ortaokulu|lisesi|anadolu|caddesi|sokak|mahallesi|belediyesi)\b/i;

// Country-code TLDs that are a near-certain signal on their own.
const FOREIGN_TLDS = ['.az', '.tr'];

export function looksNonArmenian(company: { name?: string; website?: string; email?: string; description?: string }): boolean {
  const fields = [company.name, company.description].filter(Boolean).join(' ');

  if (AZERBAIJANI_LETTER.test(fields)) return true;
  if (AZERBAIJANI_WORDS.test(fields)) return true;
  if (TURKISH_WORDS.test(fields)) return true;

  for (const val of [company.website, company.email]) {
    if (!val) continue;
    const lower = val.toLowerCase();
    if (FOREIGN_TLDS.some((tld) => lower.includes(tld))) return true;
  }

  return false;
}
