/**
 * useLoginForm.js
 * Custom hook quản lý toàn bộ state và logic của form đăng nhập.
 * Login.jsx chỉ cần gọi hook này và trải props ra UI — không chứa bất kỳ logic nào.
 */

import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { validateLoginForm, sanitizeInput } from "@/utils/validators";
import { signIn } from "@/services/authService";

const INITIAL_FORM = {
  username: "",
  password: "",
};

const INITIAL_ERRORS = {
  username: "",
  password: "",
};

export function useLoginForm() {
  const navigate = useNavigate();

  const [formData, setFormData]       = useState(INITIAL_FORM);
  const [errors, setErrors]           = useState(INITIAL_ERRORS);
  const [apiError, setApiError]       = useState("");   // Lỗi từ server
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // ─── HANDLERS ──────────────────────────────────────────────────────────────

  /**
   * Cập nhật giá trị field khi người dùng gõ.
   * - Sanitize input ngay lập tức (loại bỏ ký tự nguy hiểm)
   * - Xóa lỗi của field đó và lỗi API để UX sạch hơn
   */
  const handleChange = useCallback((e) => {
    const { id, value } = e.target;
    // Password không sanitize để không cắt ký tự đặc biệt hợp lệ
    const sanitized = id === "password" ? value : sanitizeInput(value);

    setFormData((prev) => ({ ...prev, [id]: sanitized }));
    setErrors((prev) => ({ ...prev, [id]: "" }));
    setApiError("");
  }, []);

  /**
   * Submit form: validate → gọi API → xử lý kết quả
   */
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setApiError("");

    // 1. Validate phía client
    const { isValid, errors: validationErrors } = validateLoginForm(formData);
    if (!isValid) {
      setErrors(validationErrors);
      return;
    }

    // 2. Gọi API
    setIsSubmitting(true);
    try {
      await signIn({
        username: formData.username,
        password: formData.password,
      });
      // 3. Thành công → điều hướng đến trang chính
      navigate("/");
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
    isSubmitting,
    showPassword,
    handleChange,
    handleSubmit,
    toggleShowPassword,
  };
}
