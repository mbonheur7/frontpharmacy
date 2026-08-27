import { api } from "./client";

export const salesApi = {
  checkout: (items) => api.post("/sales", { items }), // items: [{medicine_id, quantity}]
  list: (params) => api.get("/sales", params), // { receipt_number, start, end }
  get: (id) => api.get(`/sales/${id}`),
};
