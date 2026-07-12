import { Request, Response } from "express"
import novelService from "../services/novelService.js";
import { isNovel, Novel } from "../types/Novel.js";

async function getAllNovels(req: Request, res: Response) {
    const page: number = Number(req.query.page) || 1
    const limit: number = Number(req.query.limit) || 20
    try {
        const novelList: Novel[] = await novelService.findAllNovels(page, limit)
        const validNovels: Novel[] = novelList.filter(novel => isNovel(novel))
        res.status(200).json(validNovels)
    }
    catch (err) {
        res.status(500).json({ "message": "Internal Server Error" })
    }
}

async function getNovelByName(req: Request, res: Response) {
    const search: string = String(req.query.search) || ""
    const page: number = Number(req.query.page) || 1
    const limit: number = Number(req.query.limit) || 20

    try {
        const novelList: Novel[] = await novelService.getNovelByText(search, page, limit)
        const validNovels: Novel[] = novelList.filter(novel => isNovel(novel))
        res.status(200).json(validNovels)
    }
    catch (err) {
        res.status(500).json({ "message": 'Internal Server Error' })
    }
}

export default { getAllNovels, getNovelByName }
