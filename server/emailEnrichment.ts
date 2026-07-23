// Google Places does not expose business emails. This best-effort enrichment
// fetches the company's homepage (and /contact page if linked) and extracts
// the first plausible contact email found in the HTML.

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

// Common placeholder/tracking domains to ignore (image CDNs, analytics, template boilerplate)
const IGNORE_DOMAINS = ['sentry.io', 'wixpress.com', 'example.com', 'schema.org', 'w3.org', 'godaddy.com', 'domain.com'];

function extractEmails(html: string): string[] {
  const matches = html.match(EMAIL_REGEX) || [];
  const unique = Array.from(new Set(matches.map((e) => e.toLowerCase())));
  return unique.filter((e) => !IGNORE_DOMAINS.some((d) => e.endsWith(d)));
}

async function fetchWithTimeout(url: string, ms = 8000): Promise<string | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ms);
  try {
    const res = await fetch(url, { signal: controller.signal, headers: { 'User-Agent': 'VoxlineAI-ResearchAgent/1.0' } });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export async function findContactEmail(website: string): Promise<string | null> {
  if (!website) return null;
  const base = website.startsWith('http') ? website : `https://${website}`;

  const homepage = await fetchWithTimeout(base);
  if (homepage) {
    const found = extractEmails(homepage);
    if (found.length > 0) return found[0];
  }

  // Try a common /contact path as a fallback
  try {
    const url = new URL(base);
    const contactUrl = `${url.origin}/contact`;
    const contactPage = await fetchWithTimeout(contactUrl);
    if (contactPage) {
      const found = extractEmails(contactPage);
      if (found.length > 0) return found[0];
    }
  } catch {
    // invalid URL — ignore
  }

  return null;
}
