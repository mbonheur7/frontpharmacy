import { api } from "./client";

export const medicinesApi = {
  list: (params) => api.get("/medicines", params), // { search, status, expiry_before }
  get: (id) => api.get(`/medicines/${id}`),
  create: (payload) => api.post("/medicines", payload),
  update: (id, payload) => api.patch(`/medicines/${id}`, payload), // non-price fields only
  updatePricing: (id, payload) => api.patch(`/medicines/${id}/pricing`, payload), // Admin
  updateStatus: (id, status) => api.patch(`/medicines/${id}/status`, { status }), // Admin
  deactivate: (id) => api.post(`/medicines/${id}/deactivate`), // Admin
  reactivate: (id) => api.post(`/medicines/${id}/reactivate`), // Admin

  // Stock movements — nested under medicines, both roles (see business
  // rules enforced server-side: 'received' and 'sale' reasons are
  // rejected on a Discontinued medicine by the backend itself).
  addStockMovement: (id, payload) => api.post(`/medicines/${id}/stock-movements`, payload),
  listStockMovements: (id) => api.get(`/medicines/${id}/stock-movements`),
};

export const STOCK_MOVEMENT_REASONS = [
  { value: "received", label: "Received (new stock)" },
  { value: "adjustment", label: "Adjustment / recount" },
  { value: "damaged", label: "Damaged" },
  { value: "expired", label: "Expired" },
  { value: "correction", label: "Correction" },
  { value: "other", label: "Other" },
];
