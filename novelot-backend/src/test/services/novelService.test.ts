import { describe, it, expect, vi } from "vitest";
import novelService, { fuzzyFind } from "../../services/novelService.ts";
import novelModel from "../../models/novelModel.ts";
import novelList from "../../assets/novelList.json" with {type: 'json'}

vi.mock("../../models/novelModel.ts", () => ({
    default: {
        getAllNovels: vi.fn(),
        getNovelsWithMatchingChar: vi.fn()
    }
}))

const page = 0
const limit = 10

describe("#getAllNovels", () => {
    it("Returns All Novels", async () => {
        vi.mocked(novelModel.getAllNovels).mockResolvedValue((novelList))

        await novelService.findAllNovels(page, limit)
        expect(novelModel.getAllNovels).toHaveBeenCalledOnce()
        expect(novelModel.getAllNovels).toHaveBeenCalledWith(page, limit)
    })
})

describe("#fuzzy finder", () => {
    it("999 points when the name is an exact match", () => {
        expect(fuzzyFind("Princess Maria", "Princess Maria")).toBe(999)
    })

    it("At least 50 points when a word is an exact match", () => {
        expect(fuzzyFind("The", "The Princess is Bored")).toBeGreaterThan(50)
    })

    it("If the first letter matches, points are at least 10", () => {
        expect(fuzzyFind("T", "Though Expect")).toBeGreaterThanOrEqual(10)
        expect(fuzzyFind("Happy", "Lost Heart")).toBeGreaterThanOrEqual(10)
        expect(fuzzyFind("H", "Yah")).not.toBeGreaterThanOrEqual(10)
    })

    it("For each non-consecutive word that is not the first word get 1 point", () => {
        expect(fuzzyFind("Help", "Yhoemlqp")).toBeLessThanOrEqual(4)
        expect(fuzzyFind("Gore", "AGAOA")).toBeLessThanOrEqual(4)
        expect(fuzzyFind("abc", "rabc")).not.toBeLessThanOrEqual(3)
    })
})

