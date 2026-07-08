import userModel from "../models/userModel.js";
import { User } from "../models/userModel.js";

async function checkEmail(email : string) : Promise<boolean> {
    const user : User | null = await userModel.checkEmailExists(email)
    console.log(user)
    return !!user;
}

export default {checkEmail}
