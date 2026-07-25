import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import novelController from "@controllers/novelController.js";
import novelService from "@services/novelService.js";
import novelList from "@assets/novelList.json" with {type: 'json'}
import { Response, Request } from "express";
import { type Novel } from "@apptypes/Novel.ts";

const page: number = 2
const limit: number = 10
const search: string = "test"

vi.mock("@services/novelService.ts", () => ({
    default: {
        findAllNovels: vi.fn(),
        getNovelByText: vi.fn()
    }
}))

describe("#getAllNovels", () => {
    let res: Response
    let req: Request

    beforeEach(() => {
        vi.clearAllMocks()
        res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn()
        } as unknown as Response
        req = {
            query: {
                page, limit
            }
        } as unknown as Request
    })


    vi.mocked(novelService.findAllNovels).mockResolvedValue(novelList)

    it("Returns correct response", async () => {

        await novelController.getAllNovels(req, res)

        expect(novelService.findAllNovels).toHaveBeenCalledOnce()
        expect(novelService.findAllNovels).toHaveBeenCalledWith(req.query.page, req.query.limit)
        expect(res.status).toHaveBeenCalledWith(200)
        expect(res.json).toHaveBeenCalledWith(novelList)

    })

    it("Can use default values", async () => {
        req = { query: {} } as unknown as Request
        await novelController.getAllNovels(req, res)
        expect(novelService.findAllNovels).toHaveBeenCalledWith(1, 20)
        expect(res.status).toHaveBeenCalledWith(200)
        expect(res.json).toHaveBeenCalledWith(novelList)
    })

    it("Returns empty string if database return wrong data", async () => {
        vi.mocked(novelService.findAllNovels).mockResolvedValue([{ x: "Hello" }, { x: "World" }] as unknown as Novel[])
        await novelController.getAllNovels(req, res)

        expect(res.json).toHaveBeenCalledWith([])
    })
})

describe("#getNovelByName", () => {
    let res: Response
    let req: Request

    beforeEach(() => {
        vi.clearAllMocks()
        res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn()
        } as unknown as Response
        req = {
            query: {
                search, page, limit
            }
        } as unknown as Request
    })


    vi.mocked(novelService.getNovelByText).mockResolvedValue(novelList)

    it("Returns correct response", async () => {
        await novelController.getNovelByName(req, res)

        expect(novelService.getNovelByText).toHaveBeenCalledOnce()
        expect(novelService.getNovelByText).toHaveBeenCalledWith(req.query.search,
            req.query.page,
            req.query.limit)

        expect(res.status).toHaveBeenCalledWith(200)
        expect(res.json).toHaveBeenCalledWith(novelList)
    })

    it("Can use default values", async () => {
        req = { query: { search: "lady" } } as unknown as Request

        await novelController.getNovelByName(req, res)

        expect(novelService.getNovelByText).toHaveBeenCalledWith("lady", 1, 20)
        expect(res.status).toHaveBeenCalledWith(200)
        expect(res.json).toHaveBeenCalledWith(novelList)
    })

    it("Returns empty string if database return wrong data", async () => {
        vi.mocked(novelService.getNovelByText).mockResolvedValue([{ x: "Hello" }, { x: "World" }] as unknown as Novel[])
        await novelController.getAllNovels(req, res)

        expect(res.json).toHaveBeenCalledWith([])
    })
})
