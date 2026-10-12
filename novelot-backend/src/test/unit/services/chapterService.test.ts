import { describe, it, expect, vi, beforeEach } from "vitest";
import chapterService from "@services/chapterService.ts";
import chapterModel from "@models/chapterModel.ts";
import novelModel from "@models/novelModel.ts";
import { novelotError } from "@helpers/error.ts";
import { type Chapter } from "@apptypes/Chapter.ts";

vi.mock("@models/chapterModel.ts", () => ({
    default: {
        getChapter: vi.fn()
    }
}))

vi.mock("@models/novelModel.ts", () => ({
    default: {
        getTotalChapters: vi.fn()
    }
}))

const novelId = 1
const chapterNumber = 2
const chapter: Chapter = {
    novelId,
    chapterNumber,
    title: "Chapter 2",
    content: ["First paragraph", "Second paragraph"]
}

beforeEach(() => {
    vi.clearAllMocks()
})

describe("#getChapter", () => {
    it("Returns the chapter with totalChapters", async () => {
        vi.mocked(chapterModel.getChapter).mockResolvedValue(chapter)
        vi.mocked(novelModel.getTotalChapters).mockResolvedValue(12)

        expect(await chapterService.getChapter(novelId, chapterNumber)).toEqual({ ...chapter, totalChapters: 12 })
        expect(chapterModel.getChapter).toHaveBeenCalledWith(novelId, chapterNumber)
        expect(novelModel.getTotalChapters).toHaveBeenCalledWith(novelId)
    })

    it("Propagates 404 when the chapter is missing without fetching totalChapters", async () => {
        const error = new novelotError(404, "Chapter Not Found")
        vi.mocked(chapterModel.getChapter).mockRejectedValue(error)

        await expect(chapterService.getChapter(novelId, chapterNumber)).rejects.toBe(error)
        expect(novelModel.getTotalChapters).not.toHaveBeenCalled()
    })

    it("Propagates 404 when the novel is missing", async () => {
        const error = new novelotError(404, "Novel Not Found")
        vi.mocked(chapterModel.getChapter).mockResolvedValue(chapter)
        vi.mocked(novelModel.getTotalChapters).mockRejectedValue(error)

        await expect(chapterService.getChapter(novelId, chapterNumber)).rejects.toBe(error)
    })
})
