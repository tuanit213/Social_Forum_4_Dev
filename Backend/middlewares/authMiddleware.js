import jwt from "jsonwebtoken";
import { getJwtSecret } from "../utils/securityConfig.js";
import User from "../models/User.js";

const BLOCKED_STATUSES = ["banned", "suspended"];

const blockedAccountMessage = (status) =>
  status === "banned"
    ? "Tài khoản đã bị khóa vĩnh viễn"
    : "Tài khoản đang bị tạm khóa";

export const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "Không tìm thấy access token, vui lòng đăng nhập",
    });
  }

  const token = authHeader.split(" ")[1];

  let jwtSecret;
  try {
    jwtSecret = getJwtSecret();
  } catch (error) {
    console.error("JWT config error", error.message);
    return res.status(500).json({
      message: "Cấu hình bảo mật token chưa hợp lệ",
    });
  }

  try {
    const decoded = jwt.verify(token, jwtSecret);
    const currentUser = await User.findById(decoded.userId).select(
      "Username displayName email avatarUrl role status",
    );

    if (!currentUser) {
      return res.status(401).json({ message: "Phiên đăng nhập không hợp lệ" });
    }

    if (BLOCKED_STATUSES.includes(currentUser.status)) {
      return res.status(403).json({ message: blockedAccountMessage(currentUser.status) });
    }

    req.user = decoded;
    req.currentUser = currentUser;
    next();
  } catch (error) {
    const message =
      error.name === "JsonWebTokenError" || error.name === "TokenExpiredError"
        ? "Token không hợp lệ hoặc đã hết hạn"
        : "Lỗi hệ thống";
    return res.status(error.name === "JsonWebTokenError" || error.name === "TokenExpiredError" ? 403 : 500).json({
      message,
    });
  }
};

export const requireAdmin = async (req, res, next) => {
  try {
    const currentUser = req.currentUser || await User.findById(req.user?.userId).select(
      "Username displayName email avatarUrl role status",
    );

    if (!currentUser) {
      return res.status(401).json({ message: "Phiên đăng nhập không hợp lệ" });
    }

    const role = currentUser.role || "MEMBER";
    if (!["ADMIN", "SUPER_ADMIN"].includes(role)) {
      return res.status(403).json({ message: "Bạn không có quyền truy cập khu vực admin" });
    }

    req.currentUser = currentUser;
    next();
  } catch (error) {
    console.error("requireAdmin error", error.name, error.message);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const requireAuthIntent = (req, res, next) => {
  if (req.get("X-CSRF-Intent") !== "auth") {
    return res.status(403).json({ message: "Thiếu auth intent header" });
  }

  const origin = req.get("Origin");
  if (origin) {
    const allowedOrigins = (process.env.CLIENT_ORIGIN || "http://localhost:5173")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);
    if (!allowedOrigins.includes(origin)) {
      return res.status(403).json({ message: "Origin không được phép" });
    }
  }

  next();
};
