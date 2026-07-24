export interface SearchCandidate {
  name?: string;
  website?: string;
  industry?: string;
  location?: string;
  company_size?: string;
  contact_info?: { name?: string; role?: string; title?: string; email?: string; phone?: string; linkedin?: string; confidence?: number; source?: string }[];
  description?: string;
  possible_problems?: string[];
  confidence?: number;
  source_url?: string;
  source_type?: 'api_source' | 'real_web' | 'ai_demo';
}

export async function searchCompanies(filters: any): Promise<SearchCandidate[]> {
  // 1) Google Places — real data, requires GOOGLE_PLACES_API_KEY + billing.
  if (process.env.GOOGLE_PLACES_API_KEY) {
    try {
      const places = await import('./googlePlaces.js');
      const results = (await places.searchCompanies(filters)) as SearchCandidate[];
      if (results.length > 0) return results;
    } catch (err) {
      console.error('Google Places connector error:', err);
    }
  }

  // 2) OpenStreetMap — free fallback, no key or billing required.
  //    Runs automatically when Google Places isn't configured.
  try {
    const osm = await import('./openStreetMap.js');
    const results = (await osm.searchCompanies(filters)) as SearchCandidate[];
    if (results.length > 0) return results;
  } catch (err) {
    console.error('OpenStreetMap connector error:', err);
  }

  // No external connector configured or all failed
  return [];
}
