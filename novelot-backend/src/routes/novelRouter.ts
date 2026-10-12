import express from "express"
import novelController from "@controllers/novelController.js"
import chapterController from "@controllers/chapterController.js"

console.log("NovelRouter loaded")

const novelRouter = express.Router()

novelRouter.get('/all', novelController.getAllNovels)
novelRouter.get('/search/', novelController.getNovelByName)
novelRouter.get('/:novelId/chapters/:chapterNumber', chapterController.getChapterByNumber)

export default novelRouter;
