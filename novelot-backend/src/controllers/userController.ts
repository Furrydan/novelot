import { Request, Response } from "express"
import userService from "../services/userService.js"

async function login(req: Request, res: Response) {
    const body = req.body
    const x: boolean = await userService.checkEmail(body.email)

    if (x) {
        res.json({ "message": "Exists" })
    } else {
        res.status(404).json({"message" : "User Not Found"})
    }
}

export default { login }
