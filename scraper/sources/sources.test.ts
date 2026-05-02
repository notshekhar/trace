import { describe, expect, it } from "bun:test";
import { CnnSource } from "./cnn";
import { BbcSource } from "./bbc";
import { TechCrunchSource } from "./techcrunch";
import { EspnSource } from "./espn";

describe("sources", () => {
  it("CnnSource has correct name and feedUrl", () => {
    const s = new CnnSource();
    expect(s.name).toBe("cnn");
    expect(s.feedUrl).toContain("cnn.com");
  });
  it("BbcSource has correct name", () => {
    expect(new BbcSource().name).toBe("bbc");
  });
  it("TechCrunchSource is tech category source", () => {
    expect(new TechCrunchSource().name).toBe("techcrunch");
  });
  it("EspnSource has correct name", () => {
    expect(new EspnSource().name).toBe("espn");
  });
});
