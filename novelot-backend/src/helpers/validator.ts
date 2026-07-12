import { novelotError } from "./error.js"

export function validateEmail(email: string): void {
    if (typeof (email) !== "string") {
        throw new novelotError(400, "Bad Email")
    }
    const regexMail: RegExp = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/g

    if (!email.match(regexMail)) {
        throw new novelotError(400, "Bad Email")
    }
}

export function validatePassword(password: string): void {
    if (typeof (password) !== "string") {
        throw new novelotError(400, "Bad Password")
    }
}
