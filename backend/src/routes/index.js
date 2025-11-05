import { Router } from "express";
import { authRouter } from "../modules/auth/auth.routes.js";
import { eventRouter } from "../modules/events/event.routes.js";
import { swapRouter } from "../modules/swaps/swap.routes.js";

export const apiRouter = Router();

apiRouter.use("/auth", authRouter);
apiRouter.use("/events", eventRouter);
apiRouter.use("/swaps", swapRouter);
