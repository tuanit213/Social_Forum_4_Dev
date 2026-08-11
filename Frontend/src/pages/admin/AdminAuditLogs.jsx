import { useCallback, useEffect, useMemo, useState } from "react";
import { Download, FileSearch } from "lucide-react";
import { exportAuditLogs, getAuditLogs } from "@/services/adminService";
import { EmptyState, ErrorState, LoadingBlock, formatDateTime, statusColor } from "./adminPageUtils";

const telemetryLabels = [
  ["Độ trễ mạng", "latency"],
  ["Tỷ lệ lỗi hệ thống", "errorRate"],
  ["Hàng đợi tác vụ", "jobQueue"],
];

const displayTelemetry = (value) => {
  if (!value || value === "Not configured") return "Chưa cấu hình";
  return value;
};

export default function AdminAuditLogs() {
  const [filters, setFilters] = useState({ search: "", actorRole: "", action: "", status: "", page: 1 });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const query = useMemo(() => {
    const params = { page: filters.page, limit: 20 };
    if (filters.search) params.search = filters.search;
    if (filters.actorRole) params.actorRole = filters.actorRole;
    if (filters.action) params.action = filters.action;
    if (filters.status) params.status = filters.status;
    return params;
  }, [filters]);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(await getAuditLogs(query));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    const timer = setTimeout(loadLogs, 250);
    return () => clearTimeout(timer);
  }, [loadLogs]);

  const downloadCsv = async () => {
    const blob = await exportAuditLogs(query);
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "audit-logs.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading && !data) return <LoadingBlock />;
  if (error) return <ErrorState message={error} onRetry={loadLogs} />;

  const logs = data?.logs || [];
  const pagination = data?.pagination || { page: 1, totalPages: 1 };

  return (
    <section className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Nhật ký hệ thống</h1>
          <p className="admin-muted">Tra cứu thao tác admin, lọc dữ liệu phía server, phân trang và xuất CSV.</p>
        </div>
        <button className="admin-button" type="button" onClick={downloadCsv}>
          <Download size={16} /> Xuất CSV
        </button>
      </div>

      <div className="admin-grid admin-grid-3">
        {telemetryLabels.map(([label, key]) => {
          const value = data?.telemetry?.[key];
          const notConfigured = !value || value === "Not configured";
          return (
            <article className="admin-card admin-kpi" key={key}>
              <div className="admin-kpi-label">{label}</div>
              <div className="admin-kpi-value" style={{ color: notConfigured ? "#8b949e" : "#a2c9ff" }}>
                {displayTelemetry(value)}
              </div>
              <div className="admin-muted">Chỉ hiển thị số liệu khi telemetry service đã được cấu hình.</div>
            </article>
          );
        })}
      </div>

      <div className="admin-grid admin-grid-2">
        <aside className="admin-card">
          <div className="admin-card-header">
            <h2 className="admin-card-title">Bộ lọc</h2>
            <button className="admin-button-ghost" type="button" onClick={() => setFilters({ search: "", actorRole: "", action: "", status: "", page: 1 })}>
              Đặt lại
            </button>
          </div>
          <div className="admin-card-body admin-panel-list">
            <input
              className="admin-input"
              placeholder="Từ khóa"
              value={filters.search}
              onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value, page: 1 }))}
            />
            <select className="admin-select" value={filters.actorRole} onChange={(event) => setFilters((current) => ({ ...current, actorRole: event.target.value, page: 1 }))}>
              <option value="">Tất cả vai trò</option>
              <option value="ADMIN">ADMIN</option>
              <option value="SUPER_ADMIN">SUPER_ADMIN</option>
              <option value="SYSTEM">SYSTEM</option>
            </select>
            <input
              className="admin-input"
              placeholder="Tìm theo hành động..."
              value={filters.action}
              onChange={(event) => setFilters((current) => ({ ...current, action: event.target.value, page: 1 }))}
            />
            <select className="admin-select" value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value, page: 1 }))}>
              <option value="">Tất cả trạng thái</option>
              <option value="SUCCESS">SUCCESS</option>
              <option value="FAILED">FAILED</option>
            </select>
          </div>
        </aside>

        <article className="admin-card">
          <div className="admin-card-header">
            <h2 className="admin-card-title">Dòng sự kiện</h2>
            <FileSearch size={18} color="#a2c9ff" />
          </div>
          {!logs.length ? (
            <EmptyState text="Chưa có nhật ký phù hợp." />
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Thời gian</th>
                    <th>Người thao tác</th>
                    <th>Hành động</th>
                    <th>Đối tượng</th>
                    <th>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log._id}>
                      <td>{formatDateTime(log.createdAt)}</td>
                      <td>
                        <strong>{log.actorUsername}</strong>
                        <div className="admin-muted">{log.actorRole}</div>
                      </td>
                      <td>{log.action}</td>
                      <td>{log.targetType} {log.targetId ? `#${String(log.targetId).slice(-6)}` : ""}</td>
                      <td><span className={`admin-badge ${statusColor(log.status)}`}>{log.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </article>
      </div>

      <div className="admin-filter-row" style={{ justifyContent: "flex-end" }}>
        <button className="admin-button-secondary" disabled={pagination.page <= 1} type="button" onClick={() => setFilters((current) => ({ ...current, page: current.page - 1 }))}>Trước</button>
        <span className="admin-muted">Trang {pagination.page} / {pagination.totalPages || 1}</span>
        <button className="admin-button-secondary" disabled={pagination.page >= pagination.totalPages} type="button" onClick={() => setFilters((current) => ({ ...current, page: current.page + 1 }))}>Sau</button>
      </div>
    </section>
  );
}
