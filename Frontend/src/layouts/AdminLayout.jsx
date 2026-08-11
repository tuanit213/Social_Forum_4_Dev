import { useEffect, useMemo, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  Activity,
  Bell,
  FileText,
  Flag,
  LayoutDashboard,
  LogOut,
  Search,
  Shield,
  UserCog,
  Users,
} from "lucide-react";
import { getAccessToken, getStoredUser, refreshAuthToken, signOut } from "@/services/authService";
import { getAdminMe } from "@/services/adminService";
import "@/styles/admin.css";

const navItems = [
  { label: "Tổng quan", path: "/admin", icon: LayoutDashboard, end: true },
  { label: "Người dùng", path: "/admin/users", icon: Users },
  { label: "Vai trò & phân quyền", path: "/admin/roles", icon: Shield },
  { label: "Nội dung", path: "/admin/content", icon: FileText },
  { label: "Kiểm duyệt", path: "/admin/trust-safety", icon: Flag },
  { label: "Nhật ký hệ thống", path: "/admin/audit-logs", icon: Activity },
];

const initials = (user) => {
  const name = user?.displayName || user?.username || "Admin";
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
};

function AdminAccessDenied({ message }) {
  return (
    <div className="admin-shell admin-access-denied">
      <div className="admin-card" style={{ maxWidth: 520 }}>
        <div className="admin-card-body">
          <div className="admin-badge red">403</div>
          <h1 className="admin-page-title" style={{ marginTop: 16 }}>Không có quyền truy cập</h1>
          <p className="admin-muted" style={{ marginTop: 8 }}>
            {message || "Tài khoản hiện tại không có quyền vào khu vực Admin."}
          </p>
          <button className="admin-button-secondary" type="button" onClick={() => window.location.assign("/")}>
            Quay về trang chủ
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminLayout() {
  const navigate = useNavigate();
  const [adminSession, setAdminSession] = useState(null);
  const [accessDenied, setAccessDenied] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadAdminSession = async () => {
      try {
        if (!getAccessToken() && !getStoredUser()) {
          await refreshAuthToken();
        }

        const data = await getAdminMe();
        if (!cancelled) {
          setAdminSession(data);
        }
      } catch (error) {
        if (cancelled) return;
        if (error.status === 403) {
          setAccessDenied(error.message);
        } else {
          navigate("/login", { replace: true });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadAdminSession();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const user = adminSession?.user;
  const outletContext = useMemo(() => ({ admin: user, permissions: adminSession?.permissions || [] }), [adminSession, user]);

  if (loading) {
    return (
      <div className="admin-shell admin-access-denied">
        <div className="admin-skeleton" style={{ width: 360 }} />
      </div>
    );
  }

  if (accessDenied) return <AdminAccessDenied message={accessDenied} />;

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <h1>DevNet Admin</h1>
          <p>Quản trị SocialForum</p>
        </div>

        <nav className="admin-nav" aria-label="Admin navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                className={({ isActive }) => `admin-nav-item${isActive ? " active" : ""}`}
                end={item.end}
                key={item.label}
                to={item.path}
              >
                <Icon size={18} />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        <div className="admin-sidebar-footer">
          <div className="admin-status">
            <span className="admin-status-dot" />
            Hệ thống đang hoạt động
          </div>
          <div className="admin-user-chip" style={{ marginTop: 14 }}>
            <div className="admin-avatar">
              {user?.avatarUrl ? <img src={user.avatarUrl} alt="" /> : initials(user)}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 700 }}>{user?.displayName || user?.username}</div>
              <div className="admin-muted" style={{ fontSize: 12 }}>{user?.role}</div>
            </div>
          </div>
        </div>
      </aside>

      <header className="admin-topbar">
        <div style={{ position: "relative" }}>
          <Search size={16} style={{ color: "#8b949e", left: 12, position: "absolute", top: 12 }} />
          <input className="admin-search" placeholder="Tìm người dùng, nội dung, báo cáo..." style={{ paddingLeft: 38 }} />
        </div>

        <div className="admin-user-chip">
          <button className="admin-button-ghost" type="button" title="Thông báo">
            <Bell size={16} />
          </button>
          <button
            className="admin-button-ghost"
            type="button"
            onClick={async () => {
              await signOut();
              navigate("/login", { replace: true });
            }}
          >
            <LogOut size={16} />
            Đăng xuất
          </button>
          <UserCog size={18} color="#a2c9ff" />
        </div>
      </header>

      <main className="admin-main">
        <Outlet context={outletContext} />
      </main>
    </div>
  );
}
