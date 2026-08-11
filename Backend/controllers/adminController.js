import mongoose from "mongoose";
import xss from "xss";
import User from "../models/User.js";
import Post from "../models/Post.js";
import Comment from "../models/Comment.js";
import AuditLog from "../models/AuditLog.js";
import AdminReport from "../models/AdminReport.js";
import redisClient from "../config/redis.js";

const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN"];
const USER_ROLES = ["MEMBER", "MODERATOR", "ADMIN", "SUPER_ADMIN"];
const USER_STATUSES = ["active", "warned", "suspended", "banned"];
const REPORT_STATUSES = ["open", "in_review", "dismissed", "resolved", "escalated"];
const REPORT_SEVERITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3 };
const CONTENT_TYPES = ["all", "post", "comment"];
const POST_STATUSES = ["public", "private", "draft", "archived"];
const COMMENT_STATUSES = ["active", "hidden", "deleted"];

const PERMISSIONS = [
  { code: "users.read", label: "View users", domain: "User Management" },
  { code: "users.write", label: "Manage users", domain: "User Management" },
  { code: "roles.write", label: "Change roles", domain: "Roles & Permissions" },
  { code: "moderation.read", label: "View moderation cases", domain: "Trust Safety" },
  { code: "moderation.action", label: "Apply moderation action", domain: "Trust Safety" },
  { code: "audit.read", label: "View audit logs", domain: "System Audit" },
  { code: "audit.export", label: "Export audit logs", domain: "System Audit" },
];

const ROLE_PERMISSIONS = {
  SUPER_ADMIN: PERMISSIONS.map((permission) => permission.code),
  ADMIN: [
    "users.read",
    "users.write",
    "roles.write",
    "moderation.read",
    "moderation.action",
    "audit.read",
    "audit.export",
  ],
  MODERATOR: ["moderation.read", "moderation.action"],
  MEMBER: [],
};

const pickPublicUser = (user) => ({
  id: user._id,
  username: user.Username,
  displayName: user.displayName,
  email: user.email,
  avatarUrl: user.avatarUrl || "",
  role: user.role || "MEMBER",
  status: user.status || "active",
  reputation: user.stats?.globalRank || user.stats?.postCount || 0,
  postCount: user.stats?.postCount || 0,
  joinedAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const cleanText = (value, fallback = "") => {
  if (typeof value !== "string") return fallback;
  return xss(value.trim()).slice(0, 1000);
};

const getPagination = (query) => {
  const page = Math.max(Number.parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(Number.parseInt(query.limit, 10) || 20, 1), 100);
  return { page, limit, skip: (page - 1) * limit };
};

const getRangeStart = (range = "7d") => {
  const now = Date.now();
  const hours = range === "24h" ? 24 : range === "30d" ? 24 * 30 : 24 * 7;
  return new Date(now - hours * 60 * 60 * 1000);
};

const buildTrafficSeries = (posts, range = "7d") => {
  const now = new Date();
  const bucketCount = range === "24h" ? 12 : range === "30d" ? 15 : 7;
  const bucketMs = range === "24h" ? 2 * 60 * 60 * 1000 : range === "30d" ? 2 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
  const buckets = Array.from({ length: bucketCount }, (_, index) => {
    const timestamp = new Date(now.getTime() - (bucketCount - 1 - index) * bucketMs);
    return { timestamp, value: 0 };
  });

  posts.forEach((post) => {
    const createdAt = new Date(post.createdAt).getTime();
    const index = Math.floor((createdAt - buckets[0].timestamp.getTime()) / bucketMs);
    if (index >= 0 && index < buckets.length) {
      buckets[index].value += 1;
    }
  });

  return buckets;
};

const redactUser = (user) => {
  if (!user) return null;
  return {
    id: user._id?.toString?.() || user.id,
    username: user.Username,
    email: user.email,
    role: user.role || "MEMBER",
    status: user.status || "active",
  };
};

export const writeAuditLog = async (req, action, targetType, targetId, options = {}) => {
  try {
    await AuditLog.create({
      actorId: req.currentUser?._id,
      actorUsername: req.currentUser?.Username || req.user?.username || "system",
      actorRole: req.currentUser?.role || "SYSTEM",
      action,
      targetType,
      targetId: targetId?.toString?.() || targetId || "",
      status: options.status || "SUCCESS",
      before: options.before || null,
      after: options.after || null,
      reason: cleanText(options.reason || ""),
      ip: req.ip || "",
      userAgent: req.get("user-agent") || "",
      requestId: req.get("x-request-id") || "",
    });
  } catch (error) {
    console.error("writeAuditLog error", error.name, error.message);
  }
};

const buildUserFilter = (query) => {
  const filter = {};
  const search = cleanText(query.search || "");
  if (search) {
    filter.$or = [
      { Username: { $regex: search, $options: "i" } },
      { displayName: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
  }

  if (USER_ROLES.includes(query.role)) filter.role = query.role;
  if (USER_STATUSES.includes(query.status)) filter.status = query.status;
  if (query.staff === "true") filter.role = { $in: ADMIN_ROLES };
  if (query.moderator === "true") filter.role = "MODERATOR";

  return filter;
};

export const getAdminMe = async (req, res) => {
  return res.status(200).json({
    user: pickPublicUser(req.currentUser),
    permissions: ROLE_PERMISSIONS[req.currentUser.role] || [],
  });
};

export const getAdminOverview = async (req, res) => {
  try {
    const start = getRangeStart(req.query.range);
    const [totalUsers, dailyPosts, activeReports, moderationBacklog, recentActivity] =
      await Promise.all([
        User.countDocuments(),
        Post.countDocuments({ createdAt: { $gte: start } }),
        AdminReport.countDocuments({ status: { $in: ["open", "in_review", "escalated"] } }),
        AdminReport.countDocuments({ status: { $in: ["open", "in_review"] } }),
        AuditLog.find()
          .sort({ createdAt: -1 })
          .limit(8)
          .select("actorUsername actorRole action targetType targetId status createdAt"),
      ]);

    const postsInRange = await Post.find({ createdAt: { $gte: start } }).select("createdAt").lean();
    const traffic = buildTrafficSeries(postsInRange, req.query.range);

    const queue = await AdminReport.find({ status: { $in: ["open", "in_review", "escalated"] } })
      .populate("reporterId", "Username displayName")
      .populate("assignedTo", "Username displayName")
      .sort({ createdAt: 1 })
      .limit(30)
      .lean();

    const priorityQueue = queue
      .sort((a, b) => {
        const severityDiff = REPORT_SEVERITY_ORDER[a.severity] - REPORT_SEVERITY_ORDER[b.severity];
        if (severityDiff !== 0) return severityDiff;
        return new Date(a.createdAt) - new Date(b.createdAt);
      })
      .slice(0, 8);

    return res.status(200).json({
      kpis: {
        totalUsers,
        dailyPosts,
        activeReports,
        moderationBacklog,
        activeSystemAlerts: 0,
      },
      traffic,
      platformHealth: [
        { name: "MongoDB", status: mongoose.connection.readyState === 1 ? "connected" : "unavailable" },
        { name: "Redis", status: redisClient.status || "unavailable" },
        { name: "Telemetry", status: "not_configured" },
      ],
      recentActivity,
      priorityQueue,
    });
  } catch (error) {
    console.error("getAdminOverview error", error.name, error.message);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const getAdminUsers = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const filter = buildUserFilter(req.query);
    const sortField = ["createdAt", "Username", "email", "role", "status"].includes(req.query.sort)
      ? req.query.sort
      : "createdAt";
    const sortOrder = req.query.order === "asc" ? 1 : -1;

    const [users, total] = await Promise.all([
      User.find(filter)
        .select("Username displayName email avatarUrl role status stats createdAt updatedAt")
        .sort({ [sortField]: sortOrder })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(filter),
    ]);

    return res.status(200).json({
      users: users.map(pickPublicUser),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("getAdminUsers error", error.name, error.message);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const getAdminUserById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "User id không hợp lệ" });
    }

    const user = await User.findById(req.params.id)
      .select("Username displayName email avatarUrl role status stats warnings adminNotes createdAt updatedAt")
      .lean();
    if (!user) return res.status(404).json({ message: "Không tìm thấy user" });

    const [postsCount, commentsCount, reports, auditLogs] = await Promise.all([
      Post.countDocuments({ userId: user._id }),
      Comment.countDocuments({ userId: user._id }),
      AdminReport.find({ targetUserId: user._id }).sort({ createdAt: -1 }).limit(5).lean(),
      AuditLog.find({ targetType: "user", targetId: user._id.toString() }).sort({ createdAt: -1 }).limit(8).lean(),
    ]);

    return res.status(200).json({
      user: pickPublicUser(user),
      stats: {
        postsCount,
        commentsCount,
        warningsCount: user.warnings?.length || 0,
      },
      warnings: user.warnings || [],
      adminNotes: user.adminNotes || [],
      reports,
      auditLogs,
    });
  } catch (error) {
    console.error("getAdminUserById error", error.name, error.message);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

const ensureMutableTargetUser = async (req, targetUser) => {
  if (!targetUser) return "Không tìm thấy user";
  if (targetUser._id.toString() === req.currentUser._id.toString()) {
    return "Admin không được tự thay đổi quyền hoặc trạng thái của chính mình";
  }
  if (targetUser.role === "SUPER_ADMIN") {
    const superAdminCount = await User.countDocuments({ role: "SUPER_ADMIN", status: { $ne: "banned" } });
    if (superAdminCount <= 1) {
      return "Không thể tác động Super Admin cuối cùng";
    }
  }
  return "";
};

export const patchAdminUserRole = async (req, res) => {
  try {
    const nextRole = req.body.role;
    const reason = cleanText(req.body.reason);
    if (!USER_ROLES.includes(nextRole)) return res.status(400).json({ message: "Role không hợp lệ" });
    if (!reason) return res.status(400).json({ message: "Cần nhập lý do thay đổi role" });
    if (nextRole === "SUPER_ADMIN" && req.currentUser.role !== "SUPER_ADMIN") {
      return res.status(403).json({ message: "Chỉ Super Admin được cấp quyền Super Admin" });
    }

    const targetUser = await User.findById(req.params.id);
    const validationMessage = await ensureMutableTargetUser(req, targetUser);
    if (validationMessage) return res.status(400).json({ message: validationMessage });

    const before = redactUser(targetUser);
    targetUser.role = nextRole;
    targetUser.lastAdminActionAt = new Date();
    await targetUser.save();

    await writeAuditLog(req, "USER_ROLE_CHANGE", "user", targetUser._id, {
      before,
      after: redactUser(targetUser),
      reason,
    });

    return res.status(200).json({ user: pickPublicUser(targetUser) });
  } catch (error) {
    console.error("patchAdminUserRole error", error.name, error.message);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const adminUserAction = async (req, res) => {
  try {
    const action = req.params.action;
    const reason = cleanText(req.body.reason);
    const note = cleanText(req.body.note);
    if (!["warn", "suspend", "ban", "reactivate"].includes(action)) {
      return res.status(400).json({ message: "Action không hợp lệ" });
    }
    if (action !== "reactivate" && !reason) {
      return res.status(400).json({ message: "Cần nhập lý do thao tác admin" });
    }

    const targetUser = await User.findById(req.params.id);
    const validationMessage = await ensureMutableTargetUser(req, targetUser);
    if (validationMessage) return res.status(400).json({ message: validationMessage });

    const before = redactUser(targetUser);
    if (action === "warn") {
      targetUser.status = "warned";
      targetUser.warnings.push({ reason, createdBy: req.currentUser._id });
    } else if (action === "suspend") {
      targetUser.status = "suspended";
    } else if (action === "ban") {
      targetUser.status = "banned";
    } else if (action === "reactivate") {
      targetUser.status = "active";
    }

    if (note) {
      targetUser.adminNotes.push({ note, createdBy: req.currentUser._id });
    }
    targetUser.lastAdminActionAt = new Date();
    await targetUser.save();

    await writeAuditLog(req, `USER_${action.toUpperCase()}`, "user", targetUser._id, {
      before,
      after: redactUser(targetUser),
      reason,
    });

    return res.status(200).json({ user: pickPublicUser(targetUser) });
  } catch (error) {
    console.error("adminUserAction error", error.name, error.message);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const getAdminRoles = async (req, res) => {
  return res.status(200).json({
    roles: USER_ROLES.map((role) => ({
      id: role,
      name: role.replace("_", " "),
      permissions: ROLE_PERMISSIONS[role] || [],
      editable: role !== "MEMBER" && role !== "SUPER_ADMIN",
    })),
    permissions: PERMISSIONS,
    source: "server_rbac_config",
    elevationRequestsConfigured: false,
  });
};

export const getRoleElevationRequests = async (req, res) => {
  return res.status(200).json({
    configured: false,
    requests: [],
    message: "Role elevation workflow chưa có collection thực tế.",
  });
};

const buildContentSearch = (fields, search) => {
  if (!search) return {};
  return {
    $or: fields.map((field) => ({ [field]: { $regex: search, $options: "i" } })),
  };
};

const mapPostContent = (post) => ({
  id: post._id,
  type: "post",
  title: post.title || "Bài viết không có tiêu đề",
  content: post.content || "",
  status: post.status,
  author: post.userId?.displayName || post.userId?.Username || "Không có dữ liệu",
  tags: post.tags || [],
  commentsCount: post.commentsCount || 0,
  createdAt: post.createdAt,
  updatedAt: post.updatedAt,
});

const mapCommentContent = (comment) => ({
  id: comment._id,
  type: "comment",
  title: "Bình luận",
  content: comment.content || "",
  status: comment.status,
  author: comment.userId?.displayName || comment.userId?.Username || "Không có dữ liệu",
  postId: comment.postId,
  createdAt: comment.createdAt,
  updatedAt: comment.updatedAt,
});

export const getAdminContent = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const type = CONTENT_TYPES.includes(req.query.type) ? req.query.type : "all";
    const search = cleanText(req.query.search || "");
    const status = cleanText(req.query.status || "");
    const fetchLimit = skip + limit;

    const postFilter = {
      ...buildContentSearch(["title", "content", "tags"], search),
    };
    if (POST_STATUSES.includes(status)) postFilter.status = status;

    const commentFilter = {
      ...buildContentSearch(["content"], search),
    };
    if (COMMENT_STATUSES.includes(status)) commentFilter.status = status;

    const includePosts = type === "all" || type === "post";
    const includeComments = type === "all" || type === "comment";

    const [posts, comments, postTotal, commentTotal, postStats, commentStats] = await Promise.all([
      includePosts
        ? Post.find(postFilter)
            .populate("userId", "Username displayName avatarUrl")
            .sort({ createdAt: -1 })
            .limit(fetchLimit)
            .lean()
        : [],
      includeComments
        ? Comment.find(commentFilter)
            .populate("userId", "Username displayName avatarUrl")
            .sort({ createdAt: -1 })
            .limit(fetchLimit)
            .lean()
        : [],
      includePosts ? Post.countDocuments(postFilter) : 0,
      includeComments ? Comment.countDocuments(commentFilter) : 0,
      Post.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
      Comment.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    ]);

    const items = [...posts.map(mapPostContent), ...comments.map(mapCommentContent)]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(skip, skip + limit);
    const total = postTotal + commentTotal;

    return res.status(200).json({
      items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      stats: {
        posts: postStats.reduce((acc, item) => ({ ...acc, [item._id || "unknown"]: item.count }), {}),
        comments: commentStats.reduce((acc, item) => ({ ...acc, [item._id || "unknown"]: item.count }), {}),
      },
    });
  } catch (error) {
    console.error("getAdminContent error", error.name, error.message);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const adminContentAction = async (req, res) => {
  try {
    const { targetType, targetId, action } = req.body;
    const reason = cleanText(req.body.reason);
    if (!["post", "comment"].includes(targetType)) {
      return res.status(400).json({ message: "Loại nội dung không hợp lệ" });
    }
    if (!mongoose.Types.ObjectId.isValid(targetId)) {
      return res.status(400).json({ message: "Mã nội dung không hợp lệ" });
    }
    if (!reason) return res.status(400).json({ message: "Cần nhập lý do" });

    let contentDoc;
    let nextStatus;

    if (targetType === "post") {
      if (!["archive_post", "restore_post"].includes(action)) {
        return res.status(400).json({ message: "Action không hợp lệ" });
      }
      contentDoc = await Post.findById(targetId);
      nextStatus = action === "archive_post" ? "archived" : "public";
    }

    if (targetType === "comment") {
      if (!["hide_comment", "restore_comment"].includes(action)) {
        return res.status(400).json({ message: "Action không hợp lệ" });
      }
      contentDoc = await Comment.findById(targetId);
      nextStatus = action === "hide_comment" ? "hidden" : "active";
    }

    if (!contentDoc) return res.status(404).json({ message: "Không tìm thấy nội dung" });

    const before = { status: contentDoc.status };
    contentDoc.status = nextStatus;
    await contentDoc.save();

    await writeAuditLog(req, `CONTENT_${action.toUpperCase()}`, targetType, targetId, {
      before,
      after: { status: nextStatus },
      reason,
    });

    return res.status(200).json({ item: { id: contentDoc._id, type: targetType, status: contentDoc.status } });
  } catch (error) {
    console.error("adminContentAction error", error.name, error.message);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const getModerationCases = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const filter = {};
    const search = cleanText(req.query.search || "");
    if (REPORT_STATUSES.includes(req.query.status)) filter.status = req.query.status;
    if (["critical", "high", "medium", "low"].includes(req.query.severity)) {
      filter.severity = req.query.severity;
    }
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { type: { $regex: search, $options: "i" } },
      ];
    }

    const [cases, total] = await Promise.all([
      AdminReport.find(filter)
        .populate("reporterId", "Username displayName avatarUrl")
        .populate("targetUserId", "Username displayName avatarUrl role status")
        .populate("assignedTo", "Username displayName")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      AdminReport.countDocuments(filter),
    ]);

    return res.status(200).json({
      cases,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("getModerationCases error", error.name, error.message);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const getModerationCaseById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Case id không hợp lệ" });
    }

    const moderationCase = await AdminReport.findById(req.params.id)
      .populate("reporterId", "Username displayName avatarUrl")
      .populate("targetUserId", "Username displayName avatarUrl role status")
      .populate("assignedTo", "Username displayName")
      .lean();

    if (!moderationCase) return res.status(404).json({ message: "Không tìm thấy case" });
    return res.status(200).json({ case: moderationCase });
  } catch (error) {
    console.error("getModerationCaseById error", error.name, error.message);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const assignModerationCase = async (req, res) => {
  try {
    const moderationCase = await AdminReport.findById(req.params.id);
    if (!moderationCase) return res.status(404).json({ message: "Không tìm thấy case" });
    const before = { assignedTo: moderationCase.assignedTo, status: moderationCase.status };
    moderationCase.assignedTo = req.body.assigneeId || req.currentUser._id;
    moderationCase.status = "in_review";
    await moderationCase.save();
    await writeAuditLog(req, "MODERATION_ASSIGN", "report", moderationCase._id, {
      before,
      after: { assignedTo: moderationCase.assignedTo, status: moderationCase.status },
    });
    return res.status(200).json({ case: moderationCase });
  } catch (error) {
    console.error("assignModerationCase error", error.name, error.message);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const addModerationNote = async (req, res) => {
  try {
    const note = cleanText(req.body.note);
    if (!note) return res.status(400).json({ message: "Cần nhập note" });
    const moderationCase = await AdminReport.findById(req.params.id);
    if (!moderationCase) return res.status(404).json({ message: "Không tìm thấy case" });
    moderationCase.notes.push({ note, createdBy: req.currentUser._id });
    await moderationCase.save();
    await writeAuditLog(req, "MODERATION_NOTE_ADD", "report", moderationCase._id, { reason: note });
    return res.status(200).json({ case: moderationCase });
  } catch (error) {
    console.error("addModerationNote error", error.name, error.message);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const moderationAction = async (req, res) => {
  try {
    const action = req.body.action;
    const reason = cleanText(req.body.reason);
    if (!["dismiss", "resolve", "escalate", "hide_content", "warn_user", "suspend_user", "ban_user"].includes(action)) {
      return res.status(400).json({ message: "Action không hợp lệ" });
    }
    if (!reason) return res.status(400).json({ message: "Cần nhập lý do" });

    const moderationCase = await AdminReport.findById(req.params.id);
    if (!moderationCase) return res.status(404).json({ message: "Không tìm thấy case" });
    const before = { status: moderationCase.status };

    if (action === "dismiss") moderationCase.status = "dismissed";
    if (action === "resolve") moderationCase.status = "resolved";
    if (action === "escalate") moderationCase.status = "escalated";
    if (action === "hide_content" && moderationCase.targetId) {
      if (moderationCase.targetType === "post") {
        await Post.findByIdAndUpdate(moderationCase.targetId, { status: "archived" });
      }
      if (moderationCase.targetType === "comment") {
        await Comment.findByIdAndUpdate(moderationCase.targetId, { status: "hidden" });
      }
      moderationCase.status = "resolved";
    }
    if (["warn_user", "suspend_user", "ban_user"].includes(action) && moderationCase.targetUserId) {
      const targetUser = await User.findById(moderationCase.targetUserId);
      if (targetUser) {
        if (action === "warn_user") {
          targetUser.status = "warned";
          targetUser.warnings.push({ reason, createdBy: req.currentUser._id });
        }
        if (action === "suspend_user") targetUser.status = "suspended";
        if (action === "ban_user") targetUser.status = "banned";
        targetUser.lastAdminActionAt = new Date();
        await targetUser.save();
      }
      moderationCase.status = "resolved";
    }

    moderationCase.actions.push({ action, reason, createdBy: req.currentUser._id });
    await moderationCase.save();
    await writeAuditLog(req, `MODERATION_${action.toUpperCase()}`, "report", moderationCase._id, {
      before,
      after: { status: moderationCase.status },
      reason,
    });

    return res.status(200).json({ case: moderationCase });
  } catch (error) {
    console.error("moderationAction error", error.name, error.message);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

const buildAuditFilter = (query) => {
  const filter = {};
  const search = cleanText(query.search || "");
  if (query.action) filter.action = { $regex: cleanText(query.action), $options: "i" };
  if (query.targetType) filter.targetType = cleanText(query.targetType);
  if (query.status && ["SUCCESS", "FAILED"].includes(query.status)) filter.status = query.status;
  if (query.actorRole) filter.actorRole = cleanText(query.actorRole);
  if (query.from || query.to) {
    filter.createdAt = {};
    if (query.from) filter.createdAt.$gte = new Date(query.from);
    if (query.to) filter.createdAt.$lte = new Date(query.to);
  }
  if (search) {
    filter.$or = [
      { actorUsername: { $regex: search, $options: "i" } },
      { action: { $regex: search, $options: "i" } },
      { targetType: { $regex: search, $options: "i" } },
      { targetId: { $regex: search, $options: "i" } },
    ];
  }
  return filter;
};

export const getAuditLogs = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const filter = buildAuditFilter(req.query);
    const [logs, total] = await Promise.all([
      AuditLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      AuditLog.countDocuments(filter),
    ]);
    return res.status(200).json({
      logs,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      telemetry: {
        latency: "Not configured",
        errorRate: "Not configured",
        jobQueue: "Not configured",
      },
    });
  } catch (error) {
    console.error("getAuditLogs error", error.name, error.message);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const exportAuditLogs = async (req, res) => {
  try {
    const filter = buildAuditFilter(req.query);
    const logs = await AuditLog.find(filter).sort({ createdAt: -1 }).limit(5000).lean();
    await writeAuditLog(req, "AUDIT_EXPORT", "audit_log", "csv", { reason: "CSV export" });
    const rows = [
      ["timestamp", "actor", "role", "action", "targetType", "targetId", "status"],
      ...logs.map((log) => [
        log.createdAt?.toISOString?.() || "",
        log.actorUsername || "",
        log.actorRole || "",
        log.action || "",
        log.targetType || "",
        log.targetId || "",
        log.status || "",
      ]),
    ];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\n");
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", "attachment; filename=\"audit-logs.csv\"");
    return res.status(200).send(csv);
  } catch (error) {
    console.error("exportAuditLogs error", error.name, error.message);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

