import { isUser } from "../../types/User.ts";
import { describe, it, expect } from "vitest";

describe("#isUser", () => {
    const validUser = {
        email: "test@email.com",
        password: "1234",
        refreshToken: "myToken"
    }

    it("Accepts validUser", () => {
        expect(isUser(validUser)).toBe(true)
    })

    it("Rejects invalid email", () => {
        const { email, ...rest } = validUser
        const invalidUser = { email: 1, ...rest }
        expect(isUser(rest)).toBe(false)
        expect(isUser(invalidUser)).toBe(false)
    })

    it("Rejects invalid password", () => {
        const { password, ...rest } = validUser
        const invalidUser = { password: true, ...rest }
        expect(isUser(rest)).toBe(false)
        expect(isUser(invalidUser)).toBe(false)
    })

    it("Rejects invalid refresh token", () => {
        const { refreshToken, ...rest } = validUser
        const invalidUser = { refreshToken: [1, 2], ...rest }
        expect(isUser(rest)).toBe(false)
        expect(isUser(invalidUser)).toBe(false)
    })
})
