import { Document } from "mongoose"

export interface User extends Document {
    email: string,
    password: string,
    refreshToken: string
}

export type UserInput = {
    email: string,
    password: string,
    refreshToken: string
}

export function isUser(obj: any): obj is User {
    return (
        typeof obj.email === 'string' &&
        typeof obj.password === 'string' &&
        typeof obj.refreshToken === 'string'
    )
}

