import axios from 'axios';

export const AUTH_USER_KEY = 'primeStack.auth.user';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true,
  timeout: 15000,
});

export const saveAuthUser = user => {
  if (user) localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
};

export const getStoredAuthUser = () => {
  try {
    return JSON.parse(localStorage.getItem(AUTH_USER_KEY) || 'null');
  } catch {
    return null;
  }
};

export const clearAuthUser = () => localStorage.removeItem(AUTH_USER_KEY);

api.interceptors.response.use(
  response => response,
  error => {
    if (error.code === 'ECONNABORTED') {
      error.message = 'Request timed out';
    }

    // localStorage is only a UI cache. The server session is authoritative.
    // Never keep a stale cached user after an authenticated request fails.
    if (error.response?.status === 401 && !String(error.config?.url || '').includes('/auth/login')) {
      clearAuthUser();
      window.dispatchEvent(new Event('primeStackAuthChanged'));
    }

    return Promise.reject(error);
  }
);

export { api };
export default api;

export const authApi = {
  login: async data => {
    const response = await api.post('/auth/login', data);
    saveAuthUser(response.data?.data?.user);
    window.dispatchEvent(new Event('primeStackAuthChanged'));
    return response;
  },

  register: async data => {
    const response = await api.post('/auth/register', data);
    saveAuthUser(response.data?.data?.user);
    window.dispatchEvent(new Event('primeStackAuthChanged'));
    return response;
  },

  me: async () => {
    // Public pages do not need to make an authenticated request when there
    // is no cached session. This avoids an expected 401 on every page load.
    if (!getStoredAuthUser()) return { data: { success: true, data: { user: null } } };

    const response = await api.get('/auth/me');
    const user = response.data?.data?.user;
    if (user) saveAuthUser(user);
    return response;
  },

  logout: async () => {
    try {
      return await api.post('/auth/logout');
    } finally {
      clearAuthUser();
      window.dispatchEvent(new Event('primeStackAuthChanged'));
    }
  },

  profile: async data => {
    const response = await api.put('/auth/profile', data);
    saveAuthUser(response.data?.data?.user);
    window.dispatchEvent(new Event('primeStackAuthChanged'));
    return response;
  },
};

export const siteSettingsApi = {
  // Use a timestamp query parameter for freshness without sending a custom
  // Cache-Control request header, which would trigger an avoidable CORS
  // preflight against APIs that do not allow that request header.
  get: () => api.get('/site-settings', { params: { _ts: Date.now() } }),
  update: async data => {
    const response = await api.put('/site-settings', data);
    window.dispatchEvent(new Event('primeStackSiteSettingsChanged'));
    return response;
  },
};

export const productsApi = {
  list: (params = {}) => api.get('/products', { params }),
  get: slug => api.get(`/products/${slug}`),
};

export const contentApi = {
  list: type => api.get(`/${type}`),
  get: (type, slug) => api.get(`/${type}/${slug}`),
};

export const contactApi = {
  create: data => api.post('/contact', data),
};

export const testimonialsApi = {
  list: (params = {}) => api.get('/testimonials', { params }),
};

export const newsletterApi = {
  subscribe: email => api.post('/newsletter', { email }),
};

export const customerApi = {
  dashboard: () => api.get('/customer/dashboard'),
};
