const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET?.trim();

  if (!secret || secret === "change_me") {
    throw new Error("JWT_SECRET is missing or unsafe");
  }

  if (process.env.NODE_ENV === "production" && secret.length < 32) {
    throw new Error("JWT_SECRET must be at least 32 characters in production");
  }

  return secret;
};

export const getAllowedOrigins = () => {
  const rawOrigins = process.env.CLIENT_ORIGIN || "http://localhost:5173";

  return rawOrigins
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
};

const getRefreshCookieBaseOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  path: "/api/auth",
});

export const getRefreshCookieOptions = () => ({
  ...getRefreshCookieBaseOptions(),
  maxAge: ONE_WEEK_MS,
});

export const getClearRefreshCookieOptions = () => getRefreshCookieBaseOptions();
