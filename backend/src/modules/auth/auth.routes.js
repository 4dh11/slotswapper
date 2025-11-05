import { Router } from "express";
import * as controller from "./auth.controller.js";

export const authRouter = Router();

authRouter.post("/signup", controller.signup);
authRouter.post("/login", controller.login);
