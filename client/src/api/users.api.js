import api from "./axios";
export const listVolunteers = () => api.get("/users/volunteers");