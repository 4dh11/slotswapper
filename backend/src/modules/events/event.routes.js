import { Router } from "express";
import { auth } from "../../middleware/auth.js";
import * as controller from "./event.controller.js";

export const eventRouter = Router();

eventRouter.use(auth);
eventRouter.get("/", controller.listMine);
eventRouter.post("/", controller.create);
eventRouter.patch("/:id", controller.update);
eventRouter.delete("/:id", controller.remove);
