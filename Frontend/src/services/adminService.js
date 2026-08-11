import api from "./authService";

const getData = (request) => request.then((response) => response.data);

export const getAdminMe = () => getData(api.get("/admin/me"));

export const getAdminOverview = (params = {}) => getData(api.get("/admin/overview", { params }));

export const getAdminUsers = (params = {}) => getData(api.get("/admin/users", { params }));

export const getAdminUserById = (id) => getData(api.get(`/admin/users/${id}`));

export const updateAdminUserRole = (id, payload) =>
  getData(api.patch(`/admin/users/${id}/role`, payload));

export const runAdminUserAction = (id, action, payload) =>
  getData(api.post(`/admin/users/${id}/${action}`, payload));

export const getAdminRoles = () => getData(api.get("/admin/roles"));

export const getRoleElevationRequests = () =>
  getData(api.get("/admin/role-elevation-requests"));

export const getAdminContent = (params = {}) =>
  getData(api.get("/admin/content", { params }));

export const runAdminContentAction = (payload) =>
  getData(api.post("/admin/content/actions", payload));

export const getModerationCases = (params = {}) =>
  getData(api.get("/admin/moderation/cases", { params }));

export const getModerationCaseById = (id) =>
  getData(api.get(`/admin/moderation/cases/${id}`));

export const assignModerationCase = (id, payload = {}) =>
  getData(api.post(`/admin/moderation/cases/${id}/assign`, payload));

export const addModerationNote = (id, payload) =>
  getData(api.post(`/admin/moderation/cases/${id}/note`, payload));

export const runModerationAction = (id, payload) =>
  getData(api.post(`/admin/moderation/cases/${id}/actions`, payload));

export const getAuditLogs = (params = {}) =>
  getData(api.get("/admin/audit-logs", { params }));

export const exportAuditLogs = async (params = {}) => {
  const response = await api.get("/admin/audit-logs/export", {
    params,
    responseType: "blob",
  });
  return response.data;
};
