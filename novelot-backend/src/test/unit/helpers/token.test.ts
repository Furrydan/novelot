import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import mongoose from "mongoose"
import jwt from "jsonwebtoken"
import { createAccessToken, createRefreshToken, sendAccessToken, sendRefreshToken } from "@helpers/token.ts";
import { novelotError } from "@helpers/error.ts";
import { Response } from "express";

const falseTypes = [
    { input: "test" as unknown as mongoose.Types.ObjectId, reason: "Rejects String" },
    { input: 123 as unknown as mongoose.Types.ObjectId, reason: "Rejects Number" },
    { input: {} as unknown as mongoose.Types.ObjectId, reason: "Rejects Objects" }]
const mockToken = "testJWT"

const userId: mongoose.Types.ObjectId = new mongoose.Types.ObjectId()
const ACCESS_TOKEN_SECRET: string = "password123"
const REFRESH_TOKEN_SECRET: string = "password123"
const expiryTimeAccess: number = 15 * 60
const expiryTimeRefresh: number = 7 * 24 * 60 * 60

describe("Access Token Creation", () => {
    beforeEach(() => {
        vi.stubEnv("ACCESS_TOKEN_SECRET", ACCESS_TOKEN_SECRET)
    })
    afterEach(() => {
        vi.unstubAllEnvs()
    })
    it("Rejects when there is no environment variable", () => {
        vi.unstubAllEnvs()
        expect(() => createAccessToken(userId))
            .toThrow(new novelotError(500, "Access Token Secret Key is not defined"))
    })


    it.each(falseTypes)("$reason", ({ input }) => {
        expect(() => createAccessToken(input)).toThrow(new novelotError(500, "Bad UserID"))
    })

    it("Returns signed token", () => {
        const token = createAccessToken(userId)
        const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET) as jwt.JwtPayload
        expect(decoded.userID).toBe(userId.toString())
        expect(decoded.exp! - decoded.iat!).toBe(expiryTimeAccess)
    })

})

describe("Refresh Token Creation", () => {
    beforeEach(() => {
        vi.stubEnv("REFRESH_TOKEN_SECRET", REFRESH_TOKEN_SECRET)
    })
    afterEach(() => {
        vi.unstubAllEnvs()
    })
    it("Rejects when there is no environment variable", () => {
        vi.unstubAllEnvs()
        expect(() => createRefreshToken(userId))
            .toThrow(new novelotError(500, "Refresh Token Secret Key is not defined"))

    })


    it.each(falseTypes)("$reason", ({ input }) => {
        expect(() => createRefreshToken(input)).toThrow(new novelotError(500, "Bad UserID"))
    })

    it("Returns signed token", () => {
        const token = createRefreshToken(userId)
        const decoded = jwt.verify(token, REFRESH_TOKEN_SECRET) as jwt.JwtPayload
        expect(decoded.userID).toBe(userId.toString())
        expect(decoded.exp! - decoded.iat!).toBe(expiryTimeRefresh)
    })

})

describe("Send Access Token", () => {
    it("Calls res.send", () => {
        const res = { send: vi.fn() } as unknown as Response

        sendAccessToken(mockToken, res)
        expect(res.send).toHaveBeenCalledOnce()
        expect(res.send).toHaveBeenCalledWith({ accessToken: mockToken })
    })
})

describe("Send Refresh Token", () => {
    it("calls res.cookie", () => {
        const res = { cookie: vi.fn() } as unknown as Response

        sendRefreshToken(mockToken, res)
        expect(res.cookie).toHaveBeenCalledOnce()
        expect(res.cookie).toHaveBeenCalledWith("refreshToken",
            mockToken,
            { httpOnly: true, path: "/refresh_token" })
    })
})
