import { useCallback, useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Ban, RotateCcw, ShieldAlert } from "lucide-react";
import {
  getAdminUserById,
  getAdminUsers,
  runAdminUserAction,
  updateAdminUserRole,
} from "@/services/adminService";
import { EmptyState, ErrorState, LoadingBlock, formatDateTime, formatNumber, statusColor } from "./adminPageUtils";

const roleOptions = ["MEMBER", "MODERATOR", "ADMIN", "SUPER_ADMIN"];

function ReasonDialog({ title, defaultReason = "", onCancel, onConfirm }) {
  const [reason, setReason] = useState(defaultReason);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  return (
    <div className="admin-modal-backdrop">
      <div className="admin-modal">
        <div className="admin-modal-header">
          <h2 className="admin-card-title">{title}</h2>
        </div>
        <div className="admin-modal-body">
          <label>
            <div className="admin-muted" style={{ marginBottom: 8 }}>Lý do bắt buộc</div>
            <textarea className="admin-textarea" value={reason} onChange={(event) => setReason(event.target.value)} />
          </label>
          {error ? <div className="admin-error" style={{ minHeight: "auto", padding: 0 }}>{error}</div> : null}
        </div>
        <div className="admin-modal-footer">
          <button className="admin-button-ghost" type="button" onClick={onCancel}>Hủy</button>
          <button
            className="admin-button"
            type="button"
            disabled={!reason.trim() || submitting}
            onClick={async () => {
              setSubmitting(true);
              setError("");
              try {
                await onConfirm(reason.trim());
              } catch (err) {
                setError(err.message || "Thao tác thất bại.");
                setSubmitting(false);
              }
            }}
          >
            Xác nhận
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminUsers() {
  const { admin } = useOutletContext();
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 1 });
  const [filters, setFilters] = useState({ search: "", tab: "all", page: 1 });
  const [selectedId, setSelectedId] = useState("");
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState("");
  const [dialog, setDialog] = useState(null);

  const query = useMemo(() => {
    const params = { page: filters.page, limit: 12, search: filters.search };
    if (filters.tab === "staff") params.staff = "true";
    if (filters.tab === "moderator") params.moderator = "true";
    return params;
  }, [filters]);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getAdminUsers(query);
      setUsers(data.users || []);
      setPagination(data.pagination || { page: 1, total: 0, totalPages: 1 });
      setSelectedId((current) => current || data.users?.[0]?.id || "");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    const timer = setTimeout(loadUsers, 350);
    return () => clearTimeout(timer);
  }, [loadUsers]);

  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      return;
    }

    let cancelled = false;
    const loadDetail = async () => {
      setDetailLoading(true);
      try {
        const data = await getAdminUserById(selectedId);
        if (!cancelled) setDetail(data);
      } finally {
        if (!cancelled) setDetailLoading(false);
      }
    };

    loadDetail();
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  const selectedUser = detail?.user;
  const isSelf = selectedUser?.id === admin?.id;

  const runAction = async (action, reason) => {
    await runAdminUserAction(selectedUser.id, action, { reason });
    setDialog(null);
    await Promise.all([loadUsers(), getAdminUserById(selectedUser.id).then(setDetail)]);
  };

  const changeRole = async (role, reason) => {
    await updateAdminUserRole(selectedUser.id, { role, reason });
    setDialog(null);
    await Promise.all([loadUsers(), getAdminUserById(selectedUser.id).then(setDetail)]);
  };

  if (loading && !users.length) return <LoadingBlock />;
  if (error) return <ErrorState message={error} onRetry={loadUsers} />;

  return (
    <section className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">User Directory</h1>
          <p className="admin-muted">Search, filter, role change và account action xử lý server-side.</p>
        </div>
        <div className="admin-badge blue">{formatNumber(pagination.total)} users</div>
      </div>

      <div className="admin-filter-row">
        <input
          className="admin-input"
          placeholder="Search username, email..."
          value={filters.search}
          onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value, page: 1 }))}
          style={{ maxWidth: 320 }}
        />
        {[
          ["all", "All Roles"],
          ["staff", "Staff"],
          ["moderator", "Moderators"],
        ].map(([value, label]) => (
          <button
            className={filters.tab === value ? "admin-button" : "admin-button-secondary"}
            key={value}
            type="button"
            onClick={() => setFilters((current) => ({ ...current, tab: value, page: 1 }))}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="admin-grid admin-grid-2">
        <article className="admin-card">
          {!users.length ? (
            <EmptyState text="Không tìm thấy user phù hợp." />
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr
                      className={selectedId === user.id ? "admin-row-selected" : ""}
                      key={user.id}
                      onClick={() => setSelectedId(user.id)}
                    >
                      <td>
                        <strong>{user.displayName || user.username}</strong>
                        <div className="admin-muted">@{user.username}</div>
                      </td>
                      <td>{user.email}</td>
                      <td><span className="admin-badge blue">{user.role}</span></td>
                      <td><span className={`admin-badge ${statusColor(user.status)}`}>{user.status}</span></td>
                      <td>{formatDateTime(user.joinedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </article>

        <aside className="admin-card">
          <div className="admin-card-header">
            <h2 className="admin-card-title">User Detail</h2>
          </div>
          {detailLoading ? (
            <LoadingBlock />
          ) : !selectedUser ? (
            <EmptyState text="Chọn người dùng để xem chi tiết." />
          ) : (
            <div className="admin-card-body admin-panel-list">
              <div>
                <h2 className="admin-page-title">{selectedUser.displayName || selectedUser.username}</h2>
                <p className="admin-muted">@{selectedUser.username} - {selectedUser.email}</p>
              </div>
              <div className="admin-grid admin-grid-3">
                <div className="admin-list-item"><strong>{formatNumber(detail.stats?.postsCount)}</strong><div className="admin-muted">Posts</div></div>
                <div className="admin-list-item"><strong>{formatNumber(detail.stats?.commentsCount)}</strong><div className="admin-muted">Comments</div></div>
                <div className="admin-list-item"><strong>{formatNumber(detail.stats?.warningsCount)}</strong><div className="admin-muted">Warnings</div></div>
              </div>

              <label>
                <div className="admin-muted" style={{ marginBottom: 8 }}>Role</div>
                <select
                  className="admin-select"
                  disabled={isSelf}
                  value={selectedUser.role}
                  onChange={(event) =>
                    setDialog({
                      title: `Đổi vai trò thành ${event.target.value}`,
                      onConfirm: (reason) => changeRole(event.target.value, reason),
                    })
                  }
                >
                  {roleOptions.map((role) => <option key={role} value={role}>{role}</option>)}
                </select>
              </label>

              <div className="admin-action-bar">
                <button className="admin-button-secondary" disabled={isSelf} type="button" onClick={() => setDialog({ title: "Issue warning", onConfirm: (reason) => runAction("warn", reason) })}>
                  <ShieldAlert size={16} /> Warning
                </button>
                <button className="admin-button-secondary" disabled={isSelf} type="button" onClick={() => setDialog({ title: "Suspend account", onConfirm: (reason) => runAction("suspend", reason) })}>
                  <Ban size={16} /> Suspend
                </button>
                <button className="admin-button-danger" disabled={isSelf} type="button" onClick={() => setDialog({ title: "Ban permanently", onConfirm: (reason) => runAction("ban", reason) })}>
                  <Ban size={16} /> Ban
                </button>
                <button className="admin-button" disabled={isSelf} type="button" onClick={() => setDialog({ title: "Reactivate account", onConfirm: (reason) => runAction("reactivate", reason) })}>
                  <RotateCcw size={16} /> Reactivate
                </button>
              </div>

              <div>
                <h3 className="admin-card-title">Violation history</h3>
                {!detail.warnings?.length ? <EmptyState text="Chưa có cảnh báo." /> : detail.warnings.map((warning) => (
                  <div className="admin-list-item" key={warning._id || warning.createdAt}>
                    {warning.reason}
                    <div className="admin-muted">{formatDateTime(warning.createdAt)}</div>
                  </div>
                ))}
              </div>

              <div>
                <h3 className="admin-card-title">Admin notes</h3>
                {!detail.adminNotes?.length ? <EmptyState text="Chưa có ghi chú admin." /> : detail.adminNotes.map((note) => (
                  <div className="admin-list-item" key={note._id || note.createdAt}>
                    {note.note}
                    <div className="admin-muted">{formatDateTime(note.createdAt)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>

      <div className="admin-filter-row" style={{ justifyContent: "flex-end" }}>
        <button className="admin-button-secondary" disabled={pagination.page <= 1} onClick={() => setFilters((current) => ({ ...current, page: current.page - 1 }))} type="button">
          Prev
        </button>
        <span className="admin-muted">Page {pagination.page} / {pagination.totalPages || 1}</span>
        <button className="admin-button-secondary" disabled={pagination.page >= pagination.totalPages} onClick={() => setFilters((current) => ({ ...current, page: current.page + 1 }))} type="button">
          Next
        </button>
      </div>

      {dialog ? (
        <ReasonDialog
          title={dialog.title}
          onCancel={() => setDialog(null)}
          onConfirm={dialog.onConfirm}
        />
      ) : null}
    </section>
  );
}
