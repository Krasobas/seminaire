const STRAPI_URL = import.meta.env.STRAPI_URL || 'http://strapi:1337';
const STRAPI_TOKEN = import.meta.env.STRAPI_API_TOKEN || '';

async function fetchAPI(path: string, options: RequestInit = {}) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (STRAPI_TOKEN) {
    headers['Authorization'] = `Bearer ${STRAPI_TOKEN}`;
  }

  const res = await fetch(`${STRAPI_URL}/api${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    console.error(`Strapi API error: ${res.status} ${res.statusText} for ${path}`);
    return null;
  }

  return res.json();
}

// --- News ---
export async function getNews(limit = 5) {
  const data = await fetchAPI(`/articles?sort=publishedAt:desc&pagination[limit]=${limit}&populate=*`);
  return data?.data || [];
}

export async function getFeaturedArticle() {
  const data = await fetchAPI(`/articles?filters[featured][$eq]=true&sort=publishedAt:desc&pagination[limit]=1&populate=*`);
  return data?.data?.[0] || null;
}

// --- Pages ---
export async function getPage(slug: string) {
  const data = await fetchAPI(`/pages?filters[slug][$eq]=${slug}&populate=*`);
  return data?.data?.[0] || null;
}

// --- Liturgy schedule ---
export async function getLiturgySchedule() {
  const data = await fetchAPI(`/liturgy-schedules?sort=date:desc&pagination[limit]=10&populate=*`);
  return data?.data || [];
}

// --- Video episodes ---
export async function getEpisodes(limit = 5) {
  const data = await fetchAPI(`/episodes?sort=publishedAt:desc&pagination[limit]=${limit}&populate=*`);
  return data?.data || [];
}

// --- Site settings (global) ---
export async function getSiteSettings() {
  const data = await fetchAPI(`/site-setting?populate=*`);
  return data?.data || null;
}

export default fetchAPI;
