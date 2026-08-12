import express from "express";
import { globalSearch } from "../controllers/searchController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/", verifyToken, globalSearch);

export default router;
