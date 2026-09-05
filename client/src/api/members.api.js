import api from "./axios";

export const getProgramMembers = (programId) => api.get(`/programs/${programId}/members`);
export const addMember = (programId, volunteerId) => api.post(`/programs/${programId}/members`, { volunteerId });
export const removeMember = (programId, volunteerId) => api.delete(`/programs/${programId}/members/${volunteerId}`);