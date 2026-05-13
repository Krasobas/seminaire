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

  try {
    const res = await fetch(`${STRAPI_URL}/api${path}`, {
      ...options,
      headers,
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      console.error(`Strapi API error: ${res.status} ${res.statusText} for ${path}`);
      return null;
    }

    return res.json();
  } catch (err) {
    console.error(`Strapi API unavailable: ${path}`, err instanceof Error ? err.message : err);
    return null;
  }
}

// ═══════════════════════════════════════════════
// Flatten Strapi v4 responses
// ═══════════════════════════════════════════════

export interface StrapiImageFormat {
  name: string;
  hash: string;
  ext: string;
  mime: string;
  width: number;
  height: number;
  size: number;
  url: string;
}

export interface StrapiImage {
  id: number;
  name: string;
  alternativeText: string | null;
  caption: string | null;
  width: number;
  height: number;
  formats: {
    thumbnail?: StrapiImageFormat;
    small?: StrapiImageFormat;
    medium?: StrapiImageFormat;
    large?: StrapiImageFormat;
  };
  url: string;
}

export interface Article {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featured: boolean;
  category: string;
  publishedAt: string;
  image: StrapiImage | null;
}

export interface Episode {
  id: number;
  title: string;
  slug: string;
  description: string;
  youtubeUrl: string;
  season: string;
  episodeNumber: number;
  publishedAt: string;
  thumbnail: StrapiImage | null;
}

export interface Page {
  id: number;
  title: string;
  slug: string;
  content: string;
  image: StrapiImage | null;
}

export interface LiturgyScheduleItem {
  id: number;
  title: string;
  period: string;
  date: string;
  time: string;
  offices: string;
  description: string;
  location: string;
}

export interface SiteSettings {
  id: number;
  siteName: string;
  siteDescription: string;
  theme: string;
}

function flattenImage(raw: any): StrapiImage | null {
  if (!raw) return null;
  const a = raw.attributes || raw;
  return {
    id: raw.id || a.id,
    name: a.name,
    alternativeText: a.alternativeText,
    caption: a.caption,
    width: a.width,
    height: a.height,
    formats: a.formats || {},
    url: a.url,
  };
}

function flattenArticle(raw: any): Article {
  const a = raw.attributes || raw;
  return {
    id: raw.id,
    title: a.title || '',
    slug: a.slug || '',
    excerpt: a.excerpt || '',
    content: a.content || '',
    featured: a.featured || false,
    category: a.category || '',
    publishedAt: a.publishedAt || '',
    image: a.image?.data ? flattenImage(a.image.data) : null,
  };
}

function flattenEpisode(raw: any): Episode {
  const a = raw.attributes || raw;
  return {
    id: raw.id,
    title: a.title || '',
    slug: a.slug || '',
    description: a.description || '',
    youtubeUrl: a.youtubeUrl || '',
    season: a.season || '',
    episodeNumber: a.episodeNumber || 0,
    publishedAt: a.publishedAt || '',
    thumbnail: a.thumbnail?.data ? flattenImage(a.thumbnail.data) : null,
  };
}

function flattenPage(raw: any): Page {
  const a = raw.attributes || raw;
  return {
    id: raw.id,
    title: a.title || '',
    slug: a.slug || '',
    content: a.content || '',
    image: a.image?.data ? flattenImage(a.image.data) : null,
  };
}

function flattenLiturgySchedule(raw: any): LiturgyScheduleItem {
  const a = raw.attributes || raw;
  return {
    id: raw.id,
    title: a.title || '',
    period: a.period || 'Temps ordinaire',
    date: a.date || '',
    time: a.time || '',
    offices: a.offices || '',
    description: a.description || '',
    location: a.location || '',
  };
}

function flattenSiteSettings(raw: any): SiteSettings | null {
  if (!raw) return null;
  const a = raw.attributes || raw;
  return {
    id: raw.id || a.id,
    siteName: a.siteName || '',
    siteDescription: a.siteDescription || '',
    theme: a.theme || 'light',
  };
}

// ═══════════════════════════════════════════════
// Helper: get best image URL
// ═══════════════════════════════════════════════

export function getImageUrl(img: StrapiImage | null, format: 'large' | 'medium' | 'small' | 'thumbnail' = 'medium'): string | null {
  if (!img) return null;
  const fmt = img.formats?.[format];
  if (fmt?.url) return fmt.url;
  // Fallback: try smaller formats
  for (const f of ['medium', 'small', 'large', 'thumbnail'] as const) {
    if (img.formats?.[f]?.url) return img.formats[f]!.url;
  }
  return img.url || null;
}

export function formatDate(dateStr: string, style: 'full' | 'short' | 'month-year' = 'full'): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    if (style === 'month-year') return d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    if (style === 'short') return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch {
    return '';
  }
}

// ═══════════════════════════════════════════════
// API functions (return flattened data)
// ═══════════════════════════════════════════════

export async function getNews(limit = 5): Promise<Article[]> {
  const data = await fetchAPI(`/articles?sort=publishedAt:desc&pagination[limit]=${limit}&populate=*`);
  if (!data?.data) return [];
  return data.data.map(flattenArticle);
}

export async function getFeaturedArticle(): Promise<Article | null> {
  const data = await fetchAPI(`/articles?filters[featured][$eq]=true&sort=publishedAt:desc&pagination[limit]=1&populate=*`);
  if (!data?.data?.[0]) return null;
  return flattenArticle(data.data[0]);
}

export async function getPage(slug: string): Promise<Page | null> {
  const data = await fetchAPI(`/pages?filters[slug][$eq]=${slug}&populate=*`);
  if (!data?.data?.[0]) return null;
  return flattenPage(data.data[0]);
}

export async function getLiturgySchedule(period?: string, limit = 10): Promise<LiturgyScheduleItem[]> {
  let path = `/liturgy-schedules?pagination[limit]=${limit}&populate=*`;
  if (period) {
    path += `&filters[period][$eq]=${encodeURIComponent(period)}`;
  }
  const data = await fetchAPI(path);
  if (!data?.data) return [];
  return data.data.map(flattenLiturgySchedule);
}

export async function getEpisodes(limit = 5): Promise<Episode[]> {
  const data = await fetchAPI(`/episodes?sort=publishedAt:desc&pagination[limit]=${limit}&populate=*`);
  if (!data?.data) return [];
  return data.data.map(flattenEpisode);
}

export async function getAllArticles(page = 1, pageSize = 12): Promise<{ data: Article[]; pagination: any } | null> {
  const data = await fetchAPI(`/articles?sort=publishedAt:desc&pagination[page]=${page}&pagination[pageSize]=${pageSize}&populate=*`);
  if (!data) return null;
  return {
    data: (data.data || []).map(flattenArticle),
    pagination: data.meta?.pagination || null,
  };
}

export async function getArticle(slug: string): Promise<Article | null> {
  const data = await fetchAPI(`/articles?filters[slug][$eq]=${slug}&populate=*`);
  if (!data?.data?.[0]) return null;
  return flattenArticle(data.data[0]);
}

export async function getAllEpisodes(page = 1, pageSize = 12): Promise<{ data: Episode[]; pagination: any } | null> {
  const data = await fetchAPI(`/episodes?sort=publishedAt:desc&pagination[page]=${page}&pagination[pageSize]=${pageSize}&populate=*`);
  if (!data) return null;
  return {
    data: (data.data || []).map(flattenEpisode),
    pagination: data.meta?.pagination || null,
  };
}

export async function getAllPages(): Promise<Page[]> {
  const data = await fetchAPI(`/pages?pagination[limit]=100&populate=*`);
  if (!data?.data) return [];
  return data.data.map(flattenPage);
}

export async function getSiteSettings(): Promise<SiteSettings | null> {
  const data = await fetchAPI(`/site-setting?populate=*`);
  if (!data?.data) return null;
  return flattenSiteSettings(data.data);
}

// ═══════════════════════════════════════════════
// Staff, Alumni, Seminaristes, Universities
// ═══════════════════════════════════════════════

export interface StaffMember {
  id: number;
  name: string;
  role: string;
  roleCategory: string;
  description: string;
  photo: StrapiImage | null;
}

export interface AlumniMember {
  id: number;
  name: string;
  promotion: string;
  description: string;
  photo: StrapiImage | null;
}

export interface Seminariste {
  id: number;
  name: string;
  year: string;
  origin: string;
  description: string;
  photo: StrapiImage | null;
}

export interface University {
  id: number;
  name: string;
  description: string;
  logo: StrapiImage | null;
}

function flattenStaff(raw: any): StaffMember {
  const a = raw.attributes || raw;
  return {
    id: raw.id,
    name: a.name || '',
    role: a.role || '',
    roleCategory: a.roleCategory || 'Administration',
    description: a.description || '',
    photo: a.photo?.data ? flattenImage(a.photo.data) : null,
  };
}

function flattenAlumni(raw: any): AlumniMember {
  const a = raw.attributes || raw;
  return {
    id: raw.id,
    name: a.name || '',
    promotion: a.promotion || '',
    description: a.description || '',
    photo: a.photo?.data ? flattenImage(a.photo.data) : null,
  };
}

function flattenSeminariste(raw: any): Seminariste {
  const a = raw.attributes || raw;
  return {
    id: raw.id,
    name: a.name || '',
    year: a.year || '',
    origin: a.origin || '',
    description: a.description || '',
    photo: a.photo?.data ? flattenImage(a.photo.data) : null,
  };
}

function flattenUniversity(raw: any): University {
  const a = raw.attributes || raw;
  return {
    id: raw.id,
    name: a.name || '',
    description: a.description || '',
    logo: a.logo?.data ? flattenImage(a.logo.data) : null,
  };
}

export async function getStaff(): Promise<StaffMember[]> {
  const data = await fetchAPI(`/staffs?populate=*&pagination[limit]=100`);
  if (!data?.data) return [];
  return data.data.map(flattenStaff);
}

export async function getAlumni(): Promise<AlumniMember[]> {
  const data = await fetchAPI(`/alumnis?populate=*&pagination[limit]=100`);
  if (!data?.data) return [];
  return data.data.map(flattenAlumni);
}

export async function getSeminaristes(): Promise<Seminariste[]> {
  const data = await fetchAPI(`/seminaristes?populate=*&pagination[limit]=100`);
  if (!data?.data) return [];
  return data.data.map(flattenSeminariste);
}

export async function getUniversities(): Promise<University[]> {
  const data = await fetchAPI(`/universities?populate=*&pagination[limit]=100`);
  if (!data?.data) return [];
  return data.data.map(flattenUniversity);
}

export default fetchAPI;
