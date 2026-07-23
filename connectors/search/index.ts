export interface SearchCandidate {
  name?: string;
  website?: string;
  industry?: string;
  location?: string;
  company_size?: string;
  contact_info?: { email?: string; phone?: string; linkedin?: string }[];
  description?: string;
  possible_problems?: string[];
  confidence?: number;
  source_url?: string;
  source_type?: 'api_source' | 'real_web' | 'ai_demo';
}

export async function searchCompanies(filters: any): Promise<SearchCandidate[]> {
  // Google Places is the currently implemented real-data connector. It's only
  // invoked if its API key is configured, so a missing key never crashes the
  // agent — it just yields no verified leads (caller falls back to demo mode).
  // Additional connectors (SerpAPI, Bing, etc.) can be added the same way:
  // add a new file in this folder + a new `if (process.env.X_KEY)` branch here.
  if (process.env.GOOGLE_PLACES_API_KEY) {
    try {
      const places = await import('./googlePlaces.js');
      const results = (await places.searchCompanies(filters)) as SearchCandidate[];
      if (results.length > 0) return results;
    } catch (err) {
      console.error('Google Places connector error:', err);
    }
  }

  // No external connector configured or all failed
  return [];
}
