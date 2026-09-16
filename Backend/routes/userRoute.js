import express from "express";
import {
  getMyDashboardProfile,
  getMyProfile,
  updateMyDashboardProfile,
  getUserProfile,
  toggleFollowUser,
} from "../controllers/userController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";
import { validateDashboardProfile } from "../middlewares/validateUserRequest.js";
import { validateObjectId } from "../middlewares/validateResource.js";

const router = express.Router();

router.get("/profile", verifyToken, getMyProfile);
router.get("/me/dashboard", verifyToken, getMyDashboardProfile);
router.put("/me/dashboard", verifyToken, validateDashboardProfile, updateMyDashboardProfile);

router.get("/profile/:username", verifyToken, getUserProfile);
router.put("/profile/:username/follow", verifyToken, toggleFollowUser);

import { getAllUsers, toggleBlockUser } from "../controllers/userController.js";
router.get("/", verifyToken, getAllUsers);
router.put("/:id/block", verifyToken, validateObjectId("id"), toggleBlockUser);

export default router;
