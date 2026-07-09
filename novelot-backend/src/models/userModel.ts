import mongoose, { Model } from "mongoose";
import { type UserInput, User } from "../types/User.js";

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
    const user: User = await userModel.findOne({ email: email })
    if (user) {
        return user
    }
    else {
        throw Error("User does not exist")
    }
}

async function addRefreshToken(email: string, refreshToken: string): Promise<boolean> {
    console.log("Updating Token")
    const newUser: User | null = await userModel.findOneAndUpdate(
        { email },
        { $set: { refreshToken } },
        { new: true })
    if (newUser) {
        console.log("Updated Token")
        return true
    }
    else {
        console.log("Failed to update token")
        return false
    }
}

async function addNewUser(email: string, password: string): Promise<UserInput> {

    const newUser: UserInput = {
        email: email,
        password: password,
        refreshToken: ""
    }

    try {
        const createdUser = await userModel.create(newUser)
        return createdUser
    }
    catch (err) {
        console.error(err)
        return newUser
    }

}

export default { checkEmailExists, addNewUser, getUser, addRefreshToken }
