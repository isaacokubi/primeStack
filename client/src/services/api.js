import axios from 'axios';export const api=axios.create({baseURL:import.meta.env.VITE_API_URL||'http://localhost:5000/api',withCredentials:true});
export const productsApi={list:(params={})=>api.get('/products',{params}),get:(slug)=>api.get(`/products/${slug}`)};
export const contentApi={list:(type)=>api.get(`/${type}`),get:(type,slug)=>api.get(`/${type}/${slug}`)};
export const contactApi={create:(data)=>api.post('/contact',data)};
