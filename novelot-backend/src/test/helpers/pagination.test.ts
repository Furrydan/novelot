import { novelotError } from "../../helpers/error.ts";
import { paginate } from "../../helpers/pagination.ts";
import { describe, it, expect } from "vitest";

const list = new Array(101).fill(1)
const list2 = new Array(100).fill(1)
const error = new novelotError(500, "Invalid Page")

describe("#paginate", () => {
    it("Paginates list correctly", () => {
        expect(paginate(list, 1, 10).length).toBe(10)
        expect(paginate(list, 2, 10).length).toBe(10)
        expect(paginate(list, 11, 10).length).toBe(1)
        expect(paginate(list, 1, 100).length).toBe(100)
        expect(paginate(list, 1, 1).length).toBe(1)
        expect(paginate(list2, 10, 10).length).toBe(10)
    })
    it("Throws appropriate errors", () => {
        expect(() => paginate(list, 0, 10)).toThrow(error)
        expect(() => paginate(list, 12, 10)).toThrow(error)
        expect(() => paginate(list2, 11, 10)).toThrow(error)
        expect(() => paginate(list2, 1, 101)).toThrow(error)
        expect(() => paginate(list2, 11, 0)).toThrow(error)
        expect(() => paginate([], 1, 10)).toThrow(error)
    })
})
