/**
 * useRegisterForm.js
 * Custom hook quản lý toàn bộ state và logic của form đăng ký.
 * Có thêm real-time validation khi blur (mất focus) cho UX tốt hơn.
 */

import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  validateRegisterForm,
  validateName,
  validateUsername,
  validateEmail,
  validatePassword,
  sanitizeInput,
  getPasswordStrength,
} from "@/utils/validators";
import { signUp } from "@/services/authService";

const INITIAL_FORM = {
  firstName: "",
  lastName:  "",
  username:  "",
  email:     "",
  password:  "",
};

const INITIAL_ERRORS = {
  firstName: "",
  lastName:  "",
  username:  "",
  email:     "",
  password:  "",
};

// Map field → hàm validate riêng cho blur validation
const FIELD_VALIDATORS = {
  firstName: (val) => validateName(val, "Họ"),
  lastName:  (val) => validateName(val, "Tên"),
  username:  validateUsername,
  email:     validateEmail,
  password:  validatePassword,
};

export function useRegisterForm() {
  const navigate = useNavigate();

  const [formData, setFormData]         = useState(INITIAL_FORM);
  const [errors, setErrors]             = useState(INITIAL_ERRORS);
  const [apiError, setApiError]         = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  // ─── HANDLERS ──────────────────────────────────────────────────────────────

  /**
   * Cập nhật field, sanitize (trừ password), xóa lỗi cũ.
   * Tính toán password strength real-time.
   */
  const handleChange = useCallback((e) => {
    const { id, value } = e.target;
    const sanitized = id === "password" ? value : sanitizeInput(value);

    setFormData((prev) => ({ ...prev, [id]: sanitized }));
    setErrors((prev) => ({ ...prev, [id]: "" }));
    setApiError("");

    if (id === "password") {
      setPasswordStrength(getPasswordStrength(sanitized));
    }
  }, []);

  /**
   * Validate field ngay khi người dùng rời khỏi input (blur).
   * Cho phép người dùng thấy lỗi sớm, không cần phải submit.
   */
  const handleBlur = useCallback((e) => {
    const { id, value } = e.target;
    const validator = FIELD_VALIDATORS[id];
    if (!validator) return;

    const sanitized = id === "password" ? value : sanitizeInput(value);
    const error = validator(sanitized);
    if (error) {
      setErrors((prev) => ({ ...prev, [id]: error }));
    }
  }, []);

  /**
   * Submit: validate tất cả → gọi API signUp → xử lý kết quả.
   * Sau khi đăng ký thành công, redirect đến trang Login sau 1.5 giây.
   */
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setApiError("");
    setSuccessMessage("");

    // 1. Validate toàn bộ form
    const { isValid, errors: validationErrors } = validateRegisterForm(formData);
    if (!isValid) {
      setErrors(validationErrors);
      return;
    }

    // 2. Gọi API
    setIsSubmitting(true);
    try {
      const result = await signUp(formData);
      setSuccessMessage(result.message || "Đăng ký thành công! Đang chuyển hướng...");
      // 3. Redirect sang Login sau 1.5 giây
      setTimeout(() => navigate("/login"), 1500);
    } catch (error) {
      setApiError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, navigate]);

  const toggleShowPassword = useCallback(() => {
    setShowPassword((prev) => !prev);
  }, []);

  // ─── RETURN ────────────────────────────────────────────────────────────────
  return {
    formData,
    errors,
    apiError,
    successMessage,
    isSubmitting,
    showPassword,
    passwordStrength,
    handleChange,
    handleBlur,
    handleSubmit,
    toggleShowPassword,
  };
}
