import { Router } from "express";
import auth from "../middlewares/auth.middleware.js";
import { getAllUserProfiles } from "../controllers/profile.controller.js";

const router = Router();

router.use(auth);

router.get("/all-users", getAllUserProfiles);

export { router };
