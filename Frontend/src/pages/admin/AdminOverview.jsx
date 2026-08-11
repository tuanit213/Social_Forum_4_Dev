import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Clock3,
  Database,
  Flag,
  MessageSquareText,
  ShieldCheck,
  TrendingUp,
  Users,
} from "lucide-react";
import { getAdminOverview } from "@/services/adminService";
import { EmptyState, ErrorState, LoadingBlock, formatDateTime, formatNumber, statusColor, timeAgo } from "./adminPageUtils";

const kpiConfig = [
  { key: "totalUsers", label: "Người dùng", icon: Users, accent: "#a2c9ff" },
  { key: "dailyPosts", label: "Bài viết mới", icon: MessageSquareText, accent: "#7ee787" },
  { key: "activeReports", label: "Báo cáo mở", icon: Flag, accent: "#ffb4ab" },
  { key: "moderationBacklog", label: "Chờ kiểm duyệt", icon: Activity, accent: "#ffba42" },
  { key: "activeSystemAlerts", label: "Cảnh báo hệ thống", icon: AlertTriangle, accent: "#bd93f9" },
];

const demoOverview = {
  demo: true,
  kpis: {
    totalUsers: 128,
    dailyPosts: 34,
    activeReports: 6,
    moderationBacklog: 4,
    activeSystemAlerts: 1,
  },
  traffic: [
    { timestamp: new Date(Date.now() - 6 * 86400000), value: 8 },
    { timestamp: new Date(Date.now() - 5 * 86400000), value: 12 },
    { timestamp: new Date(Date.now() - 4 * 86400000), value: 10 },
    { timestamp: new Date(Date.now() - 3 * 86400000), value: 18 },
    { timestamp: new Date(Date.now() - 2 * 86400000), value: 15 },
    { timestamp: new Date(Date.now() - 86400000), value: 24 },
    { timestamp: new Date(), value: 21 },
  ],
  platformHealth: [
    { name: "MongoDB", status: "connected", detail: "Kết nối ổn định" },
    { name: "Redis", status: "connected", detail: "Queue sẵn sàng" },
    { name: "API", status: "connected", detail: "Admin endpoint hoạt động" },
  ],
  priorityQueue: [
    { _id: "demo-001", severity: "high", type: "post", status: "open", createdAt: new Date(Date.now() - 5400000) },
    { _id: "demo-002", severity: "medium", type: "comment", status: "in_review", createdAt: new Date(Date.now() - 10800000) },
    { _id: "demo-003", severity: "low", type: "user", status: "open", createdAt: new Date(Date.now() - 86400000) },
  ],
  recentActivity: [
    { _id: "audit-demo-1", action: "USER_WARN", actorUsername: "admin", targetType: "user", createdAt: new Date(Date.now() - 1800000) },
    { _id: "audit-demo-2", action: "CONTENT_ARCHIVE_POST", actorUsername: "moderator", targetType: "post", createdAt: new Date(Date.now() - 7200000) },
    { _id: "audit-demo-3", action: "AUDIT_EXPORT", actorUsername: "admin", targetType: "audit_log", createdAt: new Date(Date.now() - 172800000) },
  ],
};

const hasUsefulOverviewData = (overview) => {
  if (!overview) return false;
  const kpis = overview.kpis || {};
  const totalKpis = Object.values(kpis).reduce((sum, value) => sum + Number(value || 0), 0);
  return totalKpis > 0 || overview.traffic?.some((point) => Number(point.value || 0) > 0);
};

function TrafficChart({ points }) {
  const values = useMemo(() => points?.map((point) => Number(point.value || 0)) || [], [points]);
  const path = useMemo(() => {
    if (!values.length) return "";
    const max = Math.max(...values, 1);
    return values
      .map((value, index) => {
        const x = values.length === 1 ? 0 : (index / (values.length - 1)) * 100;
        const y = 92 - (value / max) * 76;
        return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
      })
      .join(" ");
  }, [values]);

  if (!points?.length) return <EmptyState text="Chưa có dữ liệu bài viết trong khoảng thời gian này." />;

  return (
    <div>
      <svg className="admin-chart" viewBox="0 0 100 100" preserveAspectRatio="none" aria-label="Biểu đồ bài viết">
        <defs>
          <linearGradient id="adminTrafficFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#58a6ff" stopOpacity="0.36" />
            <stop offset="100%" stopColor="#58a6ff" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {[18, 38, 58, 78].map((y) => (
          <line key={y} x1="0" x2="100" y1={y} y2={y} stroke="#30363d" strokeWidth="0.35" vectorEffect="non-scaling-stroke" />
        ))}
        <path d={`${path} L 100 100 L 0 100 Z`} fill="url(#adminTrafficFill)" />
        <path d={path} fill="none" stroke="#58a6ff" strokeLinecap="round" strokeWidth="1.8" vectorEffect="non-scaling-stroke" />
      </svg>
      <div className="admin-filter-row" style={{ justifyContent: "space-between" }}>
        {points.map((point) => (
          <span className="admin-muted" key={String(point.timestamp)} style={{ fontSize: 11 }}>
            {new Date(point.timestamp).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })}
          </span>
        ))}
      </div>
    </div>
  );
}

function InsightCard({ icon: Icon, title, value, text }) {
  return (
    <article className="admin-card">
      <div className="admin-card-body">
        <div style={{ alignItems: "center", display: "flex", gap: 12 }}>
          <div className="admin-avatar" style={{ borderRadius: 10 }}>
            <Icon size={18} />
          </div>
          <div>
            <div className="admin-muted" style={{ fontSize: 12 }}>{title}</div>
            <div className="admin-card-title">{value}</div>
          </div>
        </div>
        <p className="admin-muted" style={{ marginBottom: 0 }}>{text}</p>
      </div>
    </article>
  );
}

export default function AdminOverview() {
  const [range, setRange] = useState("7d");
  const [data, setData] = useState(null);
  const [usingDemo, setUsingDemo] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const loadOverview = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const overview = await getAdminOverview({ range });
      if (hasUsefulOverviewData(overview)) {
        setData(overview);
        setUsingDemo(false);
      } else {
        setData(demoOverview);
        setUsingDemo(true);
      }
    } catch (err) {
      setData(demoOverview);
      setUsingDemo(true);
      setError(err.message || "API tổng quan chưa sẵn sàng.");
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  if (loading) return <LoadingBlock />;
  if (!data) return <ErrorState message="Không tải được dữ liệu tổng quan." onRetry={loadOverview} />;

  const kpis = data.kpis || {};

  return (
    <section className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Tổng quan hệ thống</h1>
          <p className="admin-muted">Theo dõi người dùng, bài viết, kiểm duyệt và trạng thái vận hành.</p>
        </div>
        <div className="admin-filter-row">
          {usingDemo ? <span className="admin-badge yellow">Dữ liệu demo</span> : <span className="admin-badge green">Dữ liệu thật</span>}
          <select className="admin-select" value={range} onChange={(event) => setRange(event.target.value)} style={{ width: 150 }}>
            <option value="24h">24 giờ</option>
            <option value="7d">7 ngày</option>
            <option value="30d">30 ngày</option>
          </select>
        </div>
      </div>

      {usingDemo && error ? (
        <div className="admin-list-item" style={{ borderColor: "rgba(255, 186, 66, 0.35)" }}>
          <strong>API tổng quan đang lỗi, giao diện đang dùng dữ liệu demo để trình bày.</strong>
          <div className="admin-muted">{error}</div>
        </div>
      ) : null}

      <div className="admin-kpi-grid">
        {kpiConfig.map((item) => {
          const Icon = item.icon;
          const value = Number(kpis[item.key] || 0);
          const width = Math.min(100, Math.max(12, value ? value % 100 : 12));
          return (
            <article className="admin-card admin-kpi" key={item.key}>
              <div style={{ alignItems: "center", display: "flex", justifyContent: "space-between" }}>
                <div className="admin-kpi-label">{item.label}</div>
                <Icon size={18} color={item.accent} />
              </div>
              <div className="admin-kpi-value">{formatNumber(value)}</div>
              <div className="admin-meter"><span style={{ background: item.accent, width: `${width}%` }} /></div>
            </article>
          );
        })}
      </div>

      <div className="admin-grid admin-grid-3">
        <InsightCard icon={TrendingUp} title="Tăng trưởng" value="+18%" text="Hoạt động bài viết và bình luận đang tăng trong kỳ hiện tại." />
        <InsightCard icon={ShieldCheck} title="Kiểm duyệt" value={`${formatNumber(kpis.moderationBacklog)} việc`} text="Ưu tiên xử lý báo cáo mức cao trước khi khóa tài khoản." />
        <InsightCard icon={Clock3} title="Nhật ký" value={formatNumber(data.recentActivity?.length || 0)} text="Mọi thao tác admin được ghi lại để tra cứu sau." />
      </div>

      <div className="admin-grid admin-grid-2">
        <article className="admin-card">
          <div className="admin-card-header">
            <h2 className="admin-card-title">Lưu lượng bài viết</h2>
            <span className="admin-badge blue">Posts</span>
          </div>
          <div className="admin-card-body">
            <TrafficChart points={data.traffic || []} />
          </div>
        </article>

        <article className="admin-card">
          <div className="admin-card-header">
            <h2 className="admin-card-title">Trạng thái nền tảng</h2>
            <Database size={18} color="#a2c9ff" />
          </div>
          <div className="admin-card-body admin-panel-list">
            {(data.platformHealth || []).map((item) => (
              <div className="admin-list-item" key={item.name}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <div>
                    <strong>{item.name}</strong>
                    <div className="admin-muted">{item.detail || "Đang theo dõi"}</div>
                  </div>
                  <span className={`admin-badge ${statusColor(item.status)}`}>{item.status}</span>
                </div>
              </div>
            ))}
          </div>
        </article>
      </div>

      <div className="admin-grid admin-grid-2">
        <article className="admin-card">
          <div className="admin-card-header">
            <h2 className="admin-card-title">Hàng đợi kiểm duyệt ưu tiên</h2>
          </div>
          {!data.priorityQueue?.length ? (
            <EmptyState text="Chưa có báo cáo cần xử lý." />
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Mã</th>
                    <th>Mức độ</th>
                    <th>Loại</th>
                    <th>Thời gian</th>
                    <th>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {data.priorityQueue.map((item) => (
                    <tr key={item._id}>
                      <td>#{String(item._id).slice(-6).toUpperCase()}</td>
                      <td><span className={`admin-badge ${statusColor(item.severity)}`}>{item.severity}</span></td>
                      <td>{item.type || "content"}</td>
                      <td>{timeAgo(item.createdAt)}</td>
                      <td><span className={`admin-badge ${statusColor(item.status)}`}>{item.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </article>

        <article className="admin-card">
          <div className="admin-card-header">
            <h2 className="admin-card-title">Hoạt động gần đây</h2>
          </div>
          <div className="admin-card-body admin-panel-list">
            {!data.recentActivity?.length ? (
              <EmptyState text="Chưa có audit log." />
            ) : (
              data.recentActivity.map((item) => (
                <div className="admin-list-item" key={item._id}>
                  <strong>{item.action}</strong>
                  <div className="admin-muted">{item.actorUsername || "system"} - {item.targetType}</div>
                  <div className="admin-muted">{formatDateTime(item.createdAt)}</div>
                </div>
              ))
            )}
          </div>
        </article>
      </div>
    </section>
  );
}
