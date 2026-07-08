import { log } from "node:console";
import userModel from "../models/userModel.js";

async function checkEmail(email: string): Promise<boolean> {
    return await userModel.checkEmailExists(email)

}

async function registerUser(email: string, password: string): Promise<boolean> {
    const userExists : boolean = await userModel.checkEmailExists(email)
    if (userExists) {
        throw new Error("User already exists")
    }

    try {
        await userModel.addNewUser(email, password)
        return true
    }
    catch (err) {
        console.error(err)
        return false
    }
}

async function loginUser(email : string, password : string) : Promise<boolean> {
    const userExists : boolean = await userModel.checkEmailExists(email)
    
    if (!userExists) {
        return false
    }
    
    const userPassword = await userModel.getUserPassword(email)
    if (userPassword === password){
        return true
    }
    return false
}


export default { checkEmail, registerUser, loginUser }
