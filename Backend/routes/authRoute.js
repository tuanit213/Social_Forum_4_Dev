import express from "express";
import { signUp, signIn, signOut, refreshToken } from "../controllers/authController.js";

const router = express.Router();

// Route Đăng ký (Sign Up)
router.post("/signup", signUp);

// Route Đăng nhập (Sign In)
router.post("/signin", signIn);

// Route Đăng xuất (Sign Out)
router.post("/signout", signOut);

// Route Refresh Token
router.post("/refresh", refreshToken);

export default router;