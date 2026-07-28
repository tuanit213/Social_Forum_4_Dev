/**
 * Login.jsx — UI thuần, không chứa logic hay state.
 * Toàn bộ state và business logic nằm trong hook useLoginForm.
 */

import { Link } from "react-router-dom";
import { Eye, EyeOff, AlertCircle, Loader2 } from "lucide-react";
import Globe from "@/components/ui/Globe";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useLoginForm } from "@/hooks/useLoginForm";

// ─── SUB-COMPONENT: Hiển thị thông báo lỗi field ────────────────────────────
function FieldError({ message }) {
  if (!message) return null;
  return (
    <p className="flex items-center gap-1.5 text-red-400 text-xs mt-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
      <AlertCircle size={12} className="flex-shrink-0" />
      {message}
    </p>
  );
}

// ─── SUB-COMPONENT: Thông báo lỗi API ────────────────────────────────────────
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

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
export default function Login() {
  const {
    formData,
    errors,
    apiError,
    isSubmitting,
    showPassword,
    handleChange,
    handleSubmit,
    toggleShowPassword,
  } = useLoginForm();

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">

      {/* Globe full-screen background */}
      <div className="absolute inset-0 pointer-events-none">
        <Globe
          speed={0.8}
          scale={8}
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
        style={{ background: "radial-gradient(125% 125% at 50% 10%, rgba(139,92,246,0.18) 0%, rgba(99,102,241,0.08) 35%, transparent 65%)" }}
      />

      {/* Branding */}
      <div className="absolute top-8 left-10 z-20">
        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-300 to-indigo-300">
          SocialForum
        </h1>
      </div>

      {/* ── FORM CARD ── */}
      <div className="relative z-10 w-full h-full flex items-center justify-center px-4">
        <div
          className="w-full shadow-2xl"
          style={{
            maxWidth: "460px",
            borderRadius: "20px",
            background: "rgba(8, 6, 20, 0.78)",
            border: "1px solid rgba(255,255,255,0.10)",
            backdropFilter: "blur(32px)",
            WebkitBackdropFilter: "blur(32px)",
            boxShadow: "0 32px 80px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.08)",
            padding: "44px 44px 40px",
          }}
        >
          {/* Header */}
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">Chào mừng</h2>
            <p className="text-white/40 text-sm">Đăng nhập để tiếp tục hành trình của bạn.</p>
          </div>

          {/* API Error Banner */}
          <div className="mb-4">
            <ApiErrorBanner message={apiError} />
          </div>

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>

            {/* Username */}
            <div className="space-y-1.5">
              <Label htmlFor="username" className="text-white/50 text-[11px] uppercase tracking-[0.2em] font-semibold">
                Tên đăng nhập
              </Label>
              <Input
                id="username"
                autoComplete="username"
                placeholder="Nhập tên đăng nhập"
                value={formData.username}
                onChange={handleChange}
                disabled={isSubmitting}
                aria-invalid={!!errors.username}
                className="h-12 rounded-xl text-white text-sm placeholder:text-white/20 focus-visible:ring-violet-500/50 focus-visible:border-violet-500/40 disabled:opacity-50"
                style={{
                  background: errors.username ? "rgba(239,68,68,0.08)" : "rgba(255,255,255,0.06)",
                  border: errors.username ? "1px solid rgba(239,68,68,0.4)" : "1px solid rgba(255,255,255,0.10)",
                }}
              />
              <FieldError message={errors.username} />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-white/50 text-[11px] uppercase tracking-[0.2em] font-semibold">
                  Mật khẩu
                </Label>
                <a href="#" className="text-[11px] text-violet-400/80 hover:text-violet-300 transition-colors">
                  Quên mật khẩu?
                </a>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  aria-invalid={!!errors.password}
                  className="h-12 rounded-xl text-white text-sm placeholder:text-white/20 focus-visible:ring-violet-500/50 focus-visible:border-violet-500/40 pr-11 disabled:opacity-50"
                  style={{
                    background: errors.password ? "rgba(239,68,68,0.08)" : "rgba(255,255,255,0.06)",
                    border: errors.password ? "1px solid rgba(239,68,68,0.4)" : "1px solid rgba(255,255,255,0.10)",
                  }}
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
            </div>

            {/* Submit */}
            <div className="pt-1">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-12 font-semibold rounded-xl text-white text-sm tracking-wide transition-all duration-200 hover:scale-[1.02] hover:brightness-110 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
                style={{
                  background: "linear-gradient(135deg, #7c3aed 0%, #6d28d9 60%, #4f46e5 100%)",
                  boxShadow: "0 0 28px rgba(124,58,237,0.45), 0 4px 20px rgba(0,0,0,0.4)",
                }}
              >
                {isSubmitting
                  ? <span className="flex items-center gap-2"><Loader2 size={16} className="animate-spin" /> Đang đăng nhập...</span>
                  : "Đăng nhập"
                }
              </Button>
            </div>
          </form>

          <div className="my-7 flex items-center gap-3">
            <div className="flex-1 h-px bg-white/[0.08]" />
            <span className="text-[10px] text-white/25 uppercase tracking-[0.25em]">hoặc</span>
            <div className="flex-1 h-px bg-white/[0.08]" />
          </div>

          <p className="text-center text-sm text-white/35">
            Chưa có tài khoản?{" "}
            <Link to="/register" className="text-violet-400 font-semibold hover:text-violet-300 transition-colors">
              Đăng ký miễn phí →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
