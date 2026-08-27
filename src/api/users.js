import { api } from "./client";

// Admin only, enforced server-side. Note: the backend intentionally has
// no delete-user endpoint (accounts are soft-disabled via is_active only,
// per an explicit earlier decision) — there is no removeUser() here
// because there is nothing on the backend for it to call.
export const usersApi = {
  list: () => api.get("/users"),
  create: (payload) => api.post("/users", payload), // { username, password, fullname, role }
  resetPassword: (id, password) => api.patch(`/users/${id}/password`, { password }),
  setStatus: (id, isActive) => api.patch(`/users/${id}/status`, { is_active: isActive }),
};
