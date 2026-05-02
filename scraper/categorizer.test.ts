import { describe, expect, it } from "bun:test";
import { categorize } from "./categorizer";

describe("categorize", () => {
  it("maps tech sources", () => {
    expect(categorize("techcrunch")).toBe("tech");
    expect(categorize("dailydev")).toBe("tech");
  });
  it("maps sports sources", () => {
    expect(categorize("espn")).toBe("sports");
  });
  it("falls back to world", () => {
    expect(categorize("cnn")).toBe("world");
    expect(categorize("bbc")).toBe("world");
  });
});
