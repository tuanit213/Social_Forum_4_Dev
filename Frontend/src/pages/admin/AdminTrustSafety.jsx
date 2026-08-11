import { useCallback, useEffect, useState } from "react";
import {
  addModerationNote,
  assignModerationCase,
  getModerationCaseById,
  getModerationCases,
  runModerationAction,
} from "@/services/adminService";
import { EmptyState, ErrorState, LoadingBlock, statusColor, timeAgo } from "./adminPageUtils";

const moderationActions = [
  ["dismiss", "Ignore"],
  ["escalate", "Escalate"],
  ["hide_content", "Hide Content"],
  ["warn_user", "Warn User"],
  ["suspend_user", "Suspend User"],
  ["ban_user", "Ban User"],
];

function CaseActionDialog({ actionLabel, onCancel, onConfirm }) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  return (
    <div className="admin-modal-backdrop">
      <div className="admin-modal">
        <div className="admin-modal-header"><h2 className="admin-card-title">{actionLabel}</h2></div>
        <div className="admin-modal-body">
          <textarea
            className="admin-textarea"
            placeholder="Nhập lý do xử lý"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
          />
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

export default function AdminTrustSafety() {
  const [cases, setCases] = useState([]);
  const [pagination, setPagination] = useState({ total: 0 });
  const [selectedId, setSelectedId] = useState("");
  const [selectedCase, setSelectedCase] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [dialog, setDialog] = useState(null);

  const loadCases = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getModerationCases({ search, limit: 30 });
      setCases(data.cases || []);
      setPagination(data.pagination || { total: 0 });
      setSelectedId((current) => current || data.cases?.[0]?._id || "");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(loadCases, 300);
    return () => clearTimeout(timer);
  }, [loadCases]);

  useEffect(() => {
    if (!selectedId) {
      setSelectedCase(null);
      return;
    }
    let cancelled = false;
    getModerationCaseById(selectedId).then((data) => {
      if (!cancelled) setSelectedCase(data.case);
    });
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  const refreshSelected = async () => {
    await loadCases();
    if (selectedId) {
      const data = await getModerationCaseById(selectedId);
      setSelectedCase(data.case);
    }
  };

  const submitAction = async (reason) => {
    await runModerationAction(selectedCase._id, { action: dialog.action, reason });
    setDialog(null);
    await refreshSelected();
  };

  if (loading && !cases.length) return <LoadingBlock />;
  if (error) return <ErrorState message={error} onRetry={loadCases} />;

  return (
    <section className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Trust Safety Queue</h1>
          <p className="admin-muted">Case moderation doc tu AdminReport, action ghi audit log.</p>
        </div>
        <input className="admin-input" placeholder="Search moderation cases..." value={search} onChange={(event) => setSearch(event.target.value)} style={{ maxWidth: 360 }} />
      </div>

      <div className="admin-split">
        <article className="admin-card">
          <div className="admin-card-header">
            <h2 className="admin-card-title">Active Reports</h2>
            <span className="admin-badge blue">{pagination.total || 0} total</span>
          </div>
          {!cases.length ? (
            <EmptyState text="Chưa có report trong hàng đợi." />
          ) : (
            <div className="admin-case-list">
              {cases.map((item) => (
                <button
                  className={`admin-case-item ${item.severity} ${selectedId === item._id ? "active" : ""}`}
                  key={item._id}
                  type="button"
                  onClick={() => setSelectedId(item._id)}
                  style={{ color: "inherit", textAlign: "left", width: "100%" }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span className={`admin-badge ${statusColor(item.severity)}`}>{item.severity}</span>
                    <span className="admin-muted">{timeAgo(item.createdAt)}</span>
                  </div>
                  <strong style={{ display: "block", marginTop: 8 }}>{item.title}</strong>
                  <p className="admin-muted">{item.description || "Không có mô tả."}</p>
                </button>
              ))}
            </div>
          )}
        </article>

        <article className="admin-card">
          <div className="admin-card-header">
            <h2 className="admin-card-title">
              {selectedCase ? `Case #${String(selectedCase._id).slice(-8).toUpperCase()}` : "Case Detail"}
            </h2>
            {selectedCase ? <span className={`admin-badge ${statusColor(selectedCase.status)}`}>{selectedCase.status}</span> : null}
          </div>
          {!selectedCase ? (
            <EmptyState text="Chọn báo cáo để xem chi tiết." />
          ) : (
            <div className="admin-card-body admin-panel-list">
              <div className="admin-list-item">
                <span className={`admin-badge ${statusColor(selectedCase.severity)}`}>{selectedCase.severity}</span>
                <h2 className="admin-page-title" style={{ marginTop: 10 }}>{selectedCase.title}</h2>
                <p className="admin-muted">{selectedCase.description || "Không có mô tả."}</p>
              </div>

              <div className="admin-grid admin-grid-3">
                <div className="admin-list-item"><strong>{selectedCase.type}</strong><div className="admin-muted">Type</div></div>
                <div className="admin-list-item"><strong>{selectedCase.targetType}</strong><div className="admin-muted">Target</div></div>
                <div className="admin-list-item"><strong>{selectedCase.riskScore || 0}</strong><div className="admin-muted">Risk score</div></div>
              </div>

              <div className="admin-list-item">
                <strong>Reporter</strong>
                <p className="admin-muted">{selectedCase.reporterId?.Username || selectedCase.reporterId?.displayName || "Chưa có dữ liệu"}</p>
              </div>

              <div className="admin-list-item">
                <strong>Target user</strong>
                <p className="admin-muted">{selectedCase.targetUserId?.Username || selectedCase.targetUserId?.displayName || "Chưa có dữ liệu"}</p>
              </div>

              <div className="admin-action-bar">
                <button className="admin-button-secondary" type="button" onClick={async () => { await assignModerationCase(selectedCase._id); await refreshSelected(); }}>
                  Assign to me
                </button>
                {moderationActions.map(([action, label]) => (
                  <button
                    className={action === "ban_user" ? "admin-button-danger" : "admin-button-secondary"}
                    key={action}
                    type="button"
                    onClick={() => setDialog({ action, label })}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div>
                <h3 className="admin-card-title">Case note</h3>
                <textarea className="admin-textarea" value={note} onChange={(event) => setNote(event.target.value)} placeholder="Thêm ghi chú nội bộ" />
                <button
                  className="admin-button"
                  disabled={!note.trim()}
                  type="button"
                  onClick={async () => {
                    await addModerationNote(selectedCase._id, { note });
                    setNote("");
                    await refreshSelected();
                  }}
                  style={{ marginTop: 10 }}
                >
                  Add note
                </button>
              </div>

              <div>
                <h3 className="admin-card-title">Notes</h3>
                {!selectedCase.notes?.length ? <EmptyState text="Chưa có ghi chú." /> : selectedCase.notes.map((item) => (
                  <div className="admin-list-item" key={item._id || item.createdAt}>{item.note}</div>
                ))}
              </div>
            </div>
          )}
        </article>
      </div>

      {dialog ? (
        <CaseActionDialog
          actionLabel={dialog.label}
          onCancel={() => setDialog(null)}
          onConfirm={submitAction}
        />
      ) : null}
    </section>
  );
}
