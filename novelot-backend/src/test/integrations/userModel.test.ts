import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest"
import mongoose from "mongoose"
import { MongoMemoryServer } from "mongodb-memory-server"
import userModel from "@models/userModel.js"
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
    await mongoose.connection.db!.collection("users").deleteMany({})
})

describe("userModel.getByID", () => {
    it("Returns the corresponding user for each ID when multiple users exist", async () => {
        const users = [
            { _id: new mongoose.Types.ObjectId(), email: "first@example.com", password: "first-hash", refreshToken: "first-token-hash" },
            { _id: new mongoose.Types.ObjectId(), email: "second@example.com", password: "second-hash", refreshToken: "second-token-hash" }
        ]
        await mongoose.connection.db!.collection("users").insertMany(users)

        for (const expectedUser of users) {
            const user = await userModel.getByID(expectedUser._id)

            expect(user._id.equals(expectedUser._id)).toBe(true)
            expect(user.toObject()).toEqual(expectedUser)
        }
    })

    it("Throws 404 for a well-formed ID with no matching user", async () => {
        await mongoose.connection.db!.collection("users").insertOne({
            _id: new mongoose.Types.ObjectId(),
            email: "existing@example.com",
            password: "password-hash",
            refreshToken: ""
        })

        const result = userModel.getByID(new mongoose.Types.ObjectId())

        await expect(result).rejects.toBeInstanceOf(novelotError)
        await expect(result).rejects.toMatchObject({ status: 404, message: "User not Found" })
    })
})
