import { NextResponse } from "next/server";
import { getRecentArticlesForRss } from "@/lib/db/queries";
import { generateRssFeed } from "@/lib/rss/generator";

export const revalidate = 7200;

export async function GET() {
  const articles = await getRecentArticlesForRss(100);
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://trace.news";
  const xml = generateRssFeed(articles, baseUrl);
  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=7200",
    },
  });
}
