import { api } from "./client";

// Admin only, enforced server-side.
export const activityLogsApi = {
  list: (params) => api.get("/activity-logs", params), // { action, user_id, start, end }
};
