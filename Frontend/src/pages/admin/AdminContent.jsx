import { useCallback, useEffect, useMemo, useState } from "react";
import { Archive, Eye, MessageSquareText, RotateCcw, Search } from "lucide-react";
import { getAdminContent, runAdminContentAction } from "@/services/adminService";
import { EmptyState, ErrorState, LoadingBlock, formatDateTime, formatNumber, statusColor } from "./adminPageUtils";

const typeOptions = [
  ["all", "Tất cả"],
  ["post", "Bài viết"],
  ["comment", "Bình luận"],
];

const statusOptions = {
  all: [["", "Mọi trạng thái"]],
  post: [
    ["", "Mọi trạng thái"],
    ["public", "Công khai"],
    ["private", "Riêng tư"],
    ["draft", "Bản nháp"],
    ["archived", "Đã ẩn"],
  ],
  comment: [
    ["", "Mọi trạng thái"],
    ["active", "Đang hiển thị"],
    ["hidden", "Đã ẩn"],
    ["deleted", "Đã xóa"],
  ],
};

const actionLabel = {
  archive_post: "Ẩn bài viết",
  restore_post: "Khôi phục bài viết",
  hide_comment: "Ẩn bình luận",
  restore_comment: "Khôi phục bình luận",
};

function trimPreview(value) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  if (!text) return "Không có nội dung";
  return text.length > 150 ? `${text.slice(0, 150)}...` : text;
}

function ActionDialog({ action, item, onCancel, onConfirm }) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  return (
    <div className="admin-modal-backdrop">
      <div className="admin-modal">
        <div className="admin-modal-header">
          <h2 className="admin-card-title">{actionLabel[action]}</h2>
        </div>
        <div className="admin-modal-body">
          <div className="admin-list-item">
            <strong>{item?.title}</strong>
            <p className="admin-muted">{trimPreview(item?.content)}</p>
          </div>
          <label>
            <div className="admin-muted" style={{ marginBottom: 8 }}>Lý do xử lý</div>
            <textarea
              className="admin-textarea"
              placeholder="Nhập lý do để lưu nhật ký hệ thống"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
            />
          </label>
          {error ? <div className="admin-error" style={{ minHeight: "auto", padding: 0 }}>{error}</div> : null}
        </div>
        <div className="admin-modal-footer">
          <button className="admin-button-ghost" type="button" onClick={onCancel}>Hủy</button>
          <button
            className="admin-button"
            disabled={!reason.trim() || submitting}
            type="button"
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

function ContentActions({ item, onAction }) {
  if (item.type === "post") {
    if (item.status === "archived") {
      return (
        <button className="admin-button-secondary" type="button" onClick={() => onAction(item, "restore_post")}>
          <RotateCcw size={15} /> Khôi phục
        </button>
      );
    }
    return (
      <button className="admin-button-danger" type="button" onClick={() => onAction(item, "archive_post")}>
        <Archive size={15} /> Ẩn
      </button>
    );
  }

  if (item.status === "hidden") {
    return (
      <button className="admin-button-secondary" type="button" onClick={() => onAction(item, "restore_comment")}>
        <RotateCcw size={15} /> Khôi phục
      </button>
    );
  }

  return (
    <button className="admin-button-danger" type="button" onClick={() => onAction(item, "hide_comment")}>
      <Eye size={15} /> Ẩn
    </button>
  );
}

export default function AdminContent() {
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState({ posts: {}, comments: {} });
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 1 });
  const [filters, setFilters] = useState({ type: "all", status: "", search: "", page: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dialog, setDialog] = useState(null);

  const query = useMemo(
    () => ({
      type: filters.type,
      status: filters.status,
      search: filters.search,
      page: filters.page,
      limit: 12,
    }),
    [filters],
  );

  const loadContent = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getAdminContent(query);
      setItems(data.items || []);
      setStats(data.stats || { posts: {}, comments: {} });
      setPagination(data.pagination || { page: 1, total: 0, totalPages: 1 });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    const timer = setTimeout(loadContent, 300);
    return () => clearTimeout(timer);
  }, [loadContent]);

  const updateFilter = (key, value) => {
    setFilters((current) => {
      const next = { ...current, [key]: value, page: 1 };
      if (key === "type") next.status = "";
      return next;
    });
  };

  const openAction = (item, action) => setDialog({ item, action });

  const submitAction = async (reason) => {
    await runAdminContentAction({
      targetType: dialog.item.type,
      targetId: dialog.item.id,
      action: dialog.action,
      reason,
    });
    setDialog(null);
    await loadContent();
  };

  if (loading && !items.length) return <LoadingBlock />;
  if (error) return <ErrorState message={error} onRetry={loadContent} />;

  return (
    <section className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Quản lý nội dung</h1>
          <p className="admin-muted">Theo dõi, ẩn và khôi phục bài viết hoặc bình luận bằng dữ liệu thật.</p>
        </div>
        <div className="admin-badge blue">{formatNumber(pagination.total)} nội dung</div>
      </div>

      <div className="admin-kpi-grid">
        <article className="admin-card admin-kpi">
          <div className="admin-kpi-label">Bài viết công khai</div>
          <div className="admin-kpi-value">{formatNumber(stats.posts?.public)}</div>
        </article>
        <article className="admin-card admin-kpi">
          <div className="admin-kpi-label">Bài viết riêng tư</div>
          <div className="admin-kpi-value">{formatNumber(stats.posts?.private)}</div>
        </article>
        <article className="admin-card admin-kpi">
          <div className="admin-kpi-label">Bài viết đã ẩn</div>
          <div className="admin-kpi-value">{formatNumber(stats.posts?.archived)}</div>
        </article>
        <article className="admin-card admin-kpi">
          <div className="admin-kpi-label">Bình luận hiển thị</div>
          <div className="admin-kpi-value">{formatNumber(stats.comments?.active)}</div>
        </article>
        <article className="admin-card admin-kpi">
          <div className="admin-kpi-label">Bình luận đã ẩn</div>
          <div className="admin-kpi-value">{formatNumber(stats.comments?.hidden)}</div>
        </article>
      </div>

      <div className="admin-card">
        <div className="admin-card-body admin-filter-row">
          <div style={{ maxWidth: 340, position: "relative", width: "100%" }}>
            <Search size={15} style={{ color: "#8b949e", left: 12, position: "absolute", top: 12 }} />
            <input
              className="admin-input"
              placeholder="Tìm tiêu đề, nội dung, thẻ..."
              style={{ paddingLeft: 36 }}
              value={filters.search}
              onChange={(event) => updateFilter("search", event.target.value)}
            />
          </div>
          <select className="admin-select" style={{ width: 180 }} value={filters.type} onChange={(event) => updateFilter("type", event.target.value)}>
            {typeOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          <select className="admin-select" style={{ width: 190 }} value={filters.status} onChange={(event) => updateFilter("status", event.target.value)}>
            {(statusOptions[filters.type] || statusOptions.all).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </div>
      </div>

      <article className="admin-card">
        <div className="admin-card-header">
          <h2 className="admin-card-title">Danh sách nội dung</h2>
          <MessageSquareText size={18} color="#a2c9ff" />
        </div>
        {!items.length ? (
          <EmptyState text="Chưa có nội dung phù hợp." />
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Loại</th>
                  <th>Nội dung</th>
                  <th>Tác giả</th>
                  <th>Trạng thái</th>
                  <th>Ngày tạo</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={`${item.type}-${item.id}`}>
                    <td><span className="admin-badge blue">{item.type === "post" ? "Bài viết" : "Bình luận"}</span></td>
                    <td>
                      <strong>{item.title}</strong>
                      <div className="admin-muted">{trimPreview(item.content)}</div>
                      {item.tags?.length ? <div className="admin-muted">{item.tags.map((tag) => `#${tag}`).join(" ")}</div> : null}
                    </td>
                    <td>{item.author}</td>
                    <td><span className={`admin-badge ${statusColor(item.status)}`}>{item.status}</span></td>
                    <td>{formatDateTime(item.createdAt)}</td>
                    <td><ContentActions item={item} onAction={openAction} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </article>

      <div className="admin-filter-row" style={{ justifyContent: "flex-end" }}>
        <button className="admin-button-secondary" disabled={pagination.page <= 1} onClick={() => setFilters((current) => ({ ...current, page: current.page - 1 }))} type="button">
          Trước
        </button>
        <span className="admin-muted">Trang {pagination.page} / {pagination.totalPages || 1}</span>
        <button className="admin-button-secondary" disabled={pagination.page >= pagination.totalPages} onClick={() => setFilters((current) => ({ ...current, page: current.page + 1 }))} type="button">
          Sau
        </button>
      </div>

      {dialog ? (
        <ActionDialog
          action={dialog.action}
          item={dialog.item}
          onCancel={() => setDialog(null)}
          onConfirm={submitAction}
        />
      ) : null}
    </section>
  );
}
