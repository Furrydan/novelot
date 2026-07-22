import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import userService from "@services/userService.js"
import userModel from "@models/userModel.js"
import { novelotError } from "@helpers/error.js"
import { hash, compare } from "bcryptjs"
import mongoose from "mongoose"
import { User } from "@apptypes/User.ts"
import jwt from "jsonwebtoken"

const email = "harry@gmail.com"
const password = "password123"
const user = {
    _id: (new mongoose.Types.ObjectId),
    email: email,
    password: await hash(password, 10),
    refreshToken: ""
} as unknown as User
const accessTokenKey = "test1"
const refreshTokenKey = "test2"

vi.mock("@models/userModel.js", () => ({
    default: {
        checkEmailExists: vi.fn(),
        addNewUser: vi.fn(),
        getUser: vi.fn(),
        addRefreshToken: vi.fn()
    }
}))

beforeEach(() => {
    vi.stubEnv("ACCESS_TOKEN_SECRET", accessTokenKey)
    vi.stubEnv("REFRESH_TOKEN_SECRET", refreshTokenKey)
})
afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetAllMocks()
})

describe("# Register User", () => {
    it("Throws 409 if user already exists", async () => {
        vi.mocked(userModel.checkEmailExists).mockResolvedValue((true))

        await expect(userService.registerUser(email, password))
            .rejects.toThrow(new novelotError(409, "User already exists"))
        expect(userModel.addNewUser).not.toHaveBeenCalled()
    })

    it("Hashes the password before storing the user", async () => {
        vi.mocked(userModel.checkEmailExists).mockResolvedValue(false)

        await userService.registerUser(email, password)

        expect(userModel.checkEmailExists).toHaveBeenCalledOnce()
        expect(userModel.checkEmailExists).toHaveBeenCalledWith(email)
        expect(userModel.addNewUser).toHaveBeenCalledOnce()
        const [, storedPassword] = vi.mocked(userModel.addNewUser).mock.calls[0]
        expect(await compare(password, storedPassword)).toBe(true)
    })
})

describe("# Login User", () => {
    it("Throws 401 when user is not found", async () => {
        vi.mocked(userModel.getUser).mockRejectedValue(new novelotError(404, "Failed"))
        vi.mocked(userModel.addRefreshToken).mockResolvedValue(true)

        await expect(userService.loginUser(email, password))
            .rejects.toMatchObject({ status: 401, message: "Email or Password is incorrect" })
        await expect(userService.loginUser(email, password))
            .rejects.toBeInstanceOf(novelotError)
        expect(userModel.addRefreshToken).not.toHaveBeenCalled()
    })

    it("Returns Token upon being called", async () => {
        vi.mocked(userModel.getUser).mockResolvedValue(user)

        const { accessToken, refreshToken } = await userService.loginUser(email, password)

        expect(userModel.getUser).toHaveBeenCalledOnce()
        expect(userModel.getUser).toHaveBeenCalledWith(email)

        const decoded = jwt.verify(accessToken, accessTokenKey) as jwt.JwtPayload
        expect(decoded.userID).toBe(user._id.toString())
        expect(userModel.addRefreshToken).toHaveBeenCalledOnce()
        expect(userModel.addRefreshToken).toHaveBeenCalledWith(email, refreshToken)

    })

    it("Throws 401 if password is incorrect", async () => {
        vi.mocked(userModel.getUser).mockResolvedValue(user)
        vi.mocked(userModel.addRefreshToken).mockResolvedValue(true)

        await expect(userService.loginUser(email, "wrongPassword"))
            .rejects.toThrow(new novelotError(401, "Email or Password is incorrect"))
        expect(userModel.addRefreshToken).not.toHaveBeenCalled()
    })

    it("Returns Error if there was database failure", async () => {
        vi.mocked(userModel.getUser).mockRejectedValue(new Error("Test Error"))

        await (expect(userService.loginUser(email, password)))
            .rejects.toThrow(new Error("Test Error"))
    })
})
