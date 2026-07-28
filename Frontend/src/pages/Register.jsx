/**
 * Register.jsx — UI thuần, không chứa logic hay state.
 * Toàn bộ state và business logic nằm trong hook useRegisterForm.
 */

import { Link } from "react-router-dom";
import { Eye, EyeOff, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import Globe from "@/components/ui/Globe";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useRegisterForm } from "@/hooks/useRegisterForm";

// ─── SUB-COMPONENT: Lỗi field ────────────────────────────────────────────────
function FieldError({ message }) {
  if (!message) return null;
  return (
    <p className="flex items-center gap-1.5 text-red-400 text-xs mt-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
      <AlertCircle size={12} className="flex-shrink-0" />
      {message}
    </p>
  );
}

// ─── SUB-COMPONENT: Banner lỗi API ───────────────────────────────────────────
function ApiErrorBanner({ message }) {
  if (!message) return null;
  return (
    <div className="flex items-start gap-2.5 rounded-lg px-4 py-3 text-sm text-red-300 animate-in fade-in duration-300"
      style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)" }}>
      <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
      <span>{message}</span>
    </div>
  );
}

// ─── SUB-COMPONENT: Banner thành công ────────────────────────────────────────
function SuccessBanner({ message }) {
  if (!message) return null;
  return (
    <div className="flex items-start gap-2.5 rounded-lg px-4 py-3 text-sm text-green-300 animate-in fade-in duration-300"
      style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)" }}>
      <CheckCircle2 size={15} className="flex-shrink-0 mt-0.5" />
      <span>{message}</span>
    </div>
  );
}

// ─── SUB-COMPONENT: Password Strength Indicator ──────────────────────────────
const STRENGTH_CONFIG = [
  { label: "Rất yếu", color: "#ef4444" },
  { label: "Yếu",     color: "#f97316" },
  { label: "Trung bình", color: "#eab308" },
  { label: "Mạnh",    color: "#22c55e" },
  { label: "Rất mạnh", color: "#16a34a" },
];

function PasswordStrength({ strength, value }) {
  if (!value) return null;
  const config = STRENGTH_CONFIG[strength] || STRENGTH_CONFIG[0];
  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((level) => (
          <div
            key={level}
            className="flex-1 h-1 rounded-full transition-all duration-300"
            style={{
              background: strength >= level ? config.color : "rgba(255,255,255,0.1)",
            }}
          />
        ))}
      </div>
      <p className="text-[11px]" style={{ color: config.color }}>
        {config.label}
      </p>
    </div>
  );
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
export default function Register() {
  const {
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
  } = useRegisterForm();

  // Helper tạo style input theo trạng thái lỗi
  const inputStyle = (field) => ({
    background: errors[field] ? "rgba(239,68,68,0.08)" : "rgba(255,255,255,0.06)",
    border: errors[field] ? "1px solid rgba(239,68,68,0.4)" : "1px solid rgba(255,255,255,0.10)",
  });

  const inputClass = "h-12 rounded-xl text-white text-sm placeholder:text-white/20 focus-visible:ring-indigo-500/50 focus-visible:border-indigo-500/40 disabled:opacity-50";

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">

      {/* Globe full-screen background */}
      <div className="absolute inset-0 pointer-events-none">
        <Globe
          speed={0.8}
          scale={8}
          direction="right"
          fill="dots"
          oceanColor="#000000"
          outlineColor="#ffffff"
          graticuleColor="#ffffff"
          showOutline={true}
          showGrid={true}
          outlineWidth={1}
          dots={{ color: "#ffffff", size: 2, density: 9, allDots: true }}
          stopOnHover={false}
        />
      </div>

      {/* Radial gradient overlay */}
      <div className="absolute inset-0 pointer-events-none z-[1]"
        style={{ background: "radial-gradient(125% 125% at 50% 10%, rgba(0,0,0,0) 0%, rgba(0,0,0,0) 30%, rgba(0,0,0,0.65) 65%, #000 100%)" }}
      />
      <div className="absolute inset-0 pointer-events-none z-[1]"
        style={{ background: "radial-gradient(125% 125% at 50% 10%, rgba(99,102,241,0.18) 0%, rgba(79,70,229,0.08) 35%, transparent 65%)" }}
      />

      {/* Branding */}
      <div className="absolute top-8 left-10 z-20">
        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 to-violet-300">
          SocialForum
        </h1>
      </div>

      {/* ── FORM CARD ── */}
      <div className="relative z-10 w-full h-full flex items-center justify-center px-4 overflow-y-auto py-8">
        <div
          className="w-full shadow-2xl my-auto"
          style={{
            maxWidth: "480px",
            borderRadius: "20px",
            background: "rgba(8, 6, 20, 0.78)",
            border: "1px solid rgba(255,255,255,0.10)",
            backdropFilter: "blur(32px)",
            WebkitBackdropFilter: "blur(32px)",
            boxShadow: "0 32px 80px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.08)",
            padding: "40px 44px 36px",
          }}
        >
          {/* Header */}
          <div className="mb-7 text-center">
            <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">Tạo tài khoản</h2>
            <p className="text-white/40 text-sm">Gia nhập cộng đồng hàng ngàn nhà phát triển.</p>
          </div>

          {/* Banners */}
          <div className="space-y-3 mb-5">
            <ApiErrorBanner message={apiError} />
            <SuccessBanner message={successMessage} />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>

            {/* Họ / Tên */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="firstName" className="text-white/50 text-[11px] uppercase tracking-[0.2em] font-semibold">Họ</Label>
                <Input
                  id="firstName"
                  placeholder="Nguyễn Văn"
                  value={formData.firstName}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  disabled={isSubmitting}
                  aria-invalid={!!errors.firstName}
                  className={inputClass}
                  style={inputStyle("firstName")}
                />
                <FieldError message={errors.firstName} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lastName" className="text-white/50 text-[11px] uppercase tracking-[0.2em] font-semibold">Tên</Label>
                <Input
                  id="lastName"
                  placeholder="A"
                  value={formData.lastName}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  disabled={isSubmitting}
                  aria-invalid={!!errors.lastName}
                  className={inputClass}
                  style={inputStyle("lastName")}
                />
                <FieldError message={errors.lastName} />
              </div>
            </div>

            {/* Username */}
            <div className="space-y-1.5">
              <Label htmlFor="username" className="text-white/50 text-[11px] uppercase tracking-[0.2em] font-semibold">Tên đăng nhập</Label>
              <Input
                id="username"
                autoComplete="username"
                placeholder="nguyenvana123"
                value={formData.username}
                onChange={handleChange}
                onBlur={handleBlur}
                disabled={isSubmitting}
                aria-invalid={!!errors.username}
                className={inputClass}
                style={inputStyle("username")}
              />
              <FieldError message={errors.username} />
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-white/50 text-[11px] uppercase tracking-[0.2em] font-semibold">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="example@email.com"
                value={formData.email}
                onChange={handleChange}
                onBlur={handleBlur}
                disabled={isSubmitting}
                aria-invalid={!!errors.email}
                className={inputClass}
                style={inputStyle("email")}
              />
              <FieldError message={errors.email} />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-white/50 text-[11px] uppercase tracking-[0.2em] font-semibold">Mật khẩu</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  disabled={isSubmitting}
                  aria-invalid={!!errors.password}
                  className={`${inputClass} pr-11`}
                  style={inputStyle("password")}
                />
                <button
                  type="button"
                  onClick={toggleShowPassword}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? "Ẩn mật khẩu" : "Hiển thị mật khẩu"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <FieldError message={errors.password} />
              <PasswordStrength strength={passwordStrength} value={formData.password} />
            </div>

            {/* Submit */}
            <div className="pt-1">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-12 font-semibold rounded-xl text-white text-sm tracking-wide transition-all duration-200 hover:scale-[1.02] hover:brightness-110 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
                style={{
                  background: "linear-gradient(135deg, #4f46e5 0%, #4338ca 60%, #7c3aed 100%)",
                  boxShadow: "0 0 28px rgba(79,70,229,0.45), 0 4px 20px rgba(0,0,0,0.4)",
                }}
              >
                {isSubmitting
                  ? <span className="flex items-center gap-2"><Loader2 size={16} className="animate-spin" /> Đang tạo tài khoản...</span>
                  : "Đăng ký ngay"
                }
              </Button>
            </div>
          </form>

          <p className="text-center text-sm text-white/35 mt-6">
            Đã có tài khoản?{" "}
            <Link to="/login" className="text-indigo-400 font-semibold hover:text-indigo-300 transition-colors">
              ← Đăng nhập
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
