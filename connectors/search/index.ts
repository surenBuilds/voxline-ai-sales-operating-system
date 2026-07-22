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
  // Priority: SerpAPI -> Google -> Bing -> fallback empty
  if (process.env.SERPAPI_KEY) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const serpapi = require('./serpapi.js');
    return serpapi.searchCompanies(filters);
  }

  if (process.env.GOOGLE_SEARCH_KEY) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const google = require('./googleSearch.js');
    return google.searchCompanies(filters);
  }

  if (process.env.BING_SEARCH_KEY) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const bing = require('./bingSearch.js');
    return bing.searchCompanies(filters);
  }

  // No external connector configured
  return [];
}
