import express from "express";
import { signUp, signIn, signOut, refreshToken } from "../controllers/authController.js";
import { signInSchema, signUpSchema, validateBody } from "../middlewares/validateAuthRequest.js";

const router = express.Router();

// Route Đăng ký (Sign Up)
router.post("/signup", validateBody(signUpSchema), signUp);

// Route Đăng nhập (Sign In)
router.post("/signin", validateBody(signInSchema), signIn);

// Route Đăng xuất (Sign Out)
router.post("/signout", signOut);

// Route Refresh Token
router.post("/refresh", refreshToken);

export default router;
