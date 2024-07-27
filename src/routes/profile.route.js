import { Router } from "express";
import auth from "../middlewares/auth.middleware.js";
import {
  getAllUserProfiles,
  getProfile,
  getUserFollowersDetails,
  getUserGossipsDetails,
  getUserRoomDetails,
  getUserFollowingDetails
} from "../controllers/profile.controller.js";

const router = Router();

router.use(auth);

router.route("/all-users").get(getAllUserProfiles);
router.route("/user-profile/:username").get(getProfile);
router.route("/get-gossips-details/:username").get(getUserGossipsDetails);
router.route("/get-user-rooms-details/:username").get(getUserRoomDetails);
router.route("/get-user-followers-details/:username").get(getUserFollowersDetails);
router.route("/get-user-following-details/:username").get(getUserFollowingDetails);

export { router };
