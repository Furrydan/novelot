import { describe, it, expect, vi } from "vitest";
import { fuzzyFind } from "@helpers/fuzzyFinder.ts";
import novelService from "@services/novelService.ts";
import novelModel from "@models/novelModel.ts";
import novelList from "@assets/novelList.json" with {type: 'json'}
import { type Novel, isNovel } from "@apptypes/Novel.ts";

for (let i = 0; i < novelList.length; i++) {
    if (!isNovel(novelList[i])) {
        throw Error("NovelList is incorrect")
    }
}

vi.mock("@models/novelModel.ts", () => ({
    default: {
        getAllNovels: vi.fn(),
        getNovelsWithMatchingChar: vi.fn()
    }
}))

vi.mock("@helpers/fuzzyFinder.ts", () => ({
    fuzzyFind: vi.fn()
}))

const page = 1
const limit = 10
const search = "Happy"

describe("#getAllNovels", () => {
    it("Returns All Novels", async () => {
        vi.mocked(novelModel.getAllNovels).mockResolvedValue((novelList))

        expect(await novelService.findAllNovels(page, limit)).toBe(novelList)
        expect(novelModel.getAllNovels).toHaveBeenCalledOnce()
        expect(novelModel.getAllNovels).toHaveBeenCalledWith(page, limit)
    })
})

describe("#getNovelsWithMatchingChar", () => {
    it("Calls fuzzyfinder for every novel", async () => {
        const novelList2 = novelList.slice(0, 5)
        vi.mocked(novelModel.getNovelsWithMatchingChar).mockResolvedValue(novelList2)
        vi.mocked(fuzzyFind).mockImplementation(() => Math.random() * 100)

        await novelService.getNovelByText(search, page, limit)

        expect(novelModel.getNovelsWithMatchingChar).toHaveBeenCalledOnce()
        expect(novelModel.getNovelsWithMatchingChar).toHaveBeenCalledExactlyOnceWith(search[0])
        expect(fuzzyFind).toHaveBeenCalledTimes(novelList2.length)

    })

    it("Correctly sorts novel by points", async () => {
        const novelList2 = novelList.slice(0, 5)
        let novelPoints = [
            { novel: novelList2[0], points: 9 },
            { novel: novelList2[1], points: 10 },
            { novel: novelList2[2], points: 11 },
            { novel: novelList2[3], points: 13 },
            { novel: novelList2[4], points: 15 }
        ]

        vi.mocked(novelModel.getNovelsWithMatchingChar).mockResolvedValue(novelList2)
        vi.mocked(fuzzyFind).mockImplementation((_, name) => {
            for (let i = 0; i < novelPoints.length; i++) {
                if (name === novelPoints[i].novel.title) {
                    return novelPoints[i].points
                }
            }
            return 0
        })

        const novelPointsCheck = novelPoints
            .sort((n1, n2) => n2.points - n1.points)
            .filter(n => n.points > 10)
        const novelListCheck = novelPointsCheck.map(novel => {
            if (isNovel(novel.novel)) {
                return novel.novel
            }
        })
        expect(await novelService.getNovelByText(search, page, limit)).toEqual(novelListCheck)
    })
})

