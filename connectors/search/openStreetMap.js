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

// Per-request timeout — without this, a stalled connection to a busy public
// mirror hangs until the platform kills it, surfacing as an opaque
// "fetch failed" with no useful diagnostic.
const FETCH_TIMEOUT_MS = 15000;

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

// Nominatim's usage policy caps requests at ~1/sec and expects callers to
// cache results. The scheduler calls searchCompanies() once per industry per
// tick (7+ times back to back), so without caching we were hammering
// Nominatim repeatedly for the *same* country lookup and getting throttled —
// which is what was silently breaking discovery on every tick. Cache the
// resolved bounding box per location for the life of the process.
const bboxCache = new Map();
const BBOX_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24h — country borders don't move

// Rough mapping from free-text industry names to OSM tag values.
// OSM uses shop=*, office=*, and amenity=* namespaces for most businesses.
const INDUSTRY_TAG_MAP = {
  technology: ['office=it', 'shop=computer', 'office=coworking', 'office=software', 'shop=mobile_phone'],
  retail: ['shop=*'],
  hospitality: ['amenity=restaurant', 'amenity=cafe', 'tourism=hotel', 'amenity=fast_food', 'amenity=bar'],
  healthcare: ['amenity=clinic', 'amenity=doctors', 'amenity=dentist', 'amenity=pharmacy', 'amenity=hospital'],
  finance: ['office=financial', 'office=insurance', 'amenity=bank', 'office=accountant'],
  education: ['amenity=school', 'office=educational_institution', 'amenity=university', 'amenity=language_school', 'amenity=college'],
  manufacturing: ['man_made=works', 'landuse=industrial', 'craft=*'],
  'real estate': ['office=estate_agent'],
  // Robotics companies are rare enough in OSM that we cast a wide net
  // across the tags most likely to catch engineering/robotics/electronics
  // firms in Armenia — Atlas's target segment.
  robotics: ['office=engineering', 'craft=electronics_repair', 'shop=electronics', 'office=research', 'craft=*']
};

function tagsForIndustry(industry) {
  const key = (industry || '').toLowerCase().trim();
  return INDUSTRY_TAG_MAP[key] || ['shop=*'];
}

// Step 1: resolve a city/country name to a bounding box via Nominatim.
// Cached — see BBOX_CACHE_TTL_MS above for why this matters.
async function resolveArea(location) {
  const cacheKey = location.toLowerCase().trim();
  const cached = bboxCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.bbox;
  }

  const params = new URLSearchParams({ q: location, format: 'json', limit: '1' });
  let res;
  try {
    res = await fetchWithTimeout(`${NOMINATIM_URL}?${params.toString()}`, {
      headers: { 'User-Agent': USER_AGENT }
    });
  } catch (err) {
    throw new Error(`Nominatim request failed: ${err.message || err}`);
  }
  if (!res.ok) throw new Error(`Nominatim HTTP ${res.status}`);
  const data = await res.json();
  if (!data.length) {
    bboxCache.set(cacheKey, { bbox: null, expiresAt: Date.now() + 60 * 60 * 1000 });
    return null;
  }
  const { boundingbox } = data[0];
  const bbox = {
    south: parseFloat(boundingbox[0]),
    north: parseFloat(boundingbox[1]),
    west: parseFloat(boundingbox[2]),
    east: parseFloat(boundingbox[3])
  };
  bboxCache.set(cacheKey, { bbox, expiresAt: Date.now() + BBOX_CACHE_TTL_MS });
  return bbox;
}

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
      const res = await fetchWithTimeout(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': USER_AGENT
        },
        body: `data=${encodeURIComponent(query)}`
      });
      if (res.status === 429 || res.status === 504) {
        lastErr = new Error(`Overpass HTTP ${res.status} at ${url}`);
        continue;
      }
      if (!res.ok) throw new Error(`Overpass HTTP ${res.status} at ${url}`);
      const data = await res.json();
      return data.elements || [];
    } catch (err) {
      const reason = err.name === 'AbortError' ? `timeout after ${FETCH_TIMEOUT_MS}ms` : err.message || err;
      lastErr = new Error(`${url} — ${reason}`);
    }
  }
  throw lastErr || new Error('All Overpass mirrors failed');
}

function elementToCandidate(el, industry) {
  const tags = el.tags || {};
  const name = tags.name;
  if (!name) return null;

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
    confidence: 0.5,
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
