import { describe, it, expect, vi, beforeEach } from "vitest";
import chapterController from "@controllers/chapterController.js";
import chapterService from "@services/chapterService.js";
import { novelotError } from "@helpers/error.ts";
import { Response, Request } from "express";
import { type Chapter } from "@apptypes/Chapter.ts";

vi.mock("@services/chapterService.ts", () => ({
    default: {
        getChapter: vi.fn()
    }
}))

const chapter: Chapter & { totalChapters: number } = {
    novelId: 1,
    chapterNumber: 2,
    title: "Chapter 2",
    content: ["First paragraph", "Second paragraph"],
    totalChapters: 3
}

describe("#getChapterByNumber", () => {
    let res: Response
    let req: Request

    beforeEach(() => {
        vi.clearAllMocks()
        res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn()
        } as unknown as Response
        req = {
            params: {
                novelId: "1",
                chapterNumber: "2"
            }
        } as unknown as Request
        vi.mocked(chapterService.getChapter).mockResolvedValue(chapter)
    })

    it("Returns the chapter with totalChapters", async () => {
        await chapterController.getChapterByNumber(req, res)

        expect(chapterService.getChapter).toHaveBeenCalledOnce()
        expect(chapterService.getChapter).toHaveBeenCalledWith(1, 2)
        expect(res.status).toHaveBeenCalledWith(200)
        expect(res.json).toHaveBeenCalledWith(chapter)
    })

    it("Rejects a bad novel id without calling the service", async () => {
        req.params.novelId = "abc"

        await expect(chapterController.getChapterByNumber(req, res))
            .rejects.toMatchObject({ status: 400, message: "Bad Novel Id" })
        expect(chapterService.getChapter).not.toHaveBeenCalled()
        expect(res.status).not.toHaveBeenCalled()
    })

    it("Rejects a bad chapter number without calling the service", async () => {
        req.params.chapterNumber = "0"

        await expect(chapterController.getChapterByNumber(req, res))
            .rejects.toMatchObject({ status: 400, message: "Bad Chapter Number" })
        expect(chapterService.getChapter).not.toHaveBeenCalled()
        expect(res.status).not.toHaveBeenCalled()
    })

    it("Propagates service errors without responding", async () => {
        const error = new novelotError(404, "Chapter Not Found")
        vi.mocked(chapterService.getChapter).mockRejectedValue(error)

        await expect(chapterController.getChapterByNumber(req, res)).rejects.toBe(error)
        expect(res.status).not.toHaveBeenCalled()
        expect(res.json).not.toHaveBeenCalled()
    })
})
