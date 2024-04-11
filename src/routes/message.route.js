import { Router } from "express";
import auth from "../middlewares/auth.middleware.js";
import {
  getRoomMessages,
  toggleLikeMessage,
  sendMessage,
  deleteMessage,
  votePollOption,
} from "../controllers/message.controller.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router.use(auth);

router.route("/:roomId/all").get(getRoomMessages);
// adding multer middleware to handle file uploads
router.route("/send-message/:roomId").post(upload.single("image"), sendMessage);
router.route("/toggle-like-message/:messageId").post(toggleLikeMessage);
router.route("/delete-message/:messageId").delete(deleteMessage);
router.route("/vote-poll/:roomId/:messageId/:optionIndex").post(votePollOption);

export { router };
