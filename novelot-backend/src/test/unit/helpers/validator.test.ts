import { novelotError } from "@helpers/error.js"
import { validateChapterRoutes, validateEmail, validatePassword } from "@helpers/validator.js"
import { describe, expect, it } from "vitest"

const emailError = new novelotError(400, "Bad Email")
const passwordError = new novelotError(400, "Bad Password")
const novelIdError = new novelotError(400, "Bad Novel Id")
const chapterNumberError = new novelotError(400, "Bad Chapter Number")
const invalidRouteNumbers = [
    { input: NaN, reason: "NaN" },
    { input: 0, reason: "Zero" },
    { input: -1, reason: "Negative" },
    { input: 1.5, reason: "Decimal" },
    { input: Infinity, reason: "Infinity" }
]
const typeTest = [
    { input: false as unknown as string, reason: "Boolean" },
    { input: 123 as unknown as string, reason: "Number" },
    { input: {} as unknown as string, reason: "Object" }
]
const invalidSpecialChars = ["!", "#", "$", "^", "&"]
const validSpecialCharsUsername = ["_", ".", "%", "+", "-"]
const invalidSpecialCharsDomain = ["_", ".", "%", "+"]


describe("#email", () => {
    it.each(typeTest)("Rejects input : $reason", ({ input }) => {
        expect(() => validateEmail((input))).toThrow(emailError)
    })
    it("Accepts valid gmail", () => {
        expect(() => validateEmail("harry@gmail.com")).not.toThrow()
    })
    it("Rejects email without domain", () => {
        expect(() => validateEmail("harry.gmail.com")).toThrow(emailError)
    })
    it("Rejects email without TLD", () => {
        expect(() => validateEmail("harry@gmailcom")).toThrow(emailError)
    })
    it.each(validSpecialCharsUsername)("Accept %s in username", (char) => {
        expect(() => validateEmail(`harry${char}@gmail.com`)).not.toThrow()
    })
    it.each(invalidSpecialChars)("Reject %s in username", (char) => {
        expect(() => validateEmail(`harry${char}@gmail.com`)).toThrow(novelotError)
    })
    it.each(invalidSpecialCharsDomain)("Reject %s in domain", (char) => {
        expect(() => validateEmail(`harry@${char}gmail.com`)).toThrow(novelotError)
    })
    it("Accepts - in domain", () => {
        expect(() => validateEmail("harry@gmail-google.com")).not.toThrow()
    })
    it.each(invalidSpecialChars)("Reject %s in TLD", (char) => {
        expect(() => validateEmail(`harry@gmail.${char}om`)).toThrow(novelotError)
    })
    it.each(validSpecialCharsUsername)("Reject %s in TLD", (char) => {
        expect(() => validateEmail(`harry@gmail.${char}om`)).toThrow(novelotError)
    })
    it("Rejects emails with empty username", () => {
        expect(() => validateEmail("@gmail.com")).toThrow(emailError)
    })
    it("Rejects emails with empty domain", () => {
        expect(() => validateEmail("harry@.com")).toThrow(emailError)
    })
    it("Rejects more than one @", () => {
        expect(() => validateEmail("harry@@gmail.com")).toThrow(emailError)
    })
    it("Rejects dot in domain", () => {
        expect(() => validateEmail("harry@g.mail.com")).toThrow(emailError)
    })
    it("Rejects dot in TLD", () => {
        expect(() => validateEmail("harry@gmail.c.om")).toThrow(emailError)
    })
    it("Rejects trailing dot", () => {
        expect(() => validateEmail("harry@gmail.com.")).toThrow(emailError)
    })
    it("Rejects empty email", () => {
        expect(() => validateEmail("")).toThrow(emailError)
    })
    it("Rejects emails that have less that two characters for TLD", () => {
        expect(() => validateEmail("harry@gmail.c")).toThrow(emailError)
    })
    it("Accepts emails that have at least two characters for TLD", () => {
        expect(() => validateEmail("harry@gmail.co")).not.toThrow()
    })
    it("Rejects emails with empty TLD", () => {
        expect(() => validateEmail("harry@gmail.")).toThrow(emailError)
    })
    it("Rejects whitespace in username", () => {
        expect(() => validateEmail("harry @gmail.com")).toThrow(emailError)
    })
    it("Rejects whitespace in domain", () => {
        expect(() => validateEmail("harry@gmail .com")).toThrow(emailError)
    })
    it("Rejects whitespace in TLD", () => {
        expect(() => validateEmail("harry@gmail. com")).toThrow(emailError)
    })
})

describe("#password", () => {
    it.each(typeTest)("Rejects input : $reason", ({ input }) => {
        expect(() => validatePassword((input))).toThrow(passwordError)
    })
    it("Rejects password if less that 8 characters", () => {
        expect(() => validatePassword("1234567")).toThrow(passwordError)
    })
    it("Accepts valid password", () => {
        expect(() => validatePassword("12345678")).not.toThrow()
    })
    it("Rejects empty password", () => {
        expect(() => validatePassword("")).toThrow(passwordError)
    })
})

describe("#chapterRoutes", () => {
    it.each(invalidRouteNumbers)("Rejects novel id : $reason", ({ input }) => {
        expect(() => validateChapterRoutes(input, 1)).toThrow(novelIdError)
    })
    it.each(invalidRouteNumbers)("Rejects chapter number : $reason", ({ input }) => {
        expect(() => validateChapterRoutes(1, input)).toThrow(chapterNumberError)
    })
    it("Accepts first chapter of first novel", () => {
        expect(() => validateChapterRoutes(1, 1)).not.toThrow()
    })
    it("Accepts larger valid numbers", () => {
        expect(() => validateChapterRoutes(42, 1500)).not.toThrow()
    })
})


