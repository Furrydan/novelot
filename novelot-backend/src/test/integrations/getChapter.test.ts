import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from "vitest";
import request from "supertest"
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import app from "@/app.js";
import { type Chapter } from "@apptypes/Chapter.ts";

let mongoServer: MongoMemoryServer

const novels = [
    { id: 1, title: "First Novel", totalChapters: 2 },
    { id: 2, title: "Second Novel", totalChapters: 1 }
]

const chapters: Chapter[] = [
    { novelId: 1, chapterNumber: 1, title: "First Novel Chapter 1", content: ["Opening line", "Second line"] },
    { novelId: 1, chapterNumber: 2, title: "First Novel Chapter 2", content: ["Final line"] },
    { novelId: 2, chapterNumber: 1, title: "Second Novel Chapter 1", content: ["Another opening"] }
]

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create()
    await mongoose.connect(mongoServer.getUri())
})

afterAll(async () => {
    await mongoose.disconnect()
    await mongoServer.stop()
})

beforeEach(async () => {
    await mongoose.connection.db?.collection("novels").insertMany(structuredClone(novels))
    await mongoose.connection.db?.collection("chapters").insertMany(structuredClone(chapters))
})

afterEach(async () => {
    await mongoose.connection.db?.collection("novels").deleteMany({})
    await mongoose.connection.db?.collection("chapters").deleteMany({})
})

describe("GET /api/novels/:novelId/chapters/:chapterNumber", () => {

    it("Returns 200 with the chapter and totalChapters", async () => {
        const res = await request(app).get("/api/novels/1/chapters/1")

        expect(res.status).toBe(200)
        expect(res.headers['content-type']).toMatch(/json/)
        expect(res.body).toEqual({ ...chapters[0], totalChapters: 2 })
    })

    it("Returns the chapter of the requested novel when chapter numbers overlap", async () => {
        const res = await request(app).get("/api/novels/2/chapters/1")

        expect(res.status).toBe(200)
        expect(res.body).toEqual({ ...chapters[2], totalChapters: 1 })
    })

    it("Returns 200 for the last chapter", async () => {
        const res = await request(app).get("/api/novels/1/chapters/2")

        expect(res.status).toBe(200)
        expect(res.body).toEqual({ ...chapters[1], totalChapters: 2 })
    })

    it("Returns 404 for a chapter past the end", async () => {
        const res = await request(app).get("/api/novels/1/chapters/3")

        expect(res.status).toBe(404)
        expect(res.body.message).toBe("Chapter Not Found")
    })

    it("Returns 404 Chapter Not Found for an unknown novel", async () => {
        const res = await request(app).get("/api/novels/99/chapters/1")

        expect(res.status).toBe(404)
        expect(res.body.message).toBe("Chapter Not Found")
    })

    it("Returns 404 Novel Not Found for a chapter without a novel", async () => {
        await mongoose.connection.db?.collection("chapters").insertOne(
            { novelId: 3, chapterNumber: 1, title: "Orphan Chapter", content: [] }
        )

        const res = await request(app).get("/api/novels/3/chapters/1")

        expect(res.status).toBe(404)
        expect(res.body.message).toBe("Novel Not Found")
    })

    it("Returns 400 for a bad novel id", async () => {
        const res = await request(app).get("/api/novels/abc/chapters/1")

        expect(res.status).toBe(400)
        expect(res.body.message).toBe("Bad Novel Id")
    })

    it("Returns 400 for a bad chapter number", async () => {
        const res = await request(app).get("/api/novels/1/chapters/0")

        expect(res.status).toBe(400)
        expect(res.body.message).toBe("Bad Chapter Number")
    })
})
