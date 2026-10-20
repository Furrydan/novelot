import { it, expect, describe, vi, afterEach } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import useChapter from "./logic/useChapter";
import ChapterContent from "./ChapterContent";

vi.mock("./logic/useChapter.ts", () => ({
  default: vi.fn(),
}));

describe("ChapterContent", () => {
  afterEach(() => {
    vi.clearAllMocks();
    cleanup();
  });

  const validChapterResponse = {
    novelId: 4,
    chapterNumber: 5,
    title: "Title 1",
    content: ["Line 1", "Line 2"],
    totalChapters: 5,
  };

  it("Renders chapter contents correctly", () => {
    vi.mocked(useChapter).mockReturnValue(validChapterResponse);

    render(
      <ChapterContent
        novelId={validChapterResponse.novelId}
        chapterNumber={validChapterResponse.chapterNumber}
      />,
    );

    expect(useChapter).toHaveBeenCalledExactlyOnceWith(
      validChapterResponse.novelId,
      validChapterResponse.chapterNumber,
    );
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      validChapterResponse.title,
    );
    for (const line of validChapterResponse.content) {
      expect(screen.getByText(line)).toBeInTheDocument();
    }
  });
});
