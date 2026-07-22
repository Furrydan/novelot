import { Request, Response } from "express"
import userService from "@services/userService.js"
import { sendAccessToken, sendRefreshToken } from "@helpers/token.js"
import { validateEmail, validatePassword } from "@helpers/validator.js"

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

export default { login, register }
