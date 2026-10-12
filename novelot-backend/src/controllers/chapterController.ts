import { Request, Response } from "express"
import chapterService from "@services/chapterService.js";
import { validateChapterRoutes } from "@helpers/validator.js";

async function getChapterByNumber(req: Request, res: Response) {
    const novelId: number = Number(req.params.novelId)
    const chapterNumber: number = Number(req.params.chapterNumber)
    validateChapterRoutes(novelId, chapterNumber)

    const chapter = await chapterService.getChapter(novelId, chapterNumber)
    res.status(200).json(chapter)
}

export default { getChapterByNumber }
