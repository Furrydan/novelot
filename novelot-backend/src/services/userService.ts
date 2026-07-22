import userModel from "@models/userModel.js";
import { hash, compare } from "bcryptjs"
import { createAccessToken, createRefreshToken } from "@helpers/token.js"
import { type User } from "@apptypes/User.js"
import { novelotError } from "@helpers/error.js";

type tokens = {
    accessToken: string,
    refreshToken: string
}

async function registerUser(email: string, password: string): Promise<boolean> {
    const userExists: boolean = await userModel.checkEmailExists(email)

    if (userExists) {
        throw new novelotError(409, "User already exists")
    }

    const hashedPassword: string = await hash(password, 10)

    await userModel.addNewUser(email, hashedPassword)
    return true
}

async function loginUser(email: string, password: string): Promise<tokens> {
    let user: User
    try {
        user = await userModel.getUser(email)
    }
    catch (err) {
        if (err instanceof novelotError && err.status === 404) {
            throw new novelotError(401, "Email or Password is incorrect")
        }
        throw err
    }

    const passwordIsValid: boolean = await compare(password, user.password)

    if (!passwordIsValid) {
        throw new novelotError(401, "Email or Password is incorrect")
    }


    const refreshToken: string = createRefreshToken(user._id)
    const accessToken: string = createAccessToken(user._id)

    await userModel.addRefreshToken(email, refreshToken)

    const tokens: tokens = { accessToken, refreshToken }
    return tokens
}


export default { registerUser, loginUser }
