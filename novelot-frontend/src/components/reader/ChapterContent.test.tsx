import { it, expect, describe, vi, afterEach } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import useChapter from "./logic/useChapter";
import ChapterContent from "./ChapterContent";
import userEvent from "@testing-library/user-event";

vi.mock("./logic/useChapter.ts", () => ({
  default: vi.fn(),
}));

const { navigate } = vi.hoisted(() => ({
  navigate: vi.fn(),
}));

vi.mock("react-router-dom", () => ({
  useNavigate: () => navigate,
}));

const validChapterResponse = {
  novelId: 4,
  chapterNumber: 5,
  title: "Title 1",
  content: ["Line 1", "Line 2"],
  totalChapters: 6,
};

const renderContent = () => {
  render(
    <ChapterContent
      novelId={validChapterResponse.novelId}
      chapterNumber={validChapterResponse.chapterNumber}
    />,
  );
};

describe("ChapterContent", () => {
  afterEach(() => {
    vi.clearAllMocks();
    cleanup();
  });

  it("Renders chapter contents correctly", () => {
    vi.mocked(useChapter).mockReturnValue(validChapterResponse);

    renderContent();

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

    expect(
      screen.getByText(
        `${validChapterResponse.chapterNumber} of ${validChapterResponse.totalChapters}`,
      ),
    ).toBeInTheDocument();
  });

  it("Next navigates to n + 1", async () => {
    vi.mocked(useChapter).mockReturnValue(validChapterResponse);

    renderContent();

    const user = userEvent.setup();
    const nextButton = screen.getByRole("button", { name: "Next" });
    await user.click(nextButton);
    expect(navigate).toHaveBeenCalledExactlyOnceWith("/novels/4/chapters/6");
  });

  it("Previous navigates to n - 1", async () => {
    vi.mocked(useChapter).mockReturnValue(validChapterResponse);

    renderContent();

    const user = userEvent.setup();
    const previousButton = screen.getByRole("button", { name: "Previous" });
    await user.click(previousButton);
    expect(navigate).toHaveBeenCalledExactlyOnceWith("/novels/4/chapters/4");
  });

  it("Disables next on last page", () => {
    vi.mocked(useChapter).mockReturnValue({
      ...validChapterResponse,
      chapterNumber: 6,
    });

    render(
      <ChapterContent
        novelId={validChapterResponse.novelId}
        chapterNumber={6}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Previous" }),
    ).not.toBeDisabled();
    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
  });

  it("Disables previous on first page", () => {
    vi.mocked(useChapter).mockReturnValue({
      ...validChapterResponse,
      chapterNumber: 1,
    });

    render(
      <ChapterContent
        novelId={validChapterResponse.novelId}
        chapterNumber={1}
      />,
    );

    expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Next" })).not.toBeDisabled();
  });
});
