import { api } from "./client";

export const medicineCommentsApi = {
  list: (medicineId) =>
    api.get(`/medicines/${medicineId}/comments`),

  create: (medicineId, payload) =>
    api.post(`/medicines/${medicineId}/comments`, payload),

  delete: (medicineId, commentId) =>
    api.delete(`/medicines/${medicineId}/comments/${commentId}`),
};