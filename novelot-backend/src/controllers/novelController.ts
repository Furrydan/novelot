import { Request, Response } from "express"
import novelService from "../services/novelService.js";
import { isNovel, Novel } from "../types/Novel.js";

async function getAllNovels(req: Request, res: Response) {
  const novelList: Novel[] | undefined = await novelService.findAllNovels()

  if (novelList?.every(novel => isNovel(novel))) {
    res.json(novelList)
  }
  else {
    res.json({ "message": "Not found" })
  }
}

async function getNovelByName(req: Request, res: Response) {
  const search = req.params.name as string
  const novelListMatching: Novel[] | undefined = await novelService.getNovelByText(search)
  if (novelListMatching?.every(novel => isNovel(novel))) {
    res.json(novelListMatching)
  }
  else {
    res.status(404).json({ error: 'Not Found' })
  }
}

export default { getAllNovels, getNovelByName }
