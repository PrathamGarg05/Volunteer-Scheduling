import api from "./axios";

export const getShiftTimeline = (programId, shiftId) =>
  api.get(`/programs/${programId}/shifts/${shiftId}/events`);

export const addShiftNote = (programId, shiftId, message) =>
  api.post(`/programs/${programId}/shifts/${shiftId}/events/notes`, { message });