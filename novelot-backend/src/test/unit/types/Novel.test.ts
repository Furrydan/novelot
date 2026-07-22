import { isNovel } from "@apptypes/Novel.ts";
import { describe, it, expect } from "vitest";

describe("#isNovel", () => {
    const validNovel = {
        id: 1,
        title: "X",
        author: "X",
        likes: 1,
        views: 1,
        description: "XX",
        tags: ["Hi", "You"]
    }

    it("Accepts validNovel", () => {
        expect(isNovel(validNovel)).toBe(true)
    })

    it("Rejects without id", () => {
        const { id, ...rest } = validNovel
        let invalidNovel = { id: "hi", ...rest }
        expect(isNovel(rest)).toBe(false)
        expect(isNovel(invalidNovel)).toBe(false)
    })

    it("Rejects without title", () => {
        const { title, ...rest } = validNovel
        let invalidNovel = { title: 1, ...rest }
        expect(isNovel(rest)).toBe(false)
        expect(isNovel(invalidNovel)).toBe(false)
    })

    it("Rejects without author", () => {
        const { author, ...rest } = validNovel
        let invalidNovel = { author: 1, ...rest }
        expect(isNovel(rest)).toBe(false)
        expect(isNovel(invalidNovel)).toBe(false)
    })

    it("Rejects without likes", () => {
        const { likes, ...rest } = validNovel
        let invalidNovel = { likes: "hi", ...rest }
        expect(isNovel(rest)).toBe(false)
        expect(isNovel(invalidNovel)).toBe(false)
    })

    it("Rejects without views", () => {
        const { views, ...rest } = validNovel
        let invalidNovel = { views: "hi", ...rest }
        expect(isNovel(rest)).toBe(false)
        expect(isNovel(invalidNovel)).toBe(false)
    })

    it("Rejects without description", () => {
        const { description, ...rest } = validNovel
        let invalidNovel = { description: 1, ...rest }
        expect(isNovel(rest)).toBe(false)
        expect(isNovel(invalidNovel)).toBe(false)
    })

    it("Rejects without tags", () => {
        const { tags, ...rest } = validNovel
        let invalidNovel = { tags: 1, ...rest }
        let invalidNovel2 = { tags: [1, 2, 3], ...rest }
        expect(isNovel(rest)).toBe(false)
        expect(isNovel(invalidNovel)).toBe(false)
        expect(isNovel(invalidNovel2)).toBe(false)
    })
})

