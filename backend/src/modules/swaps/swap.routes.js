import { Router } from "express";
import { auth } from "../../middleware/auth.js";
import * as controller from "./swap.controller.js";

export const swapRouter = Router();

swapRouter.use(auth);
swapRouter.get("/swappable-slots", controller.listOthersSwappable);
swapRouter.post("/swap-request", controller.requestSwap);
swapRouter.post("/swap-response/:requestId", controller.respondSwap);
swapRouter.get("/requests", controller.getRequests);
