import { describe, expect, it } from "vitest";
import { parseLineDirectives, hasLineDirectives } from "./line-directives.js";

describe("hasLineDirectives", () => {
  it("detects quick_replies directive", () => {
    expect(hasLineDirectives("Here are options [[quick_replies: A, B, C]]")).toBe(true);
  });

  it("detects location directive", () => {
    expect(hasLineDirectives("[[location: Place | Address | 35.6 | 139.7]]")).toBe(true);
  });

  it("detects confirm directive", () => {
    expect(hasLineDirectives("[[confirm: Continue? | Yes | No]]")).toBe(true);
  });

  it("detects buttons directive", () => {
    expect(hasLineDirectives("[[buttons: Menu | Choose | Opt1:data1, Opt2:data2]]")).toBe(true);
  });

  it("returns false for regular text", () => {
    expect(hasLineDirectives("Just regular text")).toBe(false);
  });

  it("returns false for similar but invalid patterns", () => {
    expect(hasLineDirectives("[[not_a_directive: something]]")).toBe(false);
  });

  it("detects media_player directive", () => {
    expect(hasLineDirectives("[[media_player: Song | Artist | Speaker]]")).toBe(true);
  });

  it("detects event directive", () => {
    expect(hasLineDirectives("[[event: Meeting | Jan 24 | 2pm]]")).toBe(true);
  });

  it("detects agenda directive", () => {
    expect(hasLineDirectives("[[agenda: Today | Meeting:9am, Lunch:12pm]]")).toBe(true);
  });

  it("detects device directive", () => {
    expect(hasLineDirectives("[[device: TV | Room]]")).toBe(true);
  });

  it("detects appletv_remote directive", () => {
    expect(hasLineDirectives("[[appletv_remote: Apple TV | Playing]]")).toBe(true);
  });
});

describe("parseLineDirectives", () => {
  it("strips directive from text", () => {
    const result = parseLineDirectives({
      text: "Choose one:\n[[quick_replies: Option A, Option B, Option C]]",
    });
    expect(result.text).toBe("Choose one:");
  });

  it("strips directive in middle of text", () => {
    const result = parseLineDirectives({
      text: "Before [[quick_replies: A, B]] After",
    });
    expect(result.text).toBe("Before  After");
  });

  it("strips confirm directive and leaves text empty", () => {
    const result = parseLineDirectives({
      text: "[[confirm: Delete this item? | Yes | No]]",
    });
    expect(result.text).toBeUndefined();
  });

  it("handles text with no directives unchanged", () => {
    const result = parseLineDirectives({
      text: "Just plain text here",
    });
    expect(result.text).toBe("Just plain text here");
  });

  it("preserves other payload fields", () => {
    const result = parseLineDirectives({
      text: "Hello [[quick_replies: A, B]]",
      mediaUrl: "https://example.com/image.jpg",
      replyToId: "msg123",
    });
    expect(result.text).toBe("Hello ");
    expect(result.mediaUrl).toBe("https://example.com/image.jpg");
    expect(result.replyToId).toBe("msg123");
  });

  it("collapses multiple newlines after stripping", () => {
    const result = parseLineDirectives({
      text: "Hi\n\n\n[[buttons: X | Y | Z:z]]\n\n\nDone",
    });
    expect(result.text).toBe("Hi\n\nDone");
  });
});
