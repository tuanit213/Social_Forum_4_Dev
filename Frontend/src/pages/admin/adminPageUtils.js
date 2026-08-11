import React from "react";

export const formatNumber = (value) => new Intl.NumberFormat("vi-VN").format(Number(value || 0));

export const formatDateTime = (value) => {
  if (!value) return "Chưa có";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Chưa có";
  return date.toLocaleString("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  });
};

export const timeAgo = (value) => {
  if (!value) return "Chưa có";
  const diff = Date.now() - new Date(value).getTime();
  if (Number.isNaN(diff)) return "Chưa có";
  const minutes = Math.max(Math.floor(diff / 60000), 0);
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  return `${Math.floor(hours / 24)} ngày trước`;
};

export const statusColor = (status = "") => {
  if (["active", "connected", "SUCCESS", "resolved"].includes(status)) return "green";
  if (["public", "private", "draft", "warned", "in_review", "medium", "high", "escalated"].includes(status)) return "yellow";
  if (["archived", "hidden", "deleted", "banned", "suspended", "critical", "FAILED", "open"].includes(status)) return "red";
  return "blue";
};

export function EmptyState({ text = "Chưa có dữ liệu." }) {
  return React.createElement("div", { className: "admin-empty" }, text);
}

export function ErrorState({ message, onRetry }) {
  return React.createElement(
    "div",
    { className: "admin-error" },
    React.createElement(
      "div",
      null,
      React.createElement("div", null, message || "Không tải được dữ liệu."),
      onRetry
        ? React.createElement(
            "button",
            { className: "admin-button-secondary", type: "button", onClick: onRetry, style: { marginTop: 12 } },
            "Thử lại",
          )
        : null,
    ),
  );
}

export function LoadingBlock() {
  return React.createElement("div", { className: "admin-skeleton" });
}
