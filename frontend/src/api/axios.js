import axios from 'axios';

const API = axios.create({
  // تغيير الرابط رسمياً لـ https وبورت 5000 الآمن
  baseURL: 'https://localhost:5000/api', 
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.clear();
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default API;