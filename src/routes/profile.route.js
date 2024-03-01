import { Router } from "express";
import auth from "../middlewares/auth.middleware.js";
import {
  getAllUserProfiles,
  getProfile,
} from "../controllers/profile.controller.js";

const router = Router();

router.use(auth);

router.route("/all-users").get(getAllUserProfiles);
router.route("/user-profile/:id").get(getProfile);

export { router };
