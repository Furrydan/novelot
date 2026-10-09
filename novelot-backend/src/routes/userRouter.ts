import express from "express";
import userController from "@controllers/userController.js";

console.log("User Router Loaded");

const userRouter = express.Router();

userRouter.post("/login", userController.login);

userRouter.post("/register", userController.register);

userRouter.post("/refresh", userController.refresh);

userRouter.get("/me", userController.getMe);

userRouter.post("/logout", userController.logout);

export default userRouter;
