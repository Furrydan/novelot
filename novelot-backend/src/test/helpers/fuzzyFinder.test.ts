import { describe, it, expect } from "vitest"
import { fuzzyFind } from "../../helpers/fuzzyFinder.ts"

describe("#fuzzy finder", () => {
    it("If the first letter matches, points are at least 10", () => {
        expect(fuzzyFind("T", "Though Expect")).toBeGreaterThanOrEqual(10)
        expect(fuzzyFind("Happy", "Lost Heart")).toBeGreaterThanOrEqual(10)
        expect(fuzzyFind("H", "Yah")).not.toBeGreaterThanOrEqual(10)
    })

    it("For each non-consecutive letter that is not the first word get 1 point", () => {
        expect(fuzzyFind("Help", "Yhoemlqp")).toBeLessThanOrEqual(4)
        expect(fuzzyFind("Gore", "AGAOA")).toBeLessThanOrEqual(4)
        expect(fuzzyFind("abc", "rabc")).not.toBeLessThanOrEqual(3)
    })

    it("For each consecutive letter, add 7 points instead of 1", () => {
        expect(fuzzyFind("abc", "axbabc")).toBeGreaterThanOrEqual(15)
        expect(fuzzyFind("yellow", "carmellow")).toBeGreaterThanOrEqual(29)
    })
})

