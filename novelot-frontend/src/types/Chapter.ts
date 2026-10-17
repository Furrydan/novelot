export type Chapter = {
  novelId: number;
  chapterNumber: number;
  title: string;
  content: string[];
};

export type ChapterResponse = Chapter & { totalChapters: number };

function isPositiveInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 1;
}

export function isChapter(obj: unknown): obj is Chapter {
  if (typeof obj !== "object" || obj === null) {
    return false;
  }
  const chapter = obj as Record<string, unknown>;
  return (
    isPositiveInteger(chapter.novelId) &&
    isPositiveInteger(chapter.chapterNumber) &&
    typeof chapter.title === "string" &&
    Array.isArray(chapter.content) &&
    chapter.content.every((line: unknown) => typeof line === "string")
  );
}

export function isChapterResponse(obj: unknown): obj is ChapterResponse {
  return (
    isChapter(obj) &&
    "totalChapters" in obj &&
    isPositiveInteger(obj.totalChapters)
  );
}
