// Real business discovery via Google Places API (Text Search + Place Details).
// Requires GOOGLE_PLACES_API_KEY with "Places API" enabled in Google Cloud Console.
// Docs: https://developers.google.com/maps/documentation/places/web-service/text-search

const TEXT_SEARCH_URL = 'https://maps.googleapis.com/maps/api/place/textsearch/json';
const DETAILS_URL = 'https://maps.googleapis.com/maps/api/place/details/json';

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Google Places HTTP ${res.status}`);
  const data = await res.json();
  if (data.status && !['OK', 'ZERO_RESULTS'].includes(data.status)) {
    throw new Error(`Google Places API error: ${data.status} ${data.error_message || ''}`);
  }
  return data;
}

async function getPlaceDetails(placeId, apiKey) {
  const params = new URLSearchParams({
    place_id: placeId,
    fields: 'name,formatted_address,formatted_phone_number,international_phone_number,website,business_status,types,user_ratings_total,rating',
    key: apiKey
  });
  const data = await fetchJson(`${DETAILS_URL}?${params.toString()}`);
  return data.result || {};
}

export async function searchCompanies(filters) {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) return [];

  const { industry = 'business', country = 'Armenia', maxResults = 10 } = filters || {};
  const query = `${industry} in ${country}`;

  const params = new URLSearchParams({ query, key: apiKey });
  const searchData = await fetchJson(`${TEXT_SEARCH_URL}?${params.toString()}`);
  const results = (searchData.results || []).slice(0, maxResults);

  const candidates = [];
  for (const place of results) {
    // Skip permanently closed businesses
    if (place.business_status && place.business_status !== 'OPERATIONAL') continue;

    let details = {};
    try {
      details = await getPlaceDetails(place.place_id, apiKey);
    } catch (err) {
      console.error('Place details error for', place.name, err.message);
    }

    const sourceUrl = `https://www.google.com/maps/place/?q=place_id:${place.place_id}`;

    candidates.push({
      name: details.name || place.name,
      website: details.website || '',
      industry: filters.industry || industry,
      location: details.formatted_address || place.formatted_address || country,
      company_size: '', // Not available from Places API — left for Research Agent to estimate
      contact_info: [
        {
          phone: details.international_phone_number || details.formatted_phone_number || '',
          email: '' // Places API does not expose email; left for Research Agent / manual enrichment
        }
      ],
      description: (details.types || place.types || []).join(', '),
      confidence: details.user_ratings_total ? Math.min(0.95, 0.5 + details.user_ratings_total / 500) : 0.6,
      source_url: sourceUrl,
      source_type: 'real_web'
    });
  }

  return candidates;
}
