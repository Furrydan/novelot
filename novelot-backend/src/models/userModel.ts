import mongoose, { Model } from "mongoose";

export type User = {
    id: number,
    email: string,
    password: string,
    refreshToken: string
}

const userSchema = new mongoose.Schema<User>({
    id: Number,
    email: String,
    password: String,
    refreshToken: String,
})

const userModel: Model<User> = mongoose.model('Users', userSchema, "users")

function checkEmailExists(email: string) : Promise<User | null> {
   return userModel.findOne({email : email}) 
}

export default {checkEmailExists}
