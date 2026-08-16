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

// ISO 3166-1 alpha-2 codes for country-level searches. When the requested
// location matches one of these, we query Overpass using the country's
// actual administrative boundary polygon (area["ISO3166-1"="AM"]) instead
// of a rectangular bounding box. This matters: a bbox is just a rectangle,
// and Armenia's irregular borders mean a bbox tight enough to cover the
// whole country can still clip slivers of Azerbaijan/Nakhchivan/Georgia/
// Turkey/Iran near the edges — which is how outreach ended up going to
// businesses outside Armenia. The ISO boundary query only matches the real
// country polygon, not a rectangle around it.
const COUNTRY_ISO_CODES = {
  armenia: 'AM',
  georgia: 'GE',
  iran: 'IR',
  uae: 'AE',
  'united arab emirates': 'AE',
  'saudi arabia': 'SA',
  qatar: 'QA',
  kuwait: 'KW',
  bahrain: 'BH',
  oman: 'OM',
  india: 'IN',
  pakistan: 'PK',
  china: 'CN'
};

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

async function queryOverpass(bbox, tags, maxResults, isoCode) {
  const locationClause = isoCode
    ? `area["ISO3166-1"="${isoCode}"][admin_level=2]->.searchArea;`
    : '';

  const clauses = tags
    .map((t) => {
      const [k, v] = t.split('=');
      const tagFilter = v === '*' ? `["${k}"]` : `["${k}"="${v}"]`;
      if (isoCode) {
        return `node${tagFilter}(area.searchArea);
              way${tagFilter}(area.searchArea);`;
      }
      return `node${tagFilter}(${bbox.south},${bbox.west},${bbox.north},${bbox.east});
              way${tagFilter}(${bbox.south},${bbox.west},${bbox.north},${bbox.east});`;
    })
    .join('\n');

  const query = `
    [out:json][timeout:25];
    ${locationClause}
    (
      ${clauses}
    );
    out center ${maxResults * 2};
  `;

  let lastErr;
  for (const url of OVERPASS_URLS) {
    // Try each mirror twice (transient network blips are common on public
    // infra) before giving up on it and moving to the next mirror.
    for (let attempt = 1; attempt <= 2; attempt++) {
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
          break; // don't retry rate-limits on the same mirror — move on
        }
        if (!res.ok) throw new Error(`Overpass HTTP ${res.status} at ${url}`);
        const data = await res.json();
        return data.elements || [];
      } catch (err) {
        const reason = err.name === 'AbortError' ? `timeout after ${FETCH_TIMEOUT_MS}ms` : err.message || err;
        lastErr = new Error(`${url} — ${reason}`);
        if (attempt === 1) {
          await new Promise((r) => setTimeout(r, 1500)); // brief pause, then retry same mirror once
        }
      }
    }
  }
  throw lastErr || new Error('All Overpass mirrors failed');
}

// Fallback when every Overpass mirror fails: query Nominatim's own search
// endpoint (a different API surface than Overpass, so it isn't affected by
// the same outage) for free-text business names within the bounding box.
// Lower recall than Overpass's tag-based search, but free and independent.
async function searchNominatimFallback(bbox, keyword, maxResults, isoCode) {
  const params = new URLSearchParams({
    q: keyword,
    format: 'json',
    addressdetails: '1',
    extratags: '1',
    limit: String(Math.min(maxResults, 30))
  });
  // Prefer Nominatim's own country-code filter (precise, boundary-aware)
  // over a bounding box, for the same border-leakage reason as Overpass.
  if (isoCode) {
    params.set('countrycodes', isoCode.toLowerCase());
  } else if (bbox) {
    params.set('viewbox', `${bbox.west},${bbox.north},${bbox.east},${bbox.south}`);
    params.set('bounded', '1');
  }
  try {
    const res = await fetchWithTimeout(`${NOMINATIM_URL}?${params.toString()}`, {
      headers: { 'User-Agent': USER_AGENT }
    });
    if (!res.ok) return [];
    const results = await res.json();
    return (results || []).map((r) => ({
      tags: {
        name: r.namedetails?.name || r.display_name?.split(',')[0] || keyword,
        website: r.extratags?.website || '',
        phone: r.extratags?.phone || '',
        email: r.extratags?.email || '',
        'addr:city': r.address?.city || r.address?.town || ''
      },
      type: r.osm_type,
      id: r.osm_id
    }));
  } catch (err) {
    console.error('Nominatim fallback search error:', err.message || err);
    return [];
  }
}

// A representative free-text keyword per industry, used only for the
// Nominatim fallback search (Overpass uses the richer tag map above).
const INDUSTRY_KEYWORD = {
  technology: 'computer',
  retail: 'shop',
  hospitality: 'restaurant',
  healthcare: 'pharmacy',
  finance: 'bank',
  education: 'school',
  manufacturing: 'factory',
  'real estate': 'real estate agency',
  robotics: 'engineering'
};

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
  const isoCode = COUNTRY_ISO_CODES[(country || '').toLowerCase().trim()] || null;

  try {
    // bbox is still resolved (used for the Nominatim fallback's viewbox
    // when we DON'T have an ISO code, e.g. a city-level search) but the
    // primary Overpass query uses the precise ISO boundary when available.
    const bbox = await resolveArea(country);
    if (!bbox && !isoCode) return [];

    const tags = tagsForIndustry(industry);
    let elements;
    try {
      elements = await queryOverpass(bbox, tags, maxResults, isoCode);
    } catch (err) {
      console.error('OpenStreetMap connector error (Overpass exhausted, trying Nominatim fallback):', err.message || err);
      const keyword = INDUSTRY_KEYWORD[(industry || '').toLowerCase().trim()] || industry;
      elements = await searchNominatimFallback(bbox, keyword, maxResults, isoCode);
    }

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
