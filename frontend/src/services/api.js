import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Injecter le token JWT automatiquement
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('vtc_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Gérer les erreurs 401 (session expirée)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('vtc_token');
      localStorage.removeItem('vtc_driver');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const simulateAPI = {
  calculate: (departureAddress, arrivalAddress) =>
    api.post('/simulate', { departureAddress, arrivalAddress }, { timeout: 20000 }),
};

export const reservationAPI = {
  create: (data) => api.post('/reservations', data),
  getAll: (params) => api.get('/reservations', { params }),
  getOne: (id) => api.get(`/reservations/${id}`),
  updateStatus: (id, status) => api.put(`/reservations/${id}/status`, { status }),
  complete: (id, price) => api.put(`/reservations/${id}/complete`, { price }),
  downloadReservationPdf: (id) => api.get(`/reservations/${id}/pdf-reservation`, { responseType: 'blob' }),
  downloadInvoicePdf: (id) => api.get(`/reservations/${id}/pdf-invoice`, { responseType: 'blob' }),
};

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
  changePassword: (data) => api.put('/auth/change-password', data),
};

export const statsAPI = {
  get: () => api.get('/stats'),
};

export function downloadBlob(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

export default api;
