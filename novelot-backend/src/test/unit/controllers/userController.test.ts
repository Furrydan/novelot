import { describe, it, expect, vi, beforeEach } from "vitest";
import { Response, Request } from "express";
import userController from "@controllers/userController.js";
import userService from "@services/userService.js";
import { sendAccessToken, sendRefreshToken } from "@helpers/token.ts";
import { validateEmail, validatePassword } from "@helpers/validator.ts";

vi.mock("@services/userService.ts", () => ({
    default: {
        loginUser: vi.fn(),
        registerUser: vi.fn()
    }
}))

vi.mock("@helpers/token.ts", () => ({
    sendAccessToken: vi.fn(),
    sendRefreshToken: vi.fn()
}))

vi.mock("@helpers/validator.ts", () => ({
    validateEmail: vi.fn(),
    validatePassword: vi.fn()
}))

describe("#login", () => {
    let req: Request
    let res: Response
    const accessToken = "TestAToken"
    const refreshToken = "TestRToken"

    vi.mocked(userService.loginUser).mockResolvedValue({ accessToken, refreshToken })

    beforeEach(() => {
        vi.clearAllMocks()

        req = {
            body: {
                email: "TestEmail",
                password: "TestPassword"
            }
        } as unknown as Request

        res = {} as unknown as Response
    })

    it("Validates email and password, calls userService and sends tokens", async () => {
        await userController.login(req, res)
        expect(validateEmail).toHaveBeenCalledExactlyOnceWith(req.body.email)

        expect(validatePassword).toHaveBeenCalledExactlyOnceWith(req.body.password)

        expect(userService.loginUser).toHaveBeenCalledExactlyOnceWith(req.body.email, req.body.password)

        expect(sendAccessToken).toHaveBeenCalledExactlyOnceWith(accessToken, res)

        expect(sendRefreshToken).toHaveBeenCalledExactlyOnceWith(refreshToken, res)

    })
})

describe("#register", () => {
    let req: Request
    let res: Response

    beforeEach(() => {
        vi.clearAllMocks()

        req = {
            body: {
                email: "TestEmail",
                password: "TestPassword"
            }
        } as unknown as Request

        res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn()
        } as unknown as Response
    })

    it("Validates email and password, calls userService and sends positive response", async () => {
        await userController.register(req, res)

        expect(validateEmail).toHaveBeenCalledExactlyOnceWith(req.body.email)

        expect(validatePassword).toHaveBeenCalledExactlyOnceWith(req.body.password)

        expect(userService.registerUser).toHaveBeenCalledExactlyOnceWith(req.body.email, req.body.password)

        expect(res.status).toHaveBeenCalledExactlyOnceWith(201)

        expect(res.json).toHaveBeenCalledExactlyOnceWith({ "message": "User Created" })
    })

})
