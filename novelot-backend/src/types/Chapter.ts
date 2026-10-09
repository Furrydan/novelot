export type Chapter = {
  novelId: number;
  chapterNumber: number;
  title: string;
  content: string[];
};

export function isChapter(obj: any): obj is Chapter {
  if (obj === null || obj === undefined) {
    return false;
  }
  return (
    typeof obj.novelId === "number" &&
    typeof obj.chapterNumber === "number" &&
    typeof obj.title === "string" &&
    Array.isArray(obj.content) &&
    obj.content.every((line: unknown) => typeof line === "string")
  );
}
