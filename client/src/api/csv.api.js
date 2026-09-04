import api from "./axios";

export const exportRoster = (programId) =>
  api.get(`/programs/${programId}/roster.csv`, { responseType: "blob" });