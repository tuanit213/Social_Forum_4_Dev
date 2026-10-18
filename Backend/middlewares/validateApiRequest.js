import { z } from "zod";
import { validateBody } from "./validateAuthRequest.js";

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Mongo ObjectId không hợp lệ");
const cleanString = (min, max) => z.string().trim().min(min).max(max);
const optionalString = (max) => z.string().trim().max(max).optional();

export const postCreateSchema = z.object({
  title: optionalString(200).default(""),
  content: cleanString(1, 20000),
  codeSnippet: optionalString(100000).default(""),
  mediaUrls: z.array(cleanString(1, 2048)).max(10).optional().default([]),
  tags: z.array(cleanString(1, 50)).max(10).optional().default([]),
  status: z.enum(["public", "private"]).optional().default("public"),
}).strict();

export const postUpdateSchema = z.object({
  title: optionalString(200),
  content: cleanString(1, 20000).optional(),
  tags: z.array(cleanString(1, 50)).max(10).optional(),
}).strict().refine((body) => Object.keys(body).length > 0, "Cần ít nhất một trường cập nhật");

export const reactionSchema = z.object({ emoji: cleanString(1, 16) }).strict();

export const commentCreateSchema = z.object({
  postId: objectId,
  content: cleanString(1, 10000),
  parentCommentId: objectId.nullish(),
}).strict();

export const commentUpdateSchema = z.object({ content: cleanString(1, 10000) }).strict();

export const conversationCreateSchema = z.object({ receiverId: objectId }).strict();
export const groupCreateSchema = z.object({
  groupName: cleanString(1, 100),
  memberIds: z.array(objectId).max(100).default([]),
}).strict();
export const groupRenameSchema = z.object({ groupName: cleanString(1, 100) }).strict();
export const groupInviteSchema = z.object({ memberIds: z.array(objectId).min(1).max(100) }).strict();
export const messageUpdateSchema = z.object({ content: cleanString(1, 10000) }).strict();

export const adminRoleSchema = z.object({
  role: z.enum(["MEMBER", "MODERATOR", "ADMIN", "SUPER_ADMIN"]),
  reason: cleanString(1, 500),
}).strict();
export const adminUserActionSchema = z.object({
  reason: optionalString(500).default(""),
  note: optionalString(1000).default(""),
}).strict();
export const adminContentActionSchema = z.object({
  targetType: z.enum(["post", "comment"]),
  targetId: objectId,
  action: z.enum(["archive_post", "restore_post", "hide_comment", "restore_comment"]),
  reason: cleanString(1, 500),
}).strict();
export const moderationAssignSchema = z.object({ assigneeId: objectId.optional() }).strict();
export const moderationNoteSchema = z.object({ note: cleanString(1, 1000) }).strict();
export const moderationActionSchema = z.object({
  action: z.enum(["dismiss", "resolve", "escalate", "hide_content", "warn_user", "suspend_user", "ban_user"]),
  reason: cleanString(1, 500),
}).strict();

export const validateApiBody = (schema) => validateBody(schema);
