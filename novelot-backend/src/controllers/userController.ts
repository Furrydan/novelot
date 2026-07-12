import { Request, Response } from "express"
import userService from "../services/userService.js"
import { sendAccessToken, sendRefreshToken } from "../helpers/token.js"
import { novelotError } from "../helpers/error.js"
import { validateEmail, validatePassword } from "../helpers/validator.js"

async function login(req: Request, res: Response) {
    const body = req.body

    if (!validateEmail(res, body.email)) {
        return
    }
    if (!validatePassword(res, body.password)) {
        return
    }

    try {
        const { accessToken, refreshToken } = await userService.loginUser(body.email, body.password)
        sendAccessToken(accessToken, res)
        sendRefreshToken(refreshToken, res)
    }
    catch (err) {
        if (err instanceof novelotError) {
            res.status(err.status).json({ "message": `${err.message}` })
        }
        else {
            res.status(500).json({ "message": "Failed to login" })
        }
    }
}

async function register(req: Request, res: Response) {
    const body = req.body

    if (!validateEmail(res, body.email)) {
        return
    }
    if (!validatePassword(res, body.password)) {
        return
    }


    try {
        await userService.registerUser(body.email, body.password)
        res.status(201).json({ "message": "User Created" })
    }
    catch (err) {
        if (err instanceof novelotError) {
            res.status(err.status).json({ "message": `${err.message}` })
        }
        else {
            res.status(500).json({ "message": "Internal Server Error" })
        }
    }
}

export default { login, register }
