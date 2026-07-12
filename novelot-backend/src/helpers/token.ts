import jwt from "jsonwebtoken"
import { Response } from "express"
import mongoose from "mongoose"
import { novelotError } from "./error.ts"

export function createAccessToken(userID: mongoose.Types.ObjectId) {
    const secret = process.env.ACCESS_TOKEN_SECRET
    if (!secret) {
        throw new novelotError(500, "Access Token Secret Key is not defined")
    }
    return jwt.sign({ userID }, secret, {
        expiresIn: '15m'
    })
}

export function createRefreshToken(userID: mongoose.Types.ObjectId) {
    const secret = process.env.REFRESH_TOKEN_SECRET
    if (!secret) {
        throw new novelotError(500, "Refresh Token Secret Key is not defined")
    }
    return jwt.sign({ userID }, secret, {
        expiresIn: '7d'
    })
}

export function sendAccessToken(accessToken: string, res: Response): void {
    res.send({ accessToken })
}

export function sendRefreshToken(refreshToken: string, res: Response): void {
    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        path: "/refresh_token"
    })
}
