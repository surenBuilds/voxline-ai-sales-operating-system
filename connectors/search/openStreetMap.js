// Free business discovery via OpenStreetMap (Overpass API + Nominatim).
// No API key, no billing, no credit card required.
// Respects OSM usage policy: descriptive User-Agent, modest request volume.
// Docs: https://wiki.openstreetmap.org/wiki/Overpass_API
//       https://nominatim.org/release-docs/latest/api/Search/

// Multiple public Overpass mirrors — if one rate-limits us (429) or errors,
// try the next, so a single busy mirror doesn't stall discovery.
const OVERPASS_URLS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.openstreetmap.ru/api/interpreter'
];
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const USER_AGENT = 'VoxlineAI-BusinessDiscovery/1.0 (contact: set RESEND_FROM_EMAIL)';

// Rough mapping from free-text industry names to OSM tag values.
// OSM uses shop=*, office=*, and amenity=* namespaces for most businesses.
const INDUSTRY_TAG_MAP = {
  technology: ['office=it', 'shop=computer', 'office=coworking', 'office=software', 'shop=mobile_phone'],
  retail: ['shop=*'],
  hospitality: ['amenity=restaurant', 'amenity=cafe', 'tourism=hotel', 'amenity=fast_food', 'amenity=bar'],
  healthcare: ['amenity=clinic', 'amenity=doctors', 'amenity=dentist', 'amenity=pharmacy', 'amenity=hospital'],
  finance: ['office=financial', 'office=insurance', 'amenity=bank', 'office=accountant'],
  education: ['amenity=school', 'office=educational_institution', 'amenity=university', 'amenity=language_school'],
  manufacturing: ['man_made=works', 'landuse=industrial', 'craft=*'],
  'real estate': ['office=estate_agent']
};

function tagsForIndustry(industry) {
  const key = (industry || '').toLowerCase().trim();
  return INDUSTRY_TAG_MAP[key] || ['shop=*'];
}

// Step 1: resolve a city/country name to a bounding box via Nominatim.
async function resolveArea(location) {
  const params = new URLSearchParams({ q: location, format: 'json', limit: '1' });
  const res = await fetch(`${NOMINATIM_URL}?${params.toString()}`, {
    headers: { 'User-Agent': USER_AGENT }
  });
  if (!res.ok) throw new Error(`Nominatim HTTP ${res.status}`);
  const data = await res.json();
  if (!data.length) return null;
  const { boundingbox } = data[0]; // [south, north, west, east] as strings
  return {
    south: parseFloat(boundingbox[0]),
    north: parseFloat(boundingbox[1]),
    west: parseFloat(boundingbox[2]),
    east: parseFloat(boundingbox[3])
  };
}

// Step 2: query Overpass for businesses matching the tag(s) within the bbox.
async function queryOverpass(bbox, tags, maxResults) {
  const clauses = tags
    .map((t) => {
      const [k, v] = t.split('=');
      const tagFilter = v === '*' ? `["${k}"]` : `["${k}"="${v}"]`;
      return `node${tagFilter}(${bbox.south},${bbox.west},${bbox.north},${bbox.east});
              way${tagFilter}(${bbox.south},${bbox.west},${bbox.north},${bbox.east});`;
    })
    .join('\n');

  const query = `
    [out:json][timeout:25];
    (
      ${clauses}
    );
    out center ${maxResults * 2};
  `;

  let lastErr;
  for (const url of OVERPASS_URLS) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': USER_AGENT
        },
        body: `data=${encodeURIComponent(query)}`
      });
      if (res.status === 429 || res.status === 504) {
        lastErr = new Error(`Overpass HTTP ${res.status} at ${url}`);
        continue; // try next mirror
      }
      if (!res.ok) throw new Error(`Overpass HTTP ${res.status} at ${url}`);
      const data = await res.json();
      return data.elements || [];
    } catch (err) {
      lastErr = err;
      // network error or timeout — try next mirror
    }
  }
  throw lastErr || new Error('All Overpass mirrors failed');
}

function elementToCandidate(el, industry) {
  const tags = el.tags || {};
  const name = tags.name;
  if (!name) return null; // skip unnamed nodes, not useful leads

  const addressParts = [
    tags['addr:housenumber'],
    tags['addr:street'],
    tags['addr:city']
  ].filter(Boolean);

  return {
    name,
    website: tags.website || tags['contact:website'] || '',
    industry,
    location: addressParts.join(', ') || tags['addr:city'] || '',
    company_size: '',
    contact_info: [
      {
        phone: tags.phone || tags['contact:phone'] || '',
        email: tags.email || tags['contact:email'] || ''
      }
    ],
    description: tags.shop || tags.office || tags.amenity || '',
    confidence: 0.5, // OSM data is community-sourced; treat as medium confidence
    source_url: `https://www.openstreetmap.org/${el.type}/${el.id}`,
    source_type: 'real_web'
  };
}

export async function searchCompanies(filters) {
  const { industry = 'business', country = 'Armenia', maxResults = 10 } = filters || {};

  try {
    const bbox = await resolveArea(country);
    if (!bbox) return [];

    const tags = tagsForIndustry(industry);
    const elements = await queryOverpass(bbox, tags, maxResults);

    const seen = new Set();
    const candidates = [];
    for (const el of elements) {
      const candidate = elementToCandidate(el, industry);
      if (!candidate) continue;
      const dedupeKey = candidate.name.toLowerCase();
      if (seen.has(dedupeKey)) continue;
      seen.add(dedupeKey);
      candidates.push(candidate);
      if (candidates.length >= maxResults) break;
    }
    return candidates;
  } catch (err) {
    console.error('OpenStreetMap connector error:', err.message || err);
    return [];
  }
}
