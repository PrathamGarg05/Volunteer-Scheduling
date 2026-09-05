import api from "./axios.js";

export const getShiftsByProgram = (programId) => api.get(`/programs/${programId}/shifts`);
export const createShift = (programId, data) => api.post(`/programs/${programId}/shifts`, data);
export const updateShift = (programId, shiftId, data) => api.put(`/programs/${programId}/shifts/${shiftId}`, data);
export const deleteShift = (programId, shiftId) => api.delete(`/programs/${programId}/shifts/${shiftId}`);
export const closeShift = (programId, shiftId) => api.patch(`/programs/${programId}/shifts/${shiftId}/close`);