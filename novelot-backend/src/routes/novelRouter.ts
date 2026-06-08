import express from "express"
import novelController from "../controllers/novelController.js"

const novelRouter = express.Router()

novelRouter.get('/all', novelController.getAllNovels)
novelRouter.get('/search/', novelController.getNovelByName)

export default novelRouter;
