import { useEffect, useState } from "react";
import { Check, Minus, ShieldCheck } from "lucide-react";
import { getAdminRoles, getRoleElevationRequests } from "@/services/adminService";
import { EmptyState, ErrorState, LoadingBlock } from "./adminPageUtils";

export default function AdminRoles() {
  const [data, setData] = useState(null);
  const [requests, setRequests] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadRoles = async () => {
    setLoading(true);
    setError("");
    try {
      const [rolesData, requestData] = await Promise.all([
        getAdminRoles(),
        getRoleElevationRequests(),
      ]);
      setData(rolesData);
      setRequests(requestData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoles();
  }, []);

  if (loading) return <LoadingBlock />;
  if (error) return <ErrorState message={error} onRetry={loadRoles} />;

  const roles = data?.roles || [];
  const permissions = data?.permissions || [];

  return (
    <section className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Roles & Permissions</h1>
          <p className="admin-muted">Ma trận đọc từ RBAC config server, chưa có workflow lưu permission riêng trong DB.</p>
        </div>
        <span className="admin-badge blue">{data?.source || "server_rbac_config"}</span>
      </div>

      <div className="admin-grid admin-grid-2">
        <article className="admin-card">
          <div className="admin-card-header">
            <h2 className="admin-card-title">Access Control Matrix</h2>
            <div className="admin-filter-row">
              <button className="admin-button" disabled type="button">Commit Changes</button>
              <button className="admin-button-secondary" disabled type="button">Revert</button>
            </div>
          </div>
          <div className="admin-table-wrap">
            <div className="admin-permission-grid">
              <div className="admin-permission-row" style={{ background: "#181c21" }}>
                <div className="admin-muted">Permission / Role</div>
                {roles.map((role) => (
                  <div key={role.id}>
                    <strong>{role.name}</strong>
                    <div className="admin-muted" style={{ fontSize: 12 }}>{role.id.toLowerCase()}</div>
                  </div>
                ))}
              </div>
              {permissions.map((permission) => (
                <div className="admin-permission-row" key={permission.code}>
                  <div>
                    <strong>{permission.domain}</strong>
                    <div className="admin-muted">{permission.label}</div>
                    <code className="admin-muted">{permission.code}</code>
                  </div>
                  {roles.map((role) => {
                    const allowed = role.permissions?.includes(permission.code);
                    return (
                      <div key={`${role.id}-${permission.code}`}>
                        <span className={`admin-badge ${allowed ? "blue" : ""}`}>
                          {allowed ? <Check size={14} /> : <Minus size={14} />}
                          {allowed ? "Allow" : "No access"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </article>

        <aside className="admin-card">
          <div className="admin-card-header">
            <h2 className="admin-card-title">Selected Permission</h2>
            <ShieldCheck size={18} color="#a2c9ff" />
          </div>
          <div className="admin-card-body admin-panel-list">
            <div className="admin-list-item">
              <strong>System RBAC</strong>
              <p className="admin-muted">
                Role và permission hiện được cấp bằng cấu hình backend. Không có màn hình giả cho edit schema.
              </p>
            </div>
            <div className="admin-list-item">
              <strong>Approval logic</strong>
              <p className="admin-muted">Privilege escalation, self-lockout và last Super Admin được chặn ở backend.</p>
            </div>
          </div>
        </aside>
      </div>

      <article className="admin-card">
        <div className="admin-card-header">
          <h2 className="admin-card-title">Role Elevation Requests</h2>
          <span className="admin-badge yellow">{requests?.configured ? "Configured" : "Not configured"}</span>
        </div>
        {!requests?.requests?.length ? (
          <EmptyState text={requests?.message || "Chưa có yêu cầu nâng quyền."} />
        ) : null}
      </article>
    </section>
  );
}
