import { Router } from "express";
import {
  createPublicRoom,
  createPrivateRoom,
  getPublicJoinedRooms,
  getPrivateJoinedRoom,
  toggleJoinRoom,
} from "../controllers/room.controller.js";
import auth from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router
  .route("/create-private-room")
  .post(upload.single("roomDP"), createPrivateRoom);

router
  .route("/create-public-room")
  .post(auth, upload.single("roomDP"), createPublicRoom);

router.route("/:roomId/toggle-follow").post(auth, toggleJoinRoom);

router.route("/public-rooms").get(auth, getPublicJoinedRooms);

router.route("/private-room").get(auth, getPrivateJoinedRoom);

export { router };
