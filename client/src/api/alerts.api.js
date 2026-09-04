import api from "./axios";

export const getAlerts = () => api.get("/alerts");
export const dismissAlert = (shiftId) => api.post(`/alerts/${shiftId}/dismiss`);