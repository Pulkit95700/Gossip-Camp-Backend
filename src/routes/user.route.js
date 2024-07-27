import { Router } from "express";
import {
  changePassword,
  loginUser,
  logoutUser,
  refreshUserToken,
  registerUser,
  createProfile,
  handleToggleFollow,
  getUserGossipsDetails,
} from "../controllers/user.controller.js";
import { registerUserValidator } from "../validators/user.validator.js";
import { validate } from "../middlewares/validate.middleware.js";
import auth from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(validate(registerUserValidator), registerUser);
router.route("/logout").post(auth, logoutUser);
router.route("/login").post(loginUser);
router.route("/change-password").post(auth, changePassword);
router.route("/create-profile").post(auth, createProfile);
router.route("/refresh").post(refreshUserToken);
// interactive route
router.route("/toggle-follow/:id").get(auth, handleToggleFollow);
router.route("/get-gossips-details/:username").get(auth, getUserGossipsDetails);
export { router };
