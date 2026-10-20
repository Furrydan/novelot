import { render, screen, act, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import Reader from "./Reader";
import { use } from "react";

function renderAt(url: string) {
  render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route
          path="/novels/:novelId/chapters/:chapterNumber"
          element={<Reader />}
        />
      </Routes>
    </MemoryRouter>,
  );
}

function deferredPromise() {
  let resolve!: (value: string) => void;
  const promise = new Promise<string>((done) => {
    resolve = done;
  });

  return { promise, resolve };
}

let pending = deferredPromise();

vi.mock("./ChapterContent", () => ({
  default: ({
    novelId,
    chapterNumber,
  }: {
    novelId: number;
    chapterNumber: number;
  }) => {
    //eslint-disable-next-line react-hooks/rules-of-hooks
    const text = use(pending.promise);
    return (
      <p>{`novelId : ${novelId}, chapterNumber : ${chapterNumber}, text : ${text}`}</p>
    );
  },
}));

describe("Reader", () => {
  afterEach(() => {
    pending = deferredPromise();
    vi.restoreAllMocks();
    cleanup();
  });

  it("Displays suspense and correct value upon resolve", async () => {
    await act(async () => renderAt("/novels/12/chapters/2"));
    expect(screen.getByText("Loading...")).toBeInTheDocument();

    await act(async () => {
      pending.resolve("Chapter Content");
    });

    expect(
      screen.getByText(
        "novelId : 12, chapterNumber : 2, text : Chapter Content",
      ),
    ).toBeInTheDocument();
  });

  it("Displays the error message when the chapter fails to load", async () => {
    pending.promise = Promise.reject(new Error("Network Error"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    await act(async () => renderAt("/novels/12/chapters/2"));

    expect(
      screen.getByText("Could not load this chapter."),
    ).toBeInTheDocument();
  });
});
