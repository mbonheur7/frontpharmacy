import { api } from "./client";

export const reportsApi = {
  inventory: () => api.get("/reports/inventory"),
  purchase: () => api.get("/reports/purchase"), // Admin only (backend-enforced)
  profit: () => api.get("/reports/profit"), // Admin only (backend-enforced)
  daily: () => api.get("/reports/sales/daily"),
  weekly: () => api.get("/reports/sales/weekly"),
  monthly: () => api.get("/reports/sales/monthly"),
  yearly: () => api.get("/reports/sales/yearly"),
  range: (start, end) => api.get("/reports/sales/range", { start, end }),
  bestSelling: () => api.get("/reports/best-selling"),
  lowestSelling: () => api.get("/reports/lowest-selling"),
  expiredMedicines: () => api.get("/reports/expired-medicines"),
};
