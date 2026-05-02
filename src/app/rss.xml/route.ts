import { getToday } from "@/lib/api";
import { generateRssFeed } from "@/lib/rss/generator";

export const revalidate = 7200;

export async function GET() {
    const today = await getToday();
    const articles = (today?.articles ?? []).slice(0, 100);
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://trace.news";
    const xml = generateRssFeed(articles, baseUrl);

    return new Response(xml, {
        headers: {
            "Content-Type": "application/rss+xml; charset=utf-8",
            "Cache-Control": "public, max-age=7200",
        },
    });
}
