import axios from 'axios';

export const AUTH_USER_KEY = 'primeStack.auth.user';
export const AUTH_TOKEN_KEY = 'primeStack.auth.token';

const configuredApiUrl = String(import.meta.env.VITE_API_URL || '').trim();
const defaultApiUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:5000/api'
  : 'https://name-primestack-api.onrender.com/api';
const apiBaseUrl = configuredApiUrl || defaultApiUrl;

const api = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
  timeout: 20000,
});

export const saveAuthToken = token => {
  if (token) localStorage.setItem(AUTH_TOKEN_KEY, token);
};
export const getStoredAuthToken = () => localStorage.getItem(AUTH_TOKEN_KEY) || '';
export const clearAuthToken = () => localStorage.removeItem(AUTH_TOKEN_KEY);
export const saveAuthUser = user => { if (user) localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user)); };
export const getStoredAuthUser = () => { try { return JSON.parse(localStorage.getItem(AUTH_USER_KEY) || 'null'); } catch { return null; } };
export const clearAuthUser = () => { localStorage.removeItem(AUTH_USER_KEY); clearAuthToken(); };

api.interceptors.request.use(config => {
  const token = getStoredAuthToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const getApiOrigin = () => {
  try { return new URL(apiBaseUrl, window.location.origin).origin; } catch { return ''; }
};

export const normalizeImageUrl = value => {
  if (typeof value !== 'string') return value;
  const image = value.trim();
  if (!image) return '';
  if (/^(data:image\/|https?:\/\/|blob:)/i.test(image)) return image;
  if (image.startsWith('//')) return `${window.location.protocol}${image}`;
  if (image.startsWith('/')) return `${getApiOrigin()}${image}`;
  if (/^[A-Za-z0-9+/_\-\s]+=*$/.test(image) && image.length > 100) return `data:image/jpeg;base64,${image.replace(/\s+/g, '')}`;
  return image;
};

const normalizeRecordImages = record => {
  if (!record || typeof record !== 'object') return record;
  const out = { ...record };
  ['logo', 'logoUrl', 'faviconUrl', 'founderImageUrl', 'heroImageUrl', 'imageUrl', 'coverImage', 'ogImage', 'image', 'thumbnail', 'avatarUrl'].forEach(key => {
    if (typeof out[key] === 'string') out[key] = normalizeImageUrl(out[key]);
  });
  ['screenshots', 'images', 'gallery'].forEach(key => {
    if (Array.isArray(out[key])) out[key] = out[key].map(normalizeImageUrl).filter(Boolean);
  });
  if (out.seo && typeof out.seo === 'object') out.seo = { ...out.seo, ogImage: normalizeImageUrl(out.seo.ogImage) };
  return out;
};

const normalizeApiData = data => {
  if (Array.isArray(data)) return data.map(normalizeRecordImages);
  if (data && typeof data === 'object') return normalizeRecordImages(data);
  return data;
};
const normalizeSiteSettings = data => {
  if (!data || typeof data !== 'object') return data;
  const site = normalizeRecordImages(data);
  if (site.home) site.home = normalizeRecordImages(site.home);
  return site;
};

api.interceptors.response.use(
  response => {
    if (response.data?.data) response.data.data = response.config?.url === '/site-settings' ? normalizeSiteSettings(response.data.data) : normalizeApiData(response.data.data);
    return response;
  },
  error => {
    if (error.code === 'ECONNABORTED') error.message = 'Request timed out';
    if (error.response?.status === 401 && !String(error.config?.url || '').includes('/auth/login')) {
      clearAuthUser(); window.dispatchEvent(new Event('primeStackAuthChanged'));
    }
    return Promise.reject(error);
  }
);

export { api };
export default api;

export const authApi = {
  login: async data => { const response = await api.post('/auth/login', data); saveAuthUser(response.data?.data?.user); saveAuthToken(response.data?.data?.token); window.dispatchEvent(new Event('primeStackAuthChanged')); return response; },
  register: async data => { const response = await api.post('/auth/register', data); saveAuthUser(response.data?.data?.user); saveAuthToken(response.data?.data?.token); window.dispatchEvent(new Event('primeStackAuthChanged')); return response; },
  me: async () => { if (!getStoredAuthUser() && !getStoredAuthToken()) return { data: { success: true, data: { user: null } } }; const response = await api.get('/auth/me'); const user = response.data?.data?.user; if (user) saveAuthUser(user); return response; },
  logout: async () => { try { return await api.post('/auth/logout'); } finally { clearAuthUser(); window.dispatchEvent(new Event('primeStackAuthChanged')); } },
  profile: async data => { const response = await api.put('/auth/profile', data); saveAuthUser(response.data?.data?.user); window.dispatchEvent(new Event('primeStackAuthChanged')); return response; },
};
export const siteSettingsApi = { get: () => api.get('/site-settings', { params: { _ts: Date.now() } }), update: async data => { const response = await api.put('/site-settings', data); window.dispatchEvent(new Event('primeStackSiteSettingsChanged')); return response; } };
export const productsApi = { list: (params = {}) => api.get('/products', { params }), get: slug => api.get(`/products/${slug}`) };
export const contentApi = { list: type => api.get(`/${type}`), get: (type, slug) => api.get(`/${type}/${slug}`) };
export const contactApi = { create: data => api.post('/contact', data) };
export const testimonialsApi = { list: (params = {}) => api.get('/testimonials', { params }) };
export const newsletterApi = { subscribe: email => api.post('/newsletter', { email }) };
export const customerApi = { dashboard: () => api.get('/customer/dashboard') };
export const uploadsApi = { image: file => { const form = new FormData(); form.append('image', file); return api.post('/uploads/image', form, { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 60000 }); } };
