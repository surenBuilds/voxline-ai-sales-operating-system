// Google Places does not expose business emails. This best-effort enrichment
// fetches the company's homepage (and /contact page if linked) and extracts
// the first plausible contact email found in the HTML.

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

// Common placeholder/tracking domains to ignore (image CDNs, analytics,
// template boilerplate, and generic "example" domains that show up as
// input placeholder text, e.g. <input placeholder="you@company.com">).
const IGNORE_DOMAINS = [
  'sentry.io', 'wixpress.com', 'example.com', 'schema.org', 'w3.org',
  'godaddy.com', 'domain.com', 'email.com', 'company.com', 'yourdomain.com',
  'yourcompany.com', 'mycompany.com', 'sample.com', 'test.com', 'website.com',
  'mail.com', 'address.com'
];

// Local-part patterns that are almost always placeholder/example text from
// a contact-form input field, not a real address — e.g. "you@...",
// "yourname@...", "name@...", "test@...", "john.doe@...". Matched against
// the part before the @ only, case-insensitive, exact or prefix match.
const PLACEHOLDER_LOCAL_PARTS = [
  'you', 'yourname', 'youremail', 'yourmail', 'your.name', 'your.email',
  'name', 'username', 'user', 'test', 'example', 'sample', 'placeholder',
  'someone', 'anyone', 'firstname.lastname', 'firstname', 'lastname',
  'john.doe', 'jane.doe', 'johndoe', 'janedoe', 'noreply', 'no-reply',
  'donotreply', 'enter-email', 'enteremail', 'yourusername'
];

export function isPlaceholderEmail(email: string): boolean {
  const [localPart] = email.split('@');
  if (!localPart) return true;
  const normalized = localPart.toLowerCase();
  return PLACEHOLDER_LOCAL_PARTS.some((p) => normalized === p || normalized.startsWith(p + '.') || normalized.startsWith(p + '_'));
}

function extractEmails(html: string): string[] {
  const matches = html.match(EMAIL_REGEX) || [];
  const unique = Array.from(new Set(matches.map((e) => e.toLowerCase())));
  return unique.filter((e) => !IGNORE_DOMAINS.some((d) => e.endsWith(d)) && !isPlaceholderEmail(e));
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
