import { describe, expect, it } from "bun:test";
import { parseRssFeed } from "./rss-parser";

const SAMPLE_RSS = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Test Feed</title>
    <item>
      <title>Article One</title>
      <link>https://example.com/one</link>
      <description>Summary of article one</description>
      <enclosure url="https://example.com/img.jpg" type="image/jpeg"/>
    </item>
    <item>
      <title>Article Two</title>
      <link>https://example.com/two</link>
    </item>
  </channel>
</rss>`;

describe("parseRssFeed", () => {
  it("parses items from RSS XML", () => {
    const articles = parseRssFeed(SAMPLE_RSS, "test-source");
    expect(articles.length).toBe(2);
    expect(articles[0].title).toBe("Article One");
    expect(articles[0].url).toBe("https://example.com/one");
    expect(articles[0].source).toBe("test-source");
  });

  it("returns empty array on bad XML", () => {
    expect(parseRssFeed("not xml", "test")).toHaveLength(0);
  });
});
