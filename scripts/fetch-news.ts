// scripts/fetch-news.ts
// Fetches top headlines from NewsAPI
import 'dotenv/config';
import type { RawArticle } from '../src/types';

const NEWS_API_KEY = process.env.NEWS_API_KEY!;
const BASE_URL = 'https://newsapi.org/v2/top-headlines';

export async function fetchNews(
    category: string = 'technology',
    country: string = 'us',
    pageSize: number = 3
): Promise<RawArticle[]> {
    const url = `${BASE_URL}?country=${country}&category=${category}&pageSize=${pageSize}&apiKey=${NEWS_API_KEY}`;

    console.log(`📰 Fetching ${pageSize} ${category} headlines from NewsAPI...`);

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`NewsAPI error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (data.status !== 'ok') {
        throw new Error(`NewsAPI returned status: ${data.status} — ${data.message}`);
    }

    const articles: RawArticle[] = data.articles.map(
        (a: {
            title: string;
            description: string;
            url: string;
            source: { name: string };
            urlToImage: string | null;
        }) => ({
            title: a.title || 'Untitled',
            description: a.description || '',
            url: a.url,
            source: a.source?.name || 'Unknown',
            urlToImage: a.urlToImage,
        })
    );

    console.log(`✅ Fetched ${articles.length} articles:`);
    articles.forEach((a, i) => console.log(`   ${i + 1}. ${a.title}`));

    return articles;
}

// Allow direct execution for testing
if (require.main === module) {
    fetchNews()
        .then((articles) => {
            console.log('\n📋 Full output:');
            console.log(JSON.stringify(articles, null, 2));
        })
        .catch(console.error);
}
