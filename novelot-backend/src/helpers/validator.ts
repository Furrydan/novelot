import { novelotError } from "./error.js"

export function validateEmail(email: string): void {
    if (typeof (email) !== "string") {
        throw new novelotError(400, "Bad Email")
    }
    const regexMail: RegExp = /^[A-Z0-9a-z._%+\-]+@[A-Z0-9a-z\-]+\.[A-Za-z]{2,}$/

    if (!email.match(regexMail)) {
        throw new novelotError(400, "Bad Email")
    }
}

export function validatePassword(password: string): void {
    if (typeof (password) !== "string" || password.length < 8) {
        throw new novelotError(400, "Bad Password")
    }
}
