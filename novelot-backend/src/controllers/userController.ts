import { Request, Response } from "express"
import userService from "../services/userService.js"

async function login(req: Request, res: Response) {
    const body = req.body

    const loggedIn : boolean = await userService.loginUser(body.email, body.password)
    if (loggedIn) {
        res.json("Logged in Succesfully")
    }
    else {
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
