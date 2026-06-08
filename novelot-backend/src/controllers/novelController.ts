import { Request, Response } from "express"
import novelService from "../services/novelService.js";
import { isNovel, Novel } from "../types/Novel.js";

async function getAllNovels(req: Request, res: Response) {
  const page: number = Number(req.query.page) || 1
  const limit: number = Number(req.query.limit) || 20
  const novelList: Novel[] | undefined = await novelService.findAllNovels(page, limit)

  if (novelList?.every(novel => isNovel(novel))) {
    res.json(novelList)
  }
  else {
    res.json({ "message": "Not found" })
  }
}

async function getNovelByName(req: Request, res: Response) {
  const search: string = String(req.query.search) || ""
  const page: number = Number(req.query.page) || 1
  const limit: number = Number(req.query.limit) || 20
  const novelListMatching: Novel[] | undefined = await novelService.getNovelByText(search, page, limit)
  if (novelListMatching?.every(novel => isNovel(novel))) {
    res.json(novelListMatching)
  }
  else {
    res.status(404).json({ error: 'Not Found' })
  }
}

export default { getAllNovels, getNovelByName }
