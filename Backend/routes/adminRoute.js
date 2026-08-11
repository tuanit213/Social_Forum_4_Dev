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

const router = express.Router();

router.use(verifyToken, requireAdmin);

router.get("/me", getAdminMe);
router.get("/overview", getAdminOverview);

router.get("/users", getAdminUsers);
router.get("/users/:id", getAdminUserById);
router.patch("/users/:id/role", patchAdminUserRole);
router.post("/users/:id/:action", adminUserAction);

router.get("/roles", getAdminRoles);
router.get("/permissions", getAdminRoles);
router.get("/role-elevation-requests", getRoleElevationRequests);

router.get("/content", getAdminContent);
router.post("/content/actions", adminContentAction);

router.get("/moderation/cases", getModerationCases);
router.get("/moderation/cases/:id", getModerationCaseById);
router.post("/moderation/cases/:id/assign", assignModerationCase);
router.post("/moderation/cases/:id/note", addModerationNote);
router.post("/moderation/cases/:id/actions", moderationAction);

router.get("/audit-logs", getAuditLogs);
router.get("/audit-logs/export", exportAuditLogs);

export default router;
