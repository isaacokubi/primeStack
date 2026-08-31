import axios from 'axios';

export const api=axios.create({baseURL:import.meta.env.VITE_API_URL||'http://localhost:5000/api',withCredentials:true,timeout:15000});
api.interceptors.response.use(r=>r,e=>{if(e.code==='ECONNABORTED')e.message='Request timed out';return Promise.reject(e)});
export const authApi={login:data=>api.post('/auth/login',data),register:data=>api.post('/auth/register',data),me:()=>api.get('/auth/me'),logout:()=>api.post('/auth/logout'),profile:data=>api.put('/auth/profile',data)};
export const productsApi={list:(params={})=>api.get('/products',{params}),get:slug=>api.get(`/products/${slug}`)};
export const contentApi={list:type=>api.get(`/${type}`),get:(type,slug)=>api.get(`/${type}/${slug}`)};
export const contactApi={create:data=>api.post('/contact',data)};
export const testimonialsApi={list:(params={})=>api.get('/testimonials',{params})};
export const newsletterApi={subscribe:email=>api.post('/newsletter',{email})};
export const customerApi={dashboard:()=>api.get('/customer/dashboard')};
