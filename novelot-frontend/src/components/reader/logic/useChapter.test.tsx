import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, cleanup, renderHook, screen } from "@testing-library/react";
import { Suspense, type ReactNode } from "react";
import type { AxiosResponse } from "axios";
import { api } from "@api/novelClients";
import type { ChapterResponse } from "@novelot-types/Chapter";

vi.mock("@api/novelClients", () => ({
  api: {
    get: vi.fn(),
  },
}));

let useChapter: typeof import("./useChapter").default;

type Params = { novelId: number; chapterNumber: number };

function chapterFor(novelId: number, chapterNumber: number): ChapterResponse {
  return {
    novelId,
    chapterNumber,
    title: `Chapter ${chapterNumber}`,
    content: ["The world is crazy", "The world is mad"],
    totalChapters: 10,
  };
}

function wrapper({ children }: { children: ReactNode }) {
  return <Suspense fallback={<p>Loading</p>}>{children}</Suspense>;
}

async function renderUseChapter(novelId: number, chapterNumber: number) {
  let hook!: ReturnType<typeof renderHook<ChapterResponse, Params>>;
  await act(async () => {
    hook = renderHook(
      ({ novelId, chapterNumber }) => useChapter(novelId, chapterNumber),
      { wrapper, initialProps: { novelId, chapterNumber } },
    );
  });
  return hook;
}

describe("useChapter", () => {
  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();
    useChapter = (await import("./useChapter")).default;
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("Shows the fallback while the request is pending", async () => {
    let resolve!: (response: AxiosResponse) => void;
    vi.mocked(api.get).mockReturnValue(
      new Promise<AxiosResponse>((done) => {
        resolve = done;
      }),
    );

    const { result } = await renderUseChapter(1, 1);
    expect(screen.getByText("Loading")).toBeInTheDocument();

    await act(async () => {
      resolve({ data: chapterFor(1, 1) } as AxiosResponse);
    });

    expect(screen.queryByText("Loading")).not.toBeInTheDocument();
    expect(result.current).toEqual(chapterFor(1, 1));
  });

  it("Returns the chapter on success", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: chapterFor(1, 2) });

    const { result } = await renderUseChapter(1, 2);

    expect(result.current).toEqual(chapterFor(1, 2));
  });

  it("Requests the chapter route for the given params", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: chapterFor(2, 3) });

    await renderUseChapter(2, 3);

    expect(api.get).toHaveBeenCalledWith("/2/chapters/3");
  });

  it("Throws when the request fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(api.get).mockRejectedValue(
      new Error("Request failed with status code 404"),
    );

    await expect(renderUseChapter(1, 1)).rejects.toThrow(
      "Request failed with status code 404",
    );
  });

  it("Throws when the response is invalid", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(api.get).mockResolvedValue({ data: { title: "Chapter 1" } });

    await expect(renderUseChapter(1, 1)).rejects.toThrow(
      "Invalid chapter response",
    );
  });

  it.each([
    [NaN, 2],
    [12, NaN],
  ])(
    "Throws without requesting when params are (%s, %s)",
    async (novelId, chapterNumber) => {
      vi.spyOn(console, "error").mockImplementation(() => {});

      await expect(renderUseChapter(novelId, chapterNumber)).rejects.toThrow(
        "Invalid chapter params",
      );
      expect(api.get).not.toHaveBeenCalled();
    },
  );

  it("Fetches the new chapter when the params change", async () => {
    vi.mocked(api.get)
      .mockResolvedValueOnce({ data: chapterFor(1, 1) })
      .mockResolvedValueOnce({ data: chapterFor(1, 2) });

    const { result, rerender } = await renderUseChapter(1, 1);
    expect(result.current).toEqual(chapterFor(1, 1));

    await act(async () => {
      rerender({ novelId: 1, chapterNumber: 2 });
    });

    expect(api.get).toHaveBeenLastCalledWith("/1/chapters/2");
    expect(result.current).toEqual(chapterFor(1, 2));
  });

  it("Reuses a loaded chapter without requesting it again", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: chapterFor(1, 1) });

    const first = await renderUseChapter(1, 1);
    first.unmount();
    const { result } = await renderUseChapter(1, 1);

    expect(api.get).toHaveBeenCalledTimes(1);
    expect(result.current).toEqual(chapterFor(1, 1));
  });
});
