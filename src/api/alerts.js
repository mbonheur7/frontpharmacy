import { api } from "./client";

export const alertsApi = {
  lowStock: () => api.get("/alerts/low-stock"),
  criticalStock: () => api.get("/alerts/critical-stock"),
  outOfStock: () => api.get("/alerts/out-of-stock"),
  expired: () => api.get("/alerts/expired"),
  expiringSoon: () => api.get("/alerts/expiring-soon"),
  dashboard: () => api.get("/alerts/dashboard"),
};
