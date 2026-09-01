import api from "./axios.js";

export const getShiftsByProgram = (programId) => api.get(`/programs/${programId}/shifts`);
export const createShift = (programId, data) => api.post(`/programs/${programId}/shifts`, data);