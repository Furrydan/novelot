import novelModel from "@models/novelModel.js"
import { fuzzyFind } from "@helpers/fuzzyFinder.ts";
import { Novel } from "@apptypes/Novel.js";
import { paginate } from "@helpers/pagination.ts";


async function findAllNovels(page: number, limit: number): Promise<Novel[]> {
    const novelList: Novel[] = await novelModel.getAllNovels(page, limit)
    return novelList
}
async function getNovelByText(search: string, page: number, limit: number): Promise<Novel[]> {
    const novelList: Novel[] = await novelModel.getNovelsWithMatchingChar(search[0])
    const matchingNovels: Novel[] = novelList.map(novel => ({ novel: novel, points: fuzzyFind(search, novel.title) }))
        .filter(novel => novel.points > 10)
        .sort((novel1, novel2) => novel2.points - novel1.points)
        .map(item => item.novel)

    return paginate(matchingNovels, page, limit)
}

export default { findAllNovels, getNovelByText }
