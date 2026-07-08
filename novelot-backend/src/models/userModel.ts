import mongoose, { Model } from "mongoose";

export type User = {
    email: string,
    password: string,
    refreshToken: string
}

const userSchema = new mongoose.Schema<User>({
    email: String,
    password: String,
    refreshToken: String,
})

export function isUser(obj: any): obj is User {
    return (
        typeof obj.email === 'string' &&
        typeof obj.password === 'string' &&
        typeof obj.refreshToken === 'string'
    )
}


const userModel: Model<User> = mongoose.model('Users', userSchema, "users")

async function checkEmailExists(email: string): Promise<boolean> {
    const user = await userModel.findOne({email : email})
    if (user) {
    return true
    }
    else {
        return false
    }
}

async function getUserPassword(email : string) : Promise<string> {
    const user = await userModel.findOne({ email : email })
    if (user) {
        return user.password
    }
    else {
        throw Error("User does not exist")
    }
}

async function addNewUser(email: string, password: string): Promise<User> {

    const newUser: User = {
        email: email,
        password: password,
        refreshToken: ""
    }

    try{
        const createdUser = await userModel.create(newUser)
        return createdUser
    }
    catch(err) {
        console.error(err)
        return newUser
    }

}

export default { checkEmailExists, addNewUser, getUserPassword }
