import axios from 'axios';

// One configured client for the whole app.
// withCredentials makes the browser send our httpOnly login cookie.
const api = axios.create({ baseURL: '/api', withCredentials: true });

// Turns any failed request into a friendly message
export const getErrorMessage = (err, fallback = 'Something went wrong. Please try again.') =>
  err?.response?.data?.message ||
  (err?.request ? 'Cannot reach the server. Is the backend running?' : fallback);

export default api;