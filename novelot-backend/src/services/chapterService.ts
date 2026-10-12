import chapterModel from "@models/chapterModel.js"
import novelModel from "@models/novelModel.js"
import { Chapter } from "@apptypes/Chapter.js"

async function getChapter(novelId: number, chapterNumber: number): Promise<Chapter & { totalChapters: number }> {
    const chapter: Chapter = await chapterModel.getChapter(novelId, chapterNumber)
    const totalChapters: number = await novelModel.getTotalChapters(novelId)
    return { ...chapter, totalChapters }
}

export default { getChapter }
