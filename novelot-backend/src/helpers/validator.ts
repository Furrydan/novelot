import { Response } from "express"

export function validateEmail(res: Response, email: string): boolean {
    if (typeof (email) !== "string") {
        res.status(400).json({ "message": "Bad Email" })
        return false
    }
    return true
}

export function validatePassword(res: Response, password: string): boolean {
    if (typeof (password) !== "string") {
        res.status(400).json({ "message": "Bad Password" })
        return false
    }
    return true
}
