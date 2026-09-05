import api from "./axios.js";

export const getPrograms = (includeArchived = false) =>
  api.get(`/programs${includeArchived ? "?includeArchived=true" : ""}`);
export const createProgram = (data) => api.post("/programs", data);
export const getProgramById = (id) => api.get(`/programs/${id}`);
export const updateProgram = (id, data) => api.put(`/programs/${id}`, data);

export const archiveProgram = (id) => api.patch(`/programs/${id}/archive`);
export const restoreProgram = (id) => api.patch(`/programs/${id}/restore`);