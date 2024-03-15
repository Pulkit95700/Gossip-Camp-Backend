import { Router } from "express";
import auth from "../middlewares/auth.middleware.js";
import { getRoomMessages, sendMessage } from "../controllers/message.controller.js";

const router = Router();

router.use(auth);

router.route("/:roomId/all").get(getRoomMessages);
router.route("/send-message/:roomId").post(sendMessage);

export { router };
