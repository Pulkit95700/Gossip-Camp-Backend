import { Router } from "express";
import auth from "../middlewares/auth.middleware.js";
import { getRoomMessages } from "../controllers/message.controller.js";

const router = Router();

router.use(auth);

router.route("/:roomId/all").get(getRoomMessages);

export { router };
