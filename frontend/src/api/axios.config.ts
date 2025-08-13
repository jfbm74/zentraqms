import axios, { 
  AxiosInstance, 
  AxiosError, 
  InternalAxiosRequestConfig,
  AxiosResponse 
} from 'axios';
import { AUTH_ENDPOINTS } from './endpoints';

// Crear instancia de Axios
const axiosInstance: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Flag para prevenir loops infinitos de refresh
let isRefreshing = false;
let failedQueue: any[] = [];

// Procesar cola de requests fallidos
const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  
  failedQueue = [];
};

// REQUEST INTERCEPTOR
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Obtener token del storage
    const token = localStorage.getItem('access_token');
    
    // Agregar token al header si existe
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log en desarrollo
    if (import.meta.env.DEV) {
      console.log(`🚀 ${config.method?.toUpperCase()} ${config.url}`, {
        data: config.data,
        params: config.params,
        headers: config.headers,
      });
    }
    
    return config;
  },
  (error: AxiosError) => {
    console.error('❌ Request error:', error);
    return Promise.reject(error);
  }
);

// RESPONSE INTERCEPTOR
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    // Log exitoso en desarrollo
    if (import.meta.env.DEV) {
      console.log(`✅ Response from ${response.config.url}:`, response.data);
    }
    
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest: any = error.config;
    
    // Log de error en desarrollo
    if (import.meta.env.DEV) {
      console.error(`❌ Response error from ${originalRequest?.url}:`, {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
    }
    
    // Si el error es 401 y no es del endpoint de login o refresh
    if (
      error.response?.status === 401 && 
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.url?.includes(AUTH_ENDPOINTS.LOGIN) &&
      !originalRequest.url?.includes(AUTH_ENDPOINTS.REFRESH)
    ) {
      // Si ya estamos refreshing, agregar a la cola
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return axiosInstance(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }
      
      originalRequest._retry = true;
      isRefreshing = true;
      
      const refreshToken = localStorage.getItem('refresh_token');
      
      if (!refreshToken) {
        // No hay refresh token, limpiar y redirigir
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user_data');
        window.location.href = '/login';
        return Promise.reject(error);
      }
      
      try {
        // Intentar refresh
        const response = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL}${AUTH_ENDPOINTS.REFRESH}`,
          { refresh: refreshToken }
        );
        
        const { access, refresh: newRefresh } = response.data;
        
        // Actualizar tokens
        localStorage.setItem('access_token', access);
        if (newRefresh) {
          localStorage.setItem('refresh_token', newRefresh);
        }
        
        // Procesar cola con nuevo token
        processQueue(null, access);
        
        // Reintentar request original
        originalRequest.headers.Authorization = `Bearer ${access}`;
        return axiosInstance(originalRequest);
        
      } catch (refreshError) {
        // Refresh falló, limpiar todo
        processQueue(refreshError, null);
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user_data');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    
    // Para otros errores, rechazar normalmente
    return Promise.reject(error);
  }
);

export default axiosInstance;