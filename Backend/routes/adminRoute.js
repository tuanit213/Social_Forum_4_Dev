import express from "express";
import { verifyToken, requireAdmin } from "../middlewares/authMiddleware.js";
import {
  addModerationNote,
  adminContentAction,
  adminUserAction,
  assignModerationCase,
  exportAuditLogs,
  getAdminContent,
  getAdminMe,
  getAdminOverview,
  getAdminRoles,
  getAdminUserById,
  getAdminUsers,
  getAuditLogs,
  getModerationCaseById,
  getModerationCases,
  getRoleElevationRequests,
  moderationAction,
  patchAdminUserRole,
} from "../controllers/adminController.js";
import { validateObjectId } from "../middlewares/validateResource.js";
import {
  adminContentActionSchema,
  adminRoleSchema,
  adminUserActionSchema,
  moderationActionSchema,
  moderationAssignSchema,
  moderationNoteSchema,
  validateApiBody,
} from "../middlewares/validateApiRequest.js";

const router = express.Router();

router.use(verifyToken, requireAdmin);

router.get("/me", getAdminMe);
router.get("/overview", getAdminOverview);

router.get("/users", getAdminUsers);
router.get("/users/:id", validateObjectId("id"), getAdminUserById);
router.patch("/users/:id/role", validateObjectId("id"), validateApiBody(adminRoleSchema), patchAdminUserRole);
router.post("/users/:id/:action", validateObjectId("id"), validateApiBody(adminUserActionSchema), adminUserAction);

router.get("/roles", getAdminRoles);
router.get("/permissions", getAdminRoles);
router.get("/role-elevation-requests", getRoleElevationRequests);

router.get("/content", getAdminContent);
router.post("/content/actions", validateApiBody(adminContentActionSchema), adminContentAction);

router.get("/moderation/cases", getModerationCases);
router.get("/moderation/cases/:id", validateObjectId("id"), getModerationCaseById);
router.post("/moderation/cases/:id/assign", validateObjectId("id"), validateApiBody(moderationAssignSchema), assignModerationCase);
router.post("/moderation/cases/:id/note", validateObjectId("id"), validateApiBody(moderationNoteSchema), addModerationNote);
router.post("/moderation/cases/:id/actions", validateObjectId("id"), validateApiBody(moderationActionSchema), moderationAction);

router.get("/audit-logs", getAuditLogs);
router.get("/audit-logs/export", exportAuditLogs);

export default router;
