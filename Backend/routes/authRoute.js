import express from "express";
import { signUp, signIn, signOut, refreshToken } from "../controllers/authController.js";
import { signInSchema, signUpSchema, validateBody } from "../middlewares/validateAuthRequest.js";
import { requireAuthIntent } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Route Đăng ký (Sign Up)
router.post("/signup", validateBody(signUpSchema), signUp);

// Route Đăng nhập (Sign In)
router.post("/signin", validateBody(signInSchema), signIn);

// Route Đăng xuất (Sign Out)
router.post("/signout", requireAuthIntent, signOut);

// Route Refresh Token
router.post("/refresh", requireAuthIntent, refreshToken);

export default router;
