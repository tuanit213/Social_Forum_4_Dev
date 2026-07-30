import express from "express";
import {
  getMyDashboardProfile,
  getMyProfile,
  updateMyDashboardProfile,
} from "../controllers/userController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";
import { validateDashboardProfile } from "../middlewares/validateUserRequest.js";

const router = express.Router();

router.get("/profile", verifyToken, getMyProfile);
router.get("/me/dashboard", verifyToken, getMyDashboardProfile);
router.put("/me/dashboard", verifyToken, validateDashboardProfile, updateMyDashboardProfile);

export default router;
