import { Request, Response } from "express"
import novelService from "@services/novelService.js";
import { isNovel, Novel } from "@apptypes/Novel.js";
import { novelotError } from "@/helpers/error.ts";

async function getAllNovels(req: Request, res: Response) {
    const page: number = validPage(req)
    const limit: number = validLimit(req)
    const novelList: Novel[] = await novelService.findAllNovels(page, limit)
    const validNovels: Novel[] = novelList.filter(novel => isNovel(novel))
    res.status(200).json(validNovels)
}

async function getNovelByName(req: Request, res: Response) {
    let search: string = String(req.query.search)
    if (search === 'undefined' || search === "") {
        throw new novelotError(400, "Bad Input")
    }
    const page: number = validPage(req)
    const limit: number = validLimit(req)

    const novelList: Novel[] = await novelService.getNovelByText(search, page, limit)
    const validNovels: Novel[] = novelList.filter(novel => isNovel(novel))
    res.status(200).json(validNovels)
}

export default { getAllNovels, getNovelByName }

function validPage(req: Request): number {
    if (req.query.page === undefined) {
        return 1
    }
    return Number(req.query.page)
}

function validLimit(req: Request): number {
    if (req.query.limit === undefined) {
        return 20
    }
    return Number(req.query.limit)
}
