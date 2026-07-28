/**
 * validators.js
 * Tập trung toàn bộ logic validation và sanitization input.
 * Client-side protection - KHÔNG thay thế server-side validation.
 */

// ─── SANITIZE ──────────────────────────────────────────────────────────────────
/**
 * Loại bỏ các ký tự nguy hiểm để phòng XSS & SQL Injection phía client.
 * Backend vẫn phải dùng parameterized queries làm lớp bảo vệ thực sự.
 */
export const sanitizeInput = (value) => {
  if (typeof value !== "string") return "";
  return value
    .replace(/[<>'"`;=]/g, "")   // Loại ký tự HTML/SQL injection
    .replace(/--/g, "")           // Loại SQL comment (--)
    .replace(/\/\*/g, "")         // Loại block comment
    .trim();
};

// ─── INDIVIDUAL VALIDATORS ────────────────────────────────────────────────────

/**
 * Validate tên đăng nhập:
 * - Không được rỗng
 * - 3–50 ký tự
 * - Chỉ chứa chữ, số, dấu gạch dưới, gạch ngang
 */
export const validateUsername = (value) => {
  const sanitized = sanitizeInput(value);
  if (!sanitized) return "Tên đăng nhập không được để trống.";
  if (sanitized.length < 3) return "Tên đăng nhập phải có ít nhất 3 ký tự.";
  if (sanitized.length > 50) return "Tên đăng nhập không được vượt quá 50 ký tự.";
  if (!/^[a-zA-Z0-9_\-À-ÿ]+$/.test(sanitized))
    return "Tên đăng nhập chỉ được chứa chữ cái, số, dấu _ và dấu -.";
  return null; // null = hợp lệ
};

/**
 * Validate email:
 * - Không được rỗng
 * - Đúng định dạng email
 */
export const validateEmail = (value) => {
  const sanitized = sanitizeInput(value);
  if (!sanitized) return "Email không được để trống.";
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(sanitized)) return "Địa chỉ email không hợp lệ.";
  return null;
};

/**
 * Validate mật khẩu:
 * - Không được rỗng
 * - Ít nhất 8 ký tự
 * - Phải có chữ thường
 * - Phải có chữ hoa
 * - Phải có số
 * - Phải có ký tự đặc biệt
 */
export const validatePassword = (value) => {
  if (!value) return "Mật khẩu không được để trống.";
  if (value.length < 8) return "Mật khẩu phải có ít nhất 8 ký tự.";
  if (!/[a-z]/.test(value)) return "Mật khẩu phải có ít nhất một chữ thường (a-z).";
  if (!/[A-Z]/.test(value)) return "Mật khẩu phải có ít nhất một chữ hoa (A-Z).";
  if (!/[0-9]/.test(value)) return "Mật khẩu phải có ít nhất một chữ số (0-9).";
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value))
    return "Mật khẩu phải có ít nhất một ký tự đặc biệt (!@#$%...).";
  return null;
};

/**
 * Validate tên (firstName / lastName):
 * - Không được rỗng
 * - 1–50 ký tự
 */
export const validateName = (value, fieldLabel = "Trường này") => {
  const sanitized = sanitizeInput(value);
  if (!sanitized) return `${fieldLabel} không được để trống.`;
  if (sanitized.length > 50) return `${fieldLabel} không được vượt quá 50 ký tự.`;
  return null;
};

// ─── FORM-LEVEL VALIDATORS ───────────────────────────────────────────────────

/**
 * Validate toàn bộ form đăng nhập.
 * @returns {{ isValid: boolean, errors: Record<string, string> }}
 */
export const validateLoginForm = ({ username, password }) => {
  const errors = {};

  const usernameError = validateUsername(username);
  if (usernameError) errors.username = usernameError;

  const passwordError = validatePassword(password);
  if (passwordError) errors.password = passwordError;

  return { isValid: Object.keys(errors).length === 0, errors };
};

/**
 * Validate toàn bộ form đăng ký.
 * @returns {{ isValid: boolean, errors: Record<string, string> }}
 */
export const validateRegisterForm = ({ firstName, lastName, username, email, password }) => {
  const errors = {};

  const firstNameError = validateName(firstName, "Họ");
  if (firstNameError) errors.firstName = firstNameError;

  const lastNameError = validateName(lastName, "Tên");
  if (lastNameError) errors.lastName = lastNameError;

  const usernameError = validateUsername(username);
  if (usernameError) errors.username = usernameError;

  const emailError = validateEmail(email);
  if (emailError) errors.email = emailError;

  const passwordError = validatePassword(password);
  if (passwordError) errors.password = passwordError;

  return { isValid: Object.keys(errors).length === 0, errors };
};

// ─── PASSWORD STRENGTH HELPER ─────────────────────────────────────────────────

/**
 * Trả về level độ mạnh của password: 0–4
 * 0 = rỗng, 1 = yếu, 2 = trung bình, 3 = mạnh, 4 = rất mạnh
 */
export const getPasswordStrength = (value) => {
  if (!value) return 0;
  let score = 0;
  if (value.length >= 8) score++;
  if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score++;
  if (/[0-9]/.test(value)) score++;
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value)) score++;
  return score;
};
