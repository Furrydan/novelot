import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import mongoose from "mongoose"
import jwt from "jsonwebtoken"
import { createAccessToken, createRefreshToken, sendAccessToken, sendRefreshToken, getUserIdFromRefreshToken, hashRefreshToken, matchesRefreshToken } from "@helpers/token.ts";
import { hash } from "bcryptjs"
import { novelotError } from "@helpers/error.ts";
import { Response } from "express";
import { timingSafeEqual } from "node:crypto"

vi.mock("node:crypto", async importOriginal => {
    const crypto = await importOriginal<typeof import("node:crypto")>()
    return { ...crypto, timingSafeEqual: vi.fn(crypto.timingSafeEqual) }
})

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
        vi.useRealTimers()
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

    it("Issues distinct JWTs and UUIDs even at the same instant", () => {
        vi.useFakeTimers()
        vi.setSystemTime(new Date("2026-09-13T12:00:00Z"))

        const first = createRefreshToken(userId)
        const second = createRefreshToken(userId)
        const firstPayload = jwt.verify(first, REFRESH_TOKEN_SECRET) as jwt.JwtPayload
        const secondPayload = jwt.verify(second, REFRESH_TOKEN_SECRET) as jwt.JwtPayload

        expect(firstPayload.iat).toBe(secondPayload.iat)
        expect(firstPayload.exp).toBe(secondPayload.exp)
        const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
        expect(firstPayload.jti).toMatch(uuidPattern)
        expect(secondPayload.jti).toMatch(uuidPattern)
        expect(firstPayload.jti).not.toBe(secondPayload.jti)
        expect(first).not.toBe(second)
        expect(hashRefreshToken(first)).not.toBe(hashRefreshToken(second))
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
            { httpOnly: true, path: "/api/users/refresh" })
    })
})

describe("Get User ID From Refresh Token", () => {
    beforeEach(() => {
        vi.stubEnv("REFRESH_TOKEN_SECRET", REFRESH_TOKEN_SECRET)
    })

    afterEach(() => {
        vi.unstubAllEnvs()
    })

    it("Returns the verified userID as an ObjectId", () => {
        const id = getUserIdFromRefreshToken(createRefreshToken(userId))

        expect(id).toBeInstanceOf(mongoose.Types.ObjectId)
        expect(id.toString()).toBe(userId.toString())
    })

    it.each([
        { reason: "missing ID", payload: {} },
        { reason: "invalid ID", payload: { userID: "invalid" } },
        { reason: "non-string ID", payload: { userID: 123 } },
        { reason: "string payload", payload: "not-an-object" }
    ])("Rejects a signed token with $reason", ({ payload }) => {
        const token = jwt.sign(payload, REFRESH_TOKEN_SECRET)

        expect(() => getUserIdFromRefreshToken(token)).toThrow(expect.objectContaining({ status: 401 }))
    })

    it("Rejects a token signed with a different secret before trusting its ID", () => {
        const token = jwt.sign({ userID: userId }, "wrong-secret")

        expect(() => getUserIdFromRefreshToken(token)).toThrow(expect.objectContaining({ status: 401 }))
    })
})

describe("Refresh Token Hashing", () => {
    beforeEach(() => {
        vi.mocked(timingSafeEqual).mockClear()
    })

    it("Produces the known SHA-256 digest deterministically", () => {
        const expected = "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"

        expect(hashRefreshToken("abc")).toBe(expected)
        expect(hashRefreshToken("abc")).toBe(expected)
    })

    it("Distinguishes tokens that differ only after the first 72 characters", () => {
        const prefix = "a".repeat(72)
        const first = `${prefix}first`
        const second = `${prefix}second`

        expect(hashRefreshToken(first)).not.toBe(hashRefreshToken(second))
        expect(matchesRefreshToken(first, hashRefreshToken(second))).toBe(false)
    })

    it("Accepts a matching digest", () => {
        expect(matchesRefreshToken(mockToken, hashRefreshToken(mockToken))).toBe(true)
    })

    it("Rejects a different token's digest", () => {
        expect(matchesRefreshToken(mockToken, hashRefreshToken("different-token"))).toBe(false)
    })

    it.each(["", "too-short", "a".repeat(65), "z".repeat(64)])(
        "Safely rejects invalid stored digest %j", storedDigest => {
            expect(matchesRefreshToken(mockToken, storedDigest)).toBe(false)
        })

    it("Rejects a legacy bcrypt hash without throwing", async () => {
        const legacyHash = await hash(mockToken, 10)

        expect(matchesRefreshToken(mockToken, legacyHash)).toBe(false)
    })

    it.each([
        { reason: "matching", storedToken: mockToken, expected: true },
        { reason: "different", storedToken: "different-token", expected: false }
    ])("Uses timingSafeEqual with UTF-8 digest buffers for $reason values", ({ storedToken, expected }) => {
        const expectedDigest = hashRefreshToken(mockToken)
        const storedDigest = hashRefreshToken(storedToken)

        expect(matchesRefreshToken(mockToken, storedDigest)).toBe(expected)

        expect(timingSafeEqual).toHaveBeenCalledOnce()
        const [presented, stored] = vi.mocked(timingSafeEqual).mock.calls[0]
        expect(Buffer.isBuffer(presented)).toBe(true)
        expect(Buffer.isBuffer(stored)).toBe(true)
        expect(presented).toEqual(Buffer.from(expectedDigest, "utf8"))
        expect(stored).toEqual(Buffer.from(storedDigest, "utf8"))
    })

    it("Skips timingSafeEqual when the digest lengths differ", () => {
        expect(matchesRefreshToken(mockToken, "")).toBe(false)
        expect(matchesRefreshToken(mockToken, "a".repeat(65))).toBe(false)

        expect(timingSafeEqual).not.toHaveBeenCalled()
    })
})
