import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true,
  timeout: 15000,
});

export const AUTH_USER_KEY = 'primeStack.auth.user';

api.interceptors.response.use(
  response => response,
  error => {
    if (error.code === 'ECONNABORTED') error.message = 'Request timed out';
    return Promise.reject(error);
  },
);

export const saveAuthUser = user => {
  if (user) localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
};

export const getStoredAuthUser = () => {
  try { return JSON.parse(localStorage.getItem(AUTH_USER_KEY) || 'null'); } catch { return null; }
};

export const clearAuthUser = () => localStorage.removeItem(AUTH_USER_KEY);

export { api };
export default api;

export const authApi = {
  login: async data => { const r = await api.post('/auth/login', data); saveAuthUser(r.data?.data?.user); return r; },
  register: async data => { const r = await api.post('/auth/register', data); saveAuthUser(r.data?.data?.user); return r; },
  me: () => api.get('/auth/me'),
  logout: async () => { try { return await api.post('/auth/logout'); } finally { clearAuthUser(); } },
  profile: data => api.put('/auth/profile', data),
};

export const productsApi = { list: (params = {}) => api.get('/products', { params }), get: slug => api.get(`/products/${slug}`) };
export const contentApi = { list: type => api.get(`/${type}`), get: (type, slug) => api.get(`/${type}/${slug}`) };
export const contactApi = { create: data => api.post('/contact', data) };
export const testimonialsApi = { list: (params = {}) => api.get('/testimonials', { params }) };
export const newsletterApi = { subscribe: email => api.post('/newsletter', { email }) };
export const customerApi = { dashboard: () => api.get('/customer/dashboard') };
