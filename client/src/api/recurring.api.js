import api from "./axios";

export const generateRecurringShifts = (programId, data) =>
  api.post(`/programs/${programId}/shifts/recurring`, data);