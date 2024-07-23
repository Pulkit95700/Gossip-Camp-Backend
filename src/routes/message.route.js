import { Router } from "express";
import auth from "../middlewares/auth.middleware.js";
import {
  getRoomMessages,
  toggleLikeMessage,
  toggleGossipVoteMessage,
  sendGossipMessage,
  sendMessage,
  deleteMessage,
  votePollOption,
  getGossipMessages,
  deleteGossipMessage,
} from "../controllers/message.controller.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router.use(auth);

router.route("/:roomId/all").get(getRoomMessages);
// adding multer middleware to handle file uploads
router.route("/send-message/:roomId").post(upload.single("image"), sendMessage);
router.route("/toggle-like-message/:messageId").post(toggleLikeMessage);
router.route("/toggle-gossip-vote-message/:messageId").post(toggleGossipVoteMessage);
router.route("/delete-message/:messageId").delete(deleteMessage);
router.route("/vote-poll/:roomId/:messageId/:optionIndex").post(
  votePollOption
);
router.route("/send-gossip-message/:roomId/:messageId").post(sendGossipMessage);  
router.route("/get-gossip-messages/:roomId/:messageId").get(getGossipMessages);
router.route("/delete-gossip-message/:gossipMessageId").delete(deleteGossipMessage);

export { router };
