import { novelotError } from "../../helpers/error.js"
import { validateEmail, validatePassword } from "../../helpers/validator.js"
import { describe, expect, it } from "vitest"

const emailError = new novelotError(400, "Bad Email")
const passwordError = new novelotError(400, "Bad Password")

describe("#email", () => {
    it("Rejects email if boolean", () => {
        expect(() => validateEmail(false as unknown as string)).toThrow(emailError)
    })
    it("Rejects email if number", () => {
        expect(() => validateEmail(123 as unknown as string)).toThrow(emailError)
    })
    it("Rejects email if object", () => {
        expect(() => validateEmail({} as unknown as string)).toThrow(emailError)
    })
    it("Accepts valid gmail", () => {
        expect(() => validateEmail("harry@gmail.com")).not.toThrow()
    })
    it("Rejects email without @", () => {
        expect(() => validateEmail("harry.gmail.com")).toThrow(emailError)
    })
    it("Rejects email without the dot after @", () => {
        expect(() => validateEmail("harry@gmail*com")).toThrow(emailError)
    })
    it("Accepts Special characters", () => {
        expect(() => validateEmail("AZaz09._%+-@AZaz09-.AZaz")).not.toThrow()
    })
    it("Rejects emails that are empty before @", () => {
        expect(() => validateEmail("@gmail.com")).toThrow(emailError)
    })
    it("Rejects emails that are empty between @ and dot", () => {
        expect(() => validateEmail("harry@.com")).toThrow(emailError)
    })
    it("Rejects double @", () => {
        expect(() => validateEmail("harry@@gmail.com")).toThrow(emailError)
    })
    it("Rejects dot between @ and dot", () => {
        expect(() => validateEmail("harry@g.mail.com")).toThrow(emailError)
    })
    it("Rejects emails that have less that two characters at the end", () => {
        expect(() => validateEmail("harry@gmail.c")).toThrow(emailError)
    })
})

describe("#password", () => {
    it("Rejects password if boolean", () => {
        expect(() => validatePassword(false as unknown as string)).toThrow(passwordError)
    })
    it("Rejects password if number", () => {
        expect(() => validatePassword(123 as unknown as string)).toThrow(passwordError)
    })
    it("Rejects password if object", () => {
        expect(() => validatePassword({} as unknown as string)).toThrow(passwordError)
    })
    it("Rejects password if less that 8 characters", () => {
        expect(() => validatePassword("123456")).toThrow(passwordError)
    })
    it("Accepts valid password", () => {
        expect(() => validatePassword("password123")).not.toThrow()
    })
})


