import { api } from "./client";

export const chatApi = {
  getGroups: () => api.get("/chat/groups"),

  getMessages: (groupId) =>
    api.get(`/chat/groups/${groupId}/messages`),

  markGroupRead: (groupId) =>
    api.post(`/chat/groups/${groupId}/read`),

  getUnread: () => api.get("/chat/unread"),
};