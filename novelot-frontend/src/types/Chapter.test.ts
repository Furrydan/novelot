import {
  type Chapter,
  type ChapterResponse,
  isChapter,
  isChapterResponse,
} from "@novelot-types/Chapter";
import { expect, it, describe } from "vitest";

const invalidCounts = [
  { reason: "zero", value: 0 },
  { reason: "negative", value: -1 },
  { reason: "decimal", value: 1.5 },
  { reason: "NaN", value: NaN },
  { reason: "Infinity", value: Infinity },
];

const nonObjects = [
  { reason: "null", value: null },
  { reason: "undefined", value: undefined },
  { reason: "string", value: "chapter" },
  { reason: "number", value: 12 },
];

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
    const { novelId, ...rest } = validChapter;
    const invalidChapter = { ...rest, novelId: String(novelId) };

    expect(isChapter(rest)).toBe(false);
    expect(isChapter(invalidChapter)).toBe(false);
  });

  it.each(invalidCounts)("Rejects $reason novelId", ({ value }) => {
    expect(isChapter({ ...validChapter, novelId: value })).toBe(false);
  });

  it("Rejects invalid chapterNumber", () => {
    const { chapterNumber, ...rest } = validChapter;
    const invalidChapter = { ...rest, chapterNumber: String(chapterNumber) };

    expect(isChapter(rest)).toBe(false);
    expect(isChapter(invalidChapter)).toBe(false);
  });

  it.each(invalidCounts)("Rejects $reason chapterNumber", ({ value }) => {
    expect(isChapter({ ...validChapter, chapterNumber: value })).toBe(false);
  });

  it("Rejects invalid title", () => {
    const { title, ...rest } = validChapter;
    const invalidChapter = { ...rest, title: title.length };

    expect(isChapter(rest)).toBe(false);
    expect(isChapter(invalidChapter)).toBe(false);
  });

  it("Rejects invalid content", () => {
    const { content, ...rest } = validChapter;
    const invalidChapterWrongArray = { ...rest, content: [123, 234] };
    const invalidChapterNotEach = { ...rest, content: [123, content[0]] };
    const invalidChapterNotArray = { ...rest, content: 123 };

    expect(isChapter(rest)).toBe(false);
    expect(isChapter(invalidChapterNotArray)).toBe(false);
    expect(isChapter(invalidChapterNotEach)).toBe(false);
    expect(isChapter(invalidChapterWrongArray)).toBe(false);
  });

  it.each(nonObjects)("Rejects $reason value", ({ value }) => {
    expect(isChapter(value)).toBe(false);
  });
});

describe("#isChapterResponse", () => {
  const validResponse: ChapterResponse = {
    novelId: 123,
    chapterNumber: 12,
    title: "Chapter 12",
    content: ["The world is crazy", "The world is mad"],
    totalChapters: 20,
  };

  it("Accepts the valid response", () => {
    expect(isChapterResponse(validResponse)).toBe(true);
  });

  it("Rejects missing totalChapters", () => {
    const { totalChapters, ...chapter } = validResponse;
    const stringTotal = { ...chapter, totalChapters: String(totalChapters) };

    expect(isChapterResponse(chapter)).toBe(false);
    expect(isChapterResponse(stringTotal)).toBe(false);
  });

  it.each(invalidCounts)("Rejects $reason totalChapters", ({ value }) => {
    expect(isChapterResponse({ ...validResponse, totalChapters: value })).toBe(
      false,
    );
  });

  it("Rejects an invalid chapter with valid totalChapters", () => {
    expect(isChapterResponse({ ...validResponse, title: undefined })).toBe(
      false,
    );
  });

  it.each(nonObjects)("Rejects $reason value", ({ value }) => {
    expect(isChapterResponse(value)).toBe(false);
  });
});
