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

// Gérer les erreurs globales (401 session expirée, 402 abonnement requis)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const requestUrl = error.config?.url || '';
      const isAuthAttempt = requestUrl.includes('/auth/login') || requestUrl.includes('/auth/register');
      const hadToken = Boolean(localStorage.getItem('vtc_token'));

      if (hadToken) {
        localStorage.removeItem('vtc_token');
        localStorage.removeItem('vtc_driver');
      }

      if (hadToken && !isAuthAttempt) {
        window.location.href = '/login';
      }
    }
    if (error.response?.status === 402) {
      // Abonnement expiré → rediriger vers l'onglet abonnement du dashboard
      const code = error.response?.data?.code;
      if (code === 'SUBSCRIPTION_REQUIRED' || code === 'ACCOUNT_SUSPENDED') {
        window.dispatchEvent(new CustomEvent('subscription:required', { detail: { code } }));
      }
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
  login:          (data) => api.post('/auth/login', data),
  register:       (data) => api.post('/auth/register', data),
  me:             ()     => api.get('/auth/me'),
  changePassword: (data) => api.put('/auth/change-password', data),
};

export const statsAPI = {
  get: () => api.get('/stats'),
};

export const publicStatsAPI = {
  get: () => api.get('/stats/public'),
};

export const billingAPI = {
  getInfo: () => api.get('/billing/info'),
  createCheckout: (interval = 'month') => api.post('/billing/checkout', { interval }),
  createPortal: () => api.post('/billing/portal'),
};

export const driverPublicAPI = {
  getBySlug: (slug) => api.get(`/drivers/public/${slug}`),
};

export const adminAPI = {
  getGlobalStats:      ()                    => api.get('/admin/stats'),
  getDrivers:          (params)              => api.get('/admin/drivers', { params }),
  getDriverDetail:     (id)                  => api.get(`/admin/drivers/${id}`),
  updateStatus:        (id, status)          => api.put(`/admin/drivers/${id}/status`, { status }),
  notifyDriver:        (id, subject, message)=> api.post(`/admin/drivers/${id}/notify`, { subject, message }),
  getAllReservations:  (params)              => api.get('/admin/reservations', { params }),
  getGlobalClients:    (params)              => api.get('/admin/clients', { params }),
  getPricing:          ()                    => api.get('/admin/pricing'),
  updatePricing:       (data)               => api.put('/admin/pricing', data),
};

export const reviewAPI = {
  getDriverReviews: (params) => api.get('/reviews/driver/me', { params }),
};

export const accountingAPI = {
  getSummary:          (params)               => api.get('/admin/accounting/summary', { params }),
  getDriverStatement:  (driverId, params)     => api.get(`/admin/accounting/${driverId}/statement`, { params }),
  downloadPdf:         (driverId, params)     => api.get(`/admin/accounting/${driverId}/pdf`, { params, responseType: 'blob' }),
  updateCommission:    (driverId, commissionRate) => api.put(`/admin/accounting/${driverId}/commission`, { commissionRate }),
};

export const crmAPI = {
  getClients: (params) => api.get('/crm/clients', { params }),
  exportCsv:  (params) => api.get('/crm/clients/export', { params, responseType: 'blob' }),
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
