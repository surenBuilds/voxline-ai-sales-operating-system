// Free business discovery via OpenStreetMap (Overpass API + Nominatim).
// No API key, no billing, no credit card required.
// Respects OSM usage policy: descriptive User-Agent, modest request volume.
// Docs: https://wiki.openstreetmap.org/wiki/Overpass_API
//       https://nominatim.org/release-docs/latest/api/Search/

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const USER_AGENT = 'VoxlineAI-BusinessDiscovery/1.0 (contact: set RESEND_FROM_EMAIL)';

// Rough mapping from free-text industry names to OSM tag values.
// OSM uses shop=*, office=*, and amenity=* namespaces for most businesses.
const INDUSTRY_TAG_MAP = {
  technology: ['office=it', 'shop=computer', 'office=coworking'],
  retail: ['shop=*'],
  hospitality: ['amenity=restaurant', 'amenity=cafe', 'tourism=hotel'],
  healthcare: ['amenity=clinic', 'amenity=doctors', 'amenity=dentist', 'amenity=pharmacy'],
  finance: ['office=financial', 'office=insurance', 'amenity=bank'],
  education: ['amenity=school', 'office=educational_institution'],
  manufacturing: ['man_made=works', 'landuse=industrial'],
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

  const res = await fetch(OVERPASS_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': USER_AGENT
    },
    body: `data=${encodeURIComponent(query)}`
  });
  if (!res.ok) throw new Error(`Overpass HTTP ${res.status}`);
  const data = await res.json();
  return data.elements || [];
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
