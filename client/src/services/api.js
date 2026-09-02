import axios from 'axios';

export const AUTH_USER_KEY = 'primeStack.auth.user';

const configuredApiUrl = String(import.meta.env.VITE_API_URL || '').trim();
const apiBaseUrl = configuredApiUrl || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: apiBaseUrl,
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

const getApiOrigin = () => {
  try {
    return new URL(apiBaseUrl, window.location.origin).origin;
  } catch {
    return '';
  }
};

const normalizeImageUrl = value => {
  if (typeof value !== 'string') return value;
  const image = value.trim();
  if (!image) return '';

  if (/^(data:image\/|https?:\/\/|blob:)/i.test(image)) return image;
  if (image.startsWith('//')) return `${window.location.protocol}${image}`;

  // Legacy backend-relative image paths must resolve against the Render API host.
  if (image.startsWith('/')) return `${getApiOrigin()}${image}`;

  // Older records may contain raw base64 without a data URL prefix.
  if (/^[A-Za-z0-9+/_\-\s]+=*$/.test(image) && image.length > 100) {
    return `data:image/jpeg;base64,${image.replace(/\s+/g, '')}`;
  }

  return image;
};

const normalizeRecordImages = record => {
  if (!record || typeof record !== 'object') return record;
  const out = { ...record };

  ['logo', 'logoUrl', 'faviconUrl', 'founderImageUrl', 'heroImageUrl', 'imageUrl',
   'coverImage', 'ogImage', 'image', 'thumbnail', 'avatarUrl'].forEach(key => {
    if (typeof out[key] === 'string') out[key] = normalizeImageUrl(out[key]);
  });

  if (out.seo && typeof out.seo === 'object') {
    out.seo = { ...out.seo, ogImage: normalizeImageUrl(out.seo.ogImage) };
  }

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
    if (response.data?.data) {
      response.data.data = response.config?.url === '/site-settings'
        ? normalizeSiteSettings(response.data.data)
        : normalizeApiData(response.data.data);
    }
    return response;
  },
  error => {
    if (error.code === 'ECONNABORTED') error.message = 'Request timed out';
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
    if (!getStoredAuthUser()) return { data: { success: true, data: { user: null } } };
    const response = await api.get('/auth/me');
    const user = response.data?.data?.user;
    if (user) saveAuthUser(user);
    return response;
  },
  logout: async () => {
    try { return await api.post('/auth/logout'); }
    finally {
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

export const contactApi = { create: data => api.post('/contact', data) };
export const testimonialsApi = { list: (params = {}) => api.get('/testimonials', { params }) };
export const newsletterApi = { subscribe: email => api.post('/newsletter', { email }) };
export const customerApi = { dashboard: () => api.get('/customer/dashboard') };

export const uploadsApi = {
  image: file => {
    const form = new FormData();
    form.append('image', file);
    return api.post('/uploads/image', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000,
    });
  },
};
