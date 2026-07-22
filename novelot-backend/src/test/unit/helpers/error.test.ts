import { describe, it, expect, vi, afterEach, beforeEach } from "vitest"
import { novelotError, errorHandler } from "@helpers/error.ts"
import { Request, Response, NextFunction } from "express"

describe("#Error Handler", () => {
    let consoleErrorSpy: ReturnType<typeof vi.spyOn>
    beforeEach(() => {
        consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => { })
    })
    afterEach(() => {
        vi.restoreAllMocks()
    })


    const errList = [
        { error: new novelotError(500, "Test Error"), reason: "Error 500" },
        { error: new novelotError(501, "Test Error"), reason: "Error 501" },
        { error: new Error("Test Error"), reason: "Not a Novelot Error" },
    ]

    const req = {} as unknown as Request
    const next = {} as unknown as NextFunction

    it("Error 499", () => {
        const err = new novelotError(499, "Test Error")
        const res = {
            status: vi.fn().mockReturnThis()
            , json: vi.fn()
        } as unknown as Response

        errorHandler(err, req, res, next)
        expect(res.status).toHaveBeenCalledOnce()
        expect(res.status).toHaveBeenCalledWith(err.status)
        expect(res.json).toHaveBeenCalledOnce()
        expect(res.json).toHaveBeenCalledWith({ message: err.message })
        expect(consoleErrorSpy).not.toHaveBeenCalled()
    })

    it.each(errList)("$reason", ({ error }) => {
        const res = {
            status: vi.fn().mockReturnThis()
            , json: vi.fn()
        } as unknown as Response
        errorHandler(error, req, res, next)
        expect(res.status).toHaveBeenCalledOnce()
        expect(res.status).toHaveBeenCalledWith(500)
        expect(res.json).toHaveBeenCalledOnce()
        expect(res.json).toHaveBeenCalledWith({ message: "Internal Server Error" })
        expect(consoleErrorSpy).toHaveBeenCalledExactlyOnceWith(error)
    })
})
