import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import request from "supertest"
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose, { mongo } from "mongoose";
import novelList from "@assets/novelList.json" with {type: 'json'}
import app from "@/app.js";

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

describe("GET /app/novels/all", () => {

    it("Return 200 along with all novels", async () => {
        await mongoose.connection.db?.collection("novels").insertMany(structuredClone(novels))
        const res = await request(app)
            .get("/api/novels/all")
            .query({ page: 1, limit: 10 })

        expect(res.status).toBe(200)
        expect(res.headers['content-type']).toMatch(/json/)
        expect(res.body.map(({ _id, ...rest }: any) => rest)).toEqual(novels)
    })

    it("Returns 200 along with novels in limit", async () => {
        await mongoose.connection.db?.collection("novels").insertMany(structuredClone(novels))

        const res = await request(app)
            .get("/api/novels/all")
            .query({ page: 1, limit: 5 })

        expect(res.status).toBe(200)
        expect(res.headers['content-type']).toMatch(/json/)
        expect(res.body.map(({ _id, ...rest }: any) => rest)).toEqual(novels.slice(0, 5))
    })

    it("Returns 500 when page is 0", async () => {
        await mongoose.connection.db?.collection("novels").insertMany(structuredClone(novels))

        const res = await request(app)
            .get("/api/novels/all")
            .query({ page: 0, limit: 5 })

        expect(res.status).toBe(400)
        expect(res.body.message).toBe("Invalid Page")
    })

    it("Returns 500 when limit is 0", async () => {
        await mongoose.connection.db?.collection("novels").insertMany(structuredClone(novels))

        const res = await request(app)
            .get("/api/novels/all")
            .query({ page: 1, limit: 0 })

        expect(res.status).toBe(400)
        expect(res.body.message).toBe("Invalid Page")
    })
})
