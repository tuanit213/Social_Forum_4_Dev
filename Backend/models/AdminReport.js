import mongoose from "mongoose";

const adminReportSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 180,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: "",
    },
    type: {
      type: String,
      trim: true,
      default: "content",
      index: true,
    },
    severity: {
      type: String,
      enum: ["critical", "high", "medium", "low"],
      default: "medium",
      index: true,
    },
    status: {
      type: String,
      enum: ["open", "in_review", "dismissed", "resolved", "escalated"],
      default: "open",
      index: true,
    },
    targetType: {
      type: String,
      enum: ["post", "comment", "user", "message", "other"],
      default: "other",
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    targetUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    reporterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    riskScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    notes: [
      {
        note: { type: String, trim: true, maxlength: 1000 },
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    actions: [
      {
        action: { type: String, trim: true },
        reason: { type: String, trim: true, maxlength: 1000 },
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true },
);

adminReportSchema.index({ status: 1, severity: 1, createdAt: -1 });
adminReportSchema.index({ assignedTo: 1, status: 1 });
adminReportSchema.index({ targetUserId: 1, createdAt: -1 });

const AdminReport = mongoose.model("AdminReport", adminReportSchema);
export default AdminReport;
