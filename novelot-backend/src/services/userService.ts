import userModel from "../models/userModel.js";
import { hash, compare } from "bcryptjs"
import { createAccessToken, createRefreshToken } from "../helpers/token.js"
import { type User } from "../types/User.js"

type tokens = {
    accessToken: string,
    refreshToken: string
}

async function checkEmail(email: string): Promise<boolean> {
    return await userModel.checkEmailExists(email)

}

async function registerUser(email: string, password: string): Promise<boolean> {
    const userExists: boolean = await userModel.checkEmailExists(email)
    if (userExists) {
        throw new Error("User already exists")
    }

    const hashedPassword: string = await hash(password, 10)
    console.log(hashedPassword)

    try {
        await userModel.addNewUser(email, hashedPassword)
        return true
    }
    catch (err) {
        console.error(err)
        return false
    }
}

async function loginUser(email: string, password: string): Promise<tokens> {
    const userExists: boolean = await userModel.checkEmailExists(email)

    if (!userExists) {
        throw new Error("User Does Not Exist")
    }

    const user: User = await userModel.getUser(email)
    const valid: boolean = await compare(password, user.password)
    if (!valid) {
        throw new Error("Password is incorrect")
    }

    console.log("Ready to create tokens")
    const accessToken: string = createAccessToken(user._id)
    console.log("Created AT")
    const refreshToken: string = createRefreshToken(user._id)
    console.log("Created RT")

    console.log("Callingaddtoken function")


    const addedTokenToDB: boolean = await userModel.addRefreshToken(email, refreshToken)

    if (!addedTokenToDB) {
        throw new Error("Failed to update DB")
    }

    const tokens: tokens = { accessToken, refreshToken }
    return tokens
}


export default { checkEmail, registerUser, loginUser }
