import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import {
  getClearRefreshCookieOptions,
  getJwtSecret,
  getRefreshCookieOptions,
} from "../utils/securityConfig.js";

const SYSTEM_ERROR = "Lỗi hệ thống";
const INVALID_CREDENTIALS = "Username hoặc password không chính xác";
const BLOCKED_STATUSES = ["banned", "suspended"];

const blockedAccountMessage = (status) =>
  status === "banned"
    ? "Tài khoản đã bị khóa vĩnh viễn"
    : "Tài khoản đang bị tạm khóa";

const buildUserResponse = (user) => ({
  id: user._id,
  username: user.Username,
  email: user.email,
  displayName: user.displayName,
  avatarUrl: user.avatarUrl,
  role: user.role || "MEMBER",
  status: user.status || "active",
});

const signAuthTokens = (user) => {
  const tokenPayload = { userId: user._id, username: user.Username };
  const jwtSecret = getJwtSecret();

  return {
    accessToken: jwt.sign(tokenPayload, jwtSecret, { expiresIn: "15m" }),
    refreshToken: jwt.sign(tokenPayload, jwtSecret, { expiresIn: "7d" }),
  };
};

export const signUp = async (req, res) => {
  try {
    const { username, password, email, firstName, lastName } = req.body;

    const duplicateUser = await User.findOne({
      $or: [{ Username: username }, { email }],
    });

    if (duplicateUser) {
      return res.status(409).json({ message: "Username hoặc email đã tồn tại" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({
      Username: username,
      hashPassword: hashedPassword,
      email,
      displayName: `${firstName} ${lastName}`,
    });

    return res.status(201).json({ message: "Đăng ký thành công" });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ message: "Username hoặc email đã tồn tại" });
    }

    console.error("signUp error", error.name, error.message);
    return res.status(500).json({ message: SYSTEM_ERROR });
  }
};

export const signIn = async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ Username: username });
    if (!user) {
      return res.status(401).json({ message: INVALID_CREDENTIALS });
    }

    const passwordCorrect = await bcrypt.compare(password, user.hashPassword);
    if (!passwordCorrect) {
      return res.status(401).json({ message: INVALID_CREDENTIALS });
    }

    if (BLOCKED_STATUSES.includes(user.status)) {
      return res.status(403).json({ message: blockedAccountMessage(user.status) });
    }

    const { accessToken, refreshToken } = signAuthTokens(user);

    res.cookie("refreshToken", refreshToken, getRefreshCookieOptions());

    return res.status(200).json({
      message: "Đăng nhập thành công",
      accessToken,
      user: buildUserResponse(user),
    });
  } catch (error) {
    console.error("signIn error", error.name, error.message);
    return res.status(500).json({ message: SYSTEM_ERROR });
  }
};

export const refreshToken = async (req, res) => {
  try {
    const refreshTokenCookie = req.cookies.refreshToken;
    if (!refreshTokenCookie) {
      return res.status(401).json({ message: "Không tìm thấy refresh token" });
    }

    let decoded;
    try {
      decoded = jwt.verify(refreshTokenCookie, getJwtSecret());
    } catch {
      return res.status(403).json({ message: "Refresh token không hợp lệ hoặc đã hết hạn" });
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ message: "Phiên đăng nhập không hợp lệ" });
    }

    if (BLOCKED_STATUSES.includes(user.status)) {
      res.clearCookie("refreshToken", getClearRefreshCookieOptions());
      return res.status(403).json({ message: blockedAccountMessage(user.status) });
    }

    const tokenPayload = { userId: user._id, username: user.Username };
    const accessToken = jwt.sign(tokenPayload, getJwtSecret(), { expiresIn: "15m" });

    return res.status(200).json({
      accessToken,
      user: buildUserResponse(user),
    });
  } catch (error) {
    console.error("refreshToken error", error.name, error.message);
    return res.status(500).json({ message: SYSTEM_ERROR });
  }
};

export const signOut = async (req, res) => {
  try {
    res.clearCookie("refreshToken", getClearRefreshCookieOptions());
    return res.status(200).json({ message: "Đăng xuất thành công" });
  } catch (error) {
    console.error("signOut error", error.name, error.message);
    return res.status(500).json({ message: SYSTEM_ERROR });
  }
};
