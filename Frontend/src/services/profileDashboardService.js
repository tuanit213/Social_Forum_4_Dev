import api from "@/services/authService";

export const getProfileDashboard = async () => {
  const { data } = await api.get("/users/me/dashboard");
  return data;
};

export const updateProfileDashboard = async (payload) => {
  const { data } = await api.put("/users/me/dashboard", payload);
  return data;
};
