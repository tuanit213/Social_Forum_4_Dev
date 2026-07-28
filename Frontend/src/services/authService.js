/**
 * authService.js
 * Tầng service tập trung mọi lời gọi API liên quan đến xác thực.
 * UI và hooks KHÔNG gọi axios/fetch trực tiếp — luôn đi qua service này.
 */

import axios from "axios";

// ─── AXIOS INSTANCE ────────────────────────────────────────────────────────────
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  withCredentials: true,          // Gửi httpOnly cookie (refreshToken) theo request
  timeout: 10_000,                // Timeout 10 giây
  headers: {
    "Content-Type": "application/json",
  },
});

// ─── REQUEST INTERCEPTOR ──────────────────────────────────────────────────────
// Tự động đính kèm accessToken (nếu có) vào header Authorization
api.interceptors.request.use(
  (config) => {
    // Đổi sang localStorage để giữ đăng nhập khi tắt trình duyệt / mở tab mới
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── RESPONSE INTERCEPTOR ────────────────────────────────────────────────────
// Chuẩn hóa lỗi trả về và tự động refresh token nếu accessToken hết hạn
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Tránh vòng lặp vô tận nếu chính endpoint refresh token bị lỗi 401
    if (error.response?.status === 401 && originalRequest.url === '/auth/refresh') {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("user");
      window.location.href = '/login';
      return Promise.reject(error);
    }

    // Nếu lỗi 401 (Hết hạn token) và chưa thử refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const { data } = await api.post("/auth/refresh");
        
        // Lưu token mới
        if (data.accessToken) {
          localStorage.setItem("accessToken", data.accessToken);
          if (data.user) {
            localStorage.setItem("user", JSON.stringify(data.user));
          }
        }
        
        // Gắn token mới và thực hiện lại request ban đầu
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh token cũng đã hết hạn hoặc không hợp lệ -> Đăng xuất
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    const message =
      error.response?.data?.message ||
      (error.code === "ECONNABORTED" ? "Kết nối quá thời gian, thử lại sau." : "Lỗi kết nối đến máy chủ.");
    return Promise.reject(new Error(message));
  }
);

// ─── AUTH SERVICES ─────────────────────────────────────────────────────────────

/**
 * Gọi API refresh token chủ động (thường được gọi khi trang mới load)
 */
export const refreshAuthToken = async () => {
  const { data } = await api.post("/auth/refresh");
  if (data.accessToken) {
    localStorage.setItem("accessToken", data.accessToken);
    if (data.user) {
      localStorage.setItem("user", JSON.stringify(data.user));
    }
  }
  return data;
};

/**
 * Đăng nhập tài khoản
 * @param {{ username: string, password: string }} credentials
 * @returns {{ accessToken: string, user: object }}
 */
export const signIn = async ({ username, password }) => {
  const { data } = await api.post("/auth/signin", { username, password });
  // Lưu accessToken và thông tin user vào localStorage để giữ đăng nhập
  if (data.accessToken) {
    localStorage.setItem("accessToken", data.accessToken);
    if (data.user) {
      localStorage.setItem("user", JSON.stringify(data.user));
    }
  }
  return data;
};

/**
 * Đăng ký tài khoản mới
 * @param {{ firstName: string, lastName: string, username: string, email: string, password: string }} userData
 * @returns {{ message: string }}
 */
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

/**
 * Đăng xuất - xóa cookie refreshToken phía server và xóa accessToken, user local
 */
export const signOut = async () => {
  try {
    await api.post("/auth/signout");
  } catch(e) {
    console.error("Signout API error", e);
  }
  localStorage.removeItem("accessToken");
  localStorage.removeItem("user");
};

export default api;
