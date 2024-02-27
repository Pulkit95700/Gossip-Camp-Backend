import { Router } from "express";
import {
  createPublicRoom,
  createPrivateRoom,
  getPublicJoinedRooms,
  getPrivateJoinedRoom,
  getPublicRooms,
  toggleJoinRoom,
  getRoomDetails,
  createAdminPublicRoom,
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

router
  .route("/create-admin-public-room")
  .post(upload.single("roomDP"), auth, createAdminPublicRoom);

router.route("/:roomId/toggle-follow").post(auth, toggleJoinRoom);

router.route("/public-rooms").get(auth, getPublicJoinedRooms);

router.route("/private-room").get(auth, getPrivateJoinedRoom);

router.route("/all-rooms").get(auth, getPublicRooms);

router.route("/room-details/:roomId").get(auth, getRoomDetails);
export { router };
