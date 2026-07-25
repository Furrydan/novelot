import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest"
import mongoose from "mongoose";
import app from "@/app.ts";
import novelList from "@assets/novelList.json" with {type: 'json'}

let mongoServer: MongoMemoryServer
const novels = novelList.slice(0, 10)

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create()
    await mongoose.connect(mongoServer.getUri())
})

afterAll(async () => {
    await mongoose.disconnect()
    await mongoServer.stop()
})

afterEach(async () => {
    await mongoose.connection.db?.collection("novels").deleteMany({})
})

describe("GET /api/novels/search", () => {
    it("Returns exact result first", async () => {
        await mongoose.connection.db?.collection("novels").insertMany(structuredClone(novels))

        const search = "lady"
        const page = 1
        const limit = 5

        const res = await request(app)
            .get("/api/novels/search/")
            .query({ search, page, limit })

        expect(res.status).toBe(200)
        const { _id: _, ...rest } = res.body[0]
        expect(rest).toEqual(novels[4])
    })

    it("Returns 500 when page is 0", async () => {
        await mongoose.connection.db?.collection("novels").insertMany(structuredClone(novels))

        const search = "lady"

        const res = await request(app)
            .get("/api/novels/search/")
            .query({ search, page: 0, limit: 5 })

        expect(res.status).toBe(400)
        expect(res.body.message).toBe("Invalid Page")
    })

    it("Returns 500 when limit is 0", async () => {
        await mongoose.connection.db?.collection("novels").insertMany(structuredClone(novels))
        const search = "lady"

        const res = await request(app)
            .get("/api/novels/search/")
            .query({ search, page: 1, limit: 0 })

        expect(res.status).toBe(400)
        expect(res.body.message).toBe("Invalid Page")
    })

    it("Returns 400 when search is empty", async () => {
        await mongoose.connection.db?.collection("novels").insertMany(structuredClone(novels))

        const search = ""
        const page = 1
        const limit = 5

        const res = await request(app)
            .get("/api/novels/search/")
            .query({ search, page, limit })

        expect(res.status).toBe(400)
        expect(res.body.message).toBe("Bad Input")

    })

    it("Returns 400 when search is not a string", async () => {
        await mongoose.connection.db?.collection("novels").insertMany(structuredClone(novels))

        const page = 1
        const limit = 5

        const res = await request(app)
            .get("/api/novels/search/")
            .query({ page, limit })

        expect(res.status).toBe(400)
        expect(res.body.message).toBe("Bad Input")

    })

})
