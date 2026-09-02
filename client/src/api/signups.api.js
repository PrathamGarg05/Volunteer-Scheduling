import api from "./axios";

export const signUpForShift = (programId, shiftId, volunteerId) =>
  api.post(`/programs/${programId}/shifts/${shiftId}/signups`, volunteerId ? { volunteerId } : {});

export const cancelSignup = (programId, shiftId, signupId) =>
  api.patch(`/programs/${programId}/shifts/${shiftId}/signups/${signupId}/cancel`);

export const getMySignups = (programId) =>
  api.get(`/programs/${programId}/signups/mine`);