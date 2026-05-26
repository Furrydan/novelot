import { Router } from "express";
import novelRouter from "./novelRouter.js";

const router = Router()

router.use("/novels", novelRouter)

export default router
