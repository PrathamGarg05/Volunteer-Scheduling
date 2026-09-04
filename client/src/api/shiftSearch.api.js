import api from "./axios";

export const searchShifts = (params) => api.get("/shifts", { params });