import jwt from "jsonwebtoken";
import { getJwtSecret } from "../utils/securityConfig.js";

export const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "Khong tim thay access token, vui long dang nhap",
    });
  }

  const token = authHeader.split(" ")[1];

  let jwtSecret;
  try {
    jwtSecret = getJwtSecret();
  } catch (error) {
    console.error("JWT config error", error.message);
    return res.status(500).json({
      message: "Cau hinh bao mat token chua hop le",
    });
  }

  jwt.verify(token, jwtSecret, (err, decoded) => {
    if (err) {
      return res.status(403).json({
        message: "Token khong hop le hoac da het han",
      });
    }

    req.user = decoded;
    next();
  });
};
