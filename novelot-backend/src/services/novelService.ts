import novelModel from "../models/novelModel.js"
import { Novel } from "../types/Novel.js";


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
        .filter((_, index) => (page - 1) * limit <= index && (page) * limit > index)

    return matchingNovels
}

export default { findAllNovels, getNovelByText }

export function fuzzyFind(search: string, name: string): number {
    search = search.toLocaleLowerCase()
    name = name.toLocaleLowerCase()

    let match: number[][] = new Array(search.length).fill(null)
        .map(() => new Array(name.length).fill(null))

    let points: number = 0


    for (let j = 0; j < name.length; j++) {

        if (search[0] === name[j]) {
            // If at boundary grant 10 points
            if (j === 0 || name[j - 1] === " ") {
                match[0][j] = 10
            }
            else {
                match[0][j] = 1
            }
        }
    }

    points = Math.max(...match[0], points)

    for (let i = 1; i < search.length; i++) {
        for (let j = 0; j < name.length; j++) {
            if (search[i] === name[j]) {

                const max = Math.max(0,
                    ...match[i - 1].slice(0, j),
                    match[i - 1][j - 1] ? match[i - 1][j - 1] + 7 : 0)

                match[i][j] = max + 1
            }
        }
        points = Math.max(...match[i], points)
    }

    return points

}

