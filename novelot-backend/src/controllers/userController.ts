import { Request, Response } from "express"
import userService from "@services/userService.js"
import { sendAccessToken, sendRefreshToken } from "@helpers/token.js"
import { validateEmail, validatePassword } from "@helpers/validator.js"
import { novelotError } from "@/helpers/error.js"

async function login(req: Request, res: Response) {
    const body = req.body

    validateEmail(body.email)
    validatePassword(body.password)
    const { accessToken, refreshToken } = await userService.loginUser(body.email, body.password)
    sendRefreshToken(refreshToken, res)
    sendAccessToken(accessToken, res)
}

async function register(req: Request, res: Response) {
    const body = req.body

    validateEmail(body.email)
    validatePassword(body.password)

    await userService.registerUser(body.email, body.password)
    res.status(201).json({ "message": "User Created" })
}

async function refresh(req: Request, res: Response) {
    const refreshToken = req.cookies.refreshToken

    if (!refreshToken) {
        throw new novelotError(401, "Unauthorized")
    }

    const tokens = await userService.refreshUser(refreshToken)
    sendRefreshToken(tokens.refreshToken, res)
    sendAccessToken(tokens.accessToken, res)
}

async function getMe(req: Request, res: Response) {
    if (!req.headers.authorization) {
        throw new novelotError(401, "Unauthorized")
    }
    const accessToken = req.headers.authorization

    const email = await userService.getUserEmailFromAccessToken(accessToken)

    res.status(200).json({ email })
}

export default { login, register, refresh, getMe }
