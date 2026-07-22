import mongoose, { Model } from "mongoose";
import { type UserInput, User } from "@apptypes/User.js";
import { novelotError } from "@helpers/error.js"

const userSchema = new mongoose.Schema<User>({
    email: String,
    password: String,
    refreshToken: String,
})

const userModel: Model<User> = mongoose.model('Users', userSchema, "users")

async function checkEmailExists(email: string): Promise<boolean> {
    const user = await userModel.findOne({ email: email })
    if (user) {
        return true
    }
    else {
        return false
    }
}

async function getUser(email: string): Promise<User> {
    const user: User | null = await userModel.findOne({ email: email })
    if (!user) {
        throw new novelotError(404, "User not Found")
    }
    return user
}

async function addRefreshToken(email: string, refreshToken: string): Promise<boolean> {
    const newUser: User | null = await userModel.findOneAndUpdate(
        { email },
        { $set: { refreshToken } },
        { new: true })
    if (!newUser) {
        throw new novelotError(500, "Failed to Update Refresh Token")
    }
    return true
}

async function addNewUser(email: string, password: string): Promise<UserInput> {

    const newUser: UserInput = {
        email: email,
        password: password,
        refreshToken: ""
    }

    const createdUser = await userModel.create(newUser)
    return createdUser

}

export default { checkEmailExists, addNewUser, getUser, addRefreshToken }
