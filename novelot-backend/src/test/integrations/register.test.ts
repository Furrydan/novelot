import { describe, it, beforeAll, afterAll, expect, assert, beforeEach } from "vitest";
import mongoose from "mongoose"
import app from "@/app.ts";
import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest"
import { hash, compare } from "bcryptjs";

let mongoServer: MongoMemoryServer

beforeAll(async () => {
    process.env.ACCESS_TOKEN_SECRET = "my-access-key"
    process.env.REFRESH_TOKEN_SECRET = "my-refresh-key"

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

describe("GET /api/users/register", () => {
    it("Return 201 and adds user to database", async () => {
        const email = "test@example.com"
        const password = "my-password"

        const res = await request(app)
            .post("/api/users/register")
            .send({ email, password })

        expect(res.status).toBe(201)
        expect(res.body.message).toBe("User Created")

        const registeredUser = await mongoose.connection.db?.collection("users").findOne({ email: email })

        assert(registeredUser)
        expect(registeredUser.email).toBe(email)
        expect(await compare(password, registeredUser.password)).toBe(true)
        expect(registeredUser.refreshToken).toBe("")

    })

    it("Returns 409 when user already exists", async () => {
        const email = "test@example.com"
        const password = "my-password"
        const hashedPassword = await hash(password, 10)

        await mongoose.connection.db?.collection("users").insertOne({ email, password: hashedPassword, refreshToken: "" })

        const res = await request(app)
            .post("/api/users/register")
            .send({ email, password })

        expect(res.status).toBe(409)
        expect(res.body.message).toBe("User already exists")

        const users = await mongoose.connection.db?.collection("users").find({ email }).toArray()

        assert(users)
        expect(users).toHaveLength(1)
        expect(users[0].email).toBe(email)

    })
})
