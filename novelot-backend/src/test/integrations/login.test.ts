import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import mongoose from "mongoose"
import { MongoMemoryServer } from "mongodb-memory-server"
import { hash } from "bcryptjs"
import app from "@/app.js"

let mongoServer: MongoMemoryServer

beforeAll(async () => {
    process.env.ACCESS_TOKEN_SECRET = "test-access-secret"
    process.env.REFRESH_TOKEN_SECRET = "test-refres-secret"

    mongoServer = await MongoMemoryServer.create()
    await mongoose.connect(mongoServer.getUri())
})

afterAll(async () => {
    await mongoose.disconnect()
    await mongoServer.stop()
})

beforeEach(async () => {
    await mongoose.connection.db?.collection("users").deleteMany({})
})

describe("POST /api/users/login", () => {
    it("returns an access token and sets a refresh token cookie for valid credentials", async () => {
        const hashedPassword = await hash("correct-password", 10)
        await mongoose.connection.db?.collection("users").insertOne({
            email: "test@example.com",
            password: hashedPassword,
            refreshToken: ""
        })

        const res = await request(app)
            .post("/api/users/login")
            .send({ email: "test@example.com", password: "correct-password" })

        expect(res.status).toBe(200)

        const setCookieHeader = res.headers["set-cookie"][0]
        const cookieRefreshToken = setCookieHeader.split(";")[0].split("=")[1]

        const rawUser = await mongoose.connection.db?.collection("users").findOne({ email: "test@example.com" })

        expect(rawUser?.refreshToken).toBe(cookieRefreshToken)

        expect(res.body.accessToken).toEqual(expect.any(String))
        expect(res.headers["set-cookie"][0]).toMatch(/refreshToken=/)
    })
})
