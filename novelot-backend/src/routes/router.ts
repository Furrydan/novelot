import { Router } from "express";
import novelRouter from "./novelRouter.js";
import userRouter from "./userRouter.js";

const router = Router()

router.use("/novels", novelRouter)
router.use("/users", userRouter)

export default router
