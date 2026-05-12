import type { APIRoute } from 'astro';
import { getAllArticles, getImageUrl, formatDate } from '../../lib/strapi';

export const GET: APIRoute = async ({ url }) => {
  const page = parseInt(url.searchParams.get('page') || '1');
  const pageSize = parseInt(url.searchParams.get('pageSize') || '12');

  try {
    const result = await getAllArticles(page, pageSize);
    const articles = result?.data || [];
    const pagination = result?.pagination;

    const formattedArticles = articles.map(article => ({
      slug: article.slug,
      title: article.title,
      excerpt: article.excerpt || null,
      category: article.category || null,
      date: formatDate(article.publishedAt),
      imageUrl: getImageUrl(article.image, 'medium') || null,
    }));

    return new Response(JSON.stringify({
      articles: formattedArticles,
      hasMore: pagination ? pagination.page < pagination.pageCount : false,
      page,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to fetch articles' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
