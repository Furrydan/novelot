import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest"
import mongoose from "mongoose"
import { MongoMemoryServer } from "mongodb-memory-server"
import novelModel from "@models/novelModel.js"
import { novelotError } from "@helpers/error.js"

let mongoServer: MongoMemoryServer

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create()
    await mongoose.connect(mongoServer.getUri())
})

afterAll(async () => {
    try {
        await mongoose.disconnect()
    } finally {
        await mongoServer?.stop()
    }
})

beforeEach(async () => {
    await mongoose.connection.db!.collection("novels").deleteMany({})
})

describe("novelModel.getTotalChapters", () => {
    it("Returns the stored totalChapters of the matching novel", async () => {
        await mongoose.connection.db!.collection("novels").insertMany([
            { id: 1, title: "First", totalChapters: 12 },
            { id: 2, title: "Second", totalChapters: 36 }
        ])

        expect(await novelModel.getTotalChapters(1)).toBe(12)
        expect(await novelModel.getTotalChapters(2)).toBe(36)
    })

    it("Returns 0 for a novel without chapters", async () => {
        await mongoose.connection.db!.collection("novels").insertOne({ id: 1, title: "Empty", totalChapters: 0 })

        expect(await novelModel.getTotalChapters(1)).toBe(0)
    })

    it("Throws 404 when no novel matches the id", async () => {
        await mongoose.connection.db!.collection("novels").insertOne({ id: 1, title: "First", totalChapters: 12 })

        const result = novelModel.getTotalChapters(2)

        await expect(result).rejects.toBeInstanceOf(novelotError)
        await expect(result).rejects.toMatchObject({ status: 404, message: "Novel Not Found" })
    })
})
