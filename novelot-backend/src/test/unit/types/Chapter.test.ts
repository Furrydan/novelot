import { Chapter, isChapter } from "@apptypes/Chapter.ts";
import { expect, it, describe } from "vitest";

describe("#isChapter", () => {
  const validChapter: Chapter = {
    novelId: 123,
    chapterNumber: 12,
    title: "Chapter 12",
    content: ["The world is crazy", "The world is mad"],
  };

  it("Accepts the valid chapter", () => {
    expect(isChapter(validChapter)).toBe(true);
  });

  it("Accepts empty content", () => {
    const emptyContent = { ...validChapter, content: [] };
    expect(isChapter(emptyContent)).toBe(true);
  });

  it("Rejects invalid novelId", () => {
    const { novelId: novelId, ...rest } = validChapter;
    const invalidChapter = { ...rest, novelId: "123" };

    expect(isChapter(rest)).toBe(false);
    expect(isChapter(invalidChapter)).toBe(false);
  });

  it("Rejects invalid chapterNumber", () => {
    const { chapterNumber: chapterNumber, ...rest } = validChapter;
    const invalidChapter = { ...rest, chapterNumber: "12" };

    expect(isChapter(rest)).toBe(false);
    expect(isChapter(invalidChapter)).toBe(false);
  });

  it("Rejects invalid title", () => {
    const { title, ...rest } = validChapter;
    const invalidChapter = { ...rest, title: 123 };

    expect(isChapter(rest)).toBe(false);
    expect(isChapter(invalidChapter)).toBe(false);
  });

  it("Rejects invalid content", () => {
    const { content, ...rest } = validChapter;
    const invalidChapterWrongArray = { ...rest, content: [123, 234] };
    const invalidChapterNotEach = { ...rest, content: [123, "valid"] };
    const invalidChapterNotArray = { ...rest, content: 123 };

    expect(isChapter(rest)).toBe(false);
    expect(isChapter(invalidChapterNotArray)).toBe(false);
    expect(isChapter(invalidChapterNotEach)).toBe(false);
    expect(isChapter(invalidChapterWrongArray)).toBe(false);
  });

  it.each([
    { reason: "null", value: null },
    { reason: "undefined", value: undefined },
  ])("Rejects $reason value", ({ value }) => {
    expect(isChapter(value)).toBe(false);
  });
});
