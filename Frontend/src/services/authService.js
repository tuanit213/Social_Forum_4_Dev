import axios from "axios";

let accessToken = null;
const USER_STORAGE_KEY = "user";
const LEGACY_TOKEN_KEY = "accessToken";

export const getAccessToken = () => accessToken;

export const getStoredUser = () => {
  const userData = localStorage.getItem(USER_STORAGE_KEY);
  if (!userData) return null;

  try {
    return JSON.parse(userData);
  } catch {
    localStorage.removeItem(USER_STORAGE_KEY);
    return null;
  }
};

export const clearAuthState = () => {
  accessToken = null;
  localStorage.removeItem(USER_STORAGE_KEY);
  localStorage.removeItem(LEGACY_TOKEN_KEY);
};

const saveAuthState = ({ accessToken: token, user }) => {
  if (token) {
    accessToken = token;
  }

  if (user) {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  }

  localStorage.removeItem(LEGACY_TOKEN_KEY);
};

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  withCredentials: true,
  timeout: 10_000,
  headers: {
    "Content-Type": "application/json",
  },
});

const authIntentConfig = { headers: { "X-CSRF-Intent": "auth" } };

api.interceptors.request.use(
  (config) => {
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isAdminRequest = originalRequest?.url?.startsWith("/admin");

    if (error.response?.status === 401 && originalRequest?.url === "/auth/refresh") {
      clearAuthState();
      window.location.href = "/login";
      return Promise.reject(error);
    }

    if (error.response?.status === 403 && isAdminRequest) {
      const message = error.response?.data?.message || "Bạn không có quyền truy cập khu vực admin.";
      const adminError = new Error(message);
      adminError.status = 403;
      return Promise.reject(adminError);
    }

    if (error.response?.status === 403) {
      clearAuthState();
      window.location.href = "/login";
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const { data } = await api.post("/auth/refresh", undefined, authIntentConfig);
        saveAuthState(data);

        if (data.accessToken) {
          originalRequest.headers = originalRequest.headers || {};
          originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        }

        return api(originalRequest);
      } catch (refreshError) {
        clearAuthState();
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    const message =
      error.response?.data?.message ||
      (error.code === "ECONNABORTED"
        ? "Kết nối quá thời gian, thử lại sau."
        : "Lỗi kết nối đến máy chủ.");

    const normalizedError = new Error(message);
    normalizedError.status = error.response?.status;
    return Promise.reject(normalizedError);
  },
);

export const refreshAuthToken = async () => {
  const { data } = await api.post("/auth/refresh", undefined, authIntentConfig);
  saveAuthState(data);
  return data;
};

export const signIn = async ({ email, password }) => {
  const { data } = await api.post("/auth/signin", { email, password });
  saveAuthState(data);
  return data;
};

export const signUp = async ({ firstName, lastName, username, email, password }) => {
  const { data } = await api.post("/auth/signup", {
    firstName,
    lastName,
    username,
    email,
    password,
  });

  return data;
};

export const signOut = async () => {
  try {
    await api.post("/auth/signout", undefined, authIntentConfig);
  } catch (error) {
    console.error("Signout API error", error);
  } finally {
    clearAuthState();
  }
};

export default api;
