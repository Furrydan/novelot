import jwt from "jsonwebtoken"
import { Response } from "express"
import mongoose from "mongoose"

export function createAccessToken(userID: mongoose.Types.ObjectId) {
    const secret = process.env.ACCESS_TOKEN_SECRET
    console.log(secret)
    if (!secret) {
        throw new Error("Access Token Secret Key is not defined")
    }
    return jwt.sign({ userID }, secret, {
        expiresIn: '15m'
    })
}

export function createRefreshToken(userID: mongoose.Types.ObjectId) {
    const secret = process.env.REFRESH_TOKEN_SECRET
    if (!secret) {
        throw new Error("Refresh Token Secret Key is not defined")
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
