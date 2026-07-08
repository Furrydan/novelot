import express from "express"
import userController from "../controllers/userController.js"

console.log("User Router Loaded")

const userRouter = express.Router()

userRouter.post('', userController.login)

export default userRouter;

