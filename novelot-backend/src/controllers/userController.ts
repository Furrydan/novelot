import { Request, Response } from "express"
import userService from "../services/userService.js"
import { sendAccessToken, sendRefreshToken } from "../helpers/token.js"

async function login(req: Request, res: Response) {
    const body = req.body

    try {
        const { accessToken, refreshToken } = await userService.loginUser(body.email, body.password)
        sendAccessToken(accessToken, res)
        sendRefreshToken(refreshToken, res)
    }
    catch {
        res.status(404).json("Failed to login")
    }
}

async function register(req: Request, res: Response) {
    const body = req.body

    try {

        await userService.registerUser(body.email, body.password)
        res.json({ "message": "User Created" })
    }
    catch (err) {
        res.status(404).json({ "message": "User Was Not Created" })
    }
}

export default { login, register }
