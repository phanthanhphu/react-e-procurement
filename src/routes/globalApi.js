import axios from 'axios';

// 🔧 AUTO CONFIG API BASE URL
const setupApiBaseUrl = () => {
  if (!window.API_BASE_URL) {
    window.API_BASE_URL = window.location.hostname === 'localhost' 
      ? 'http://localhost:8080'
      : `http://${window.location.hostname}:8080`;
  }
  console.log('🌐 API BASE URL:', window.API_BASE_URL);
};
setupApiBaseUrl();

// 🔧 GLOBAL AXIOS INSTANCE
export const apiClient = axios.create({
  baseURL: window.API_BASE_URL,
  timeout: 15000,
  withCredentials: true,
});

// 🔥 SMART REQUEST INTERCEPTOR - DETECT FILE UPLOADS
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    
    // ✅ THÊM TOKEN
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log(`🔑 Token sent: ${token.substring(0, 10)}...`);
    } else if (!token) {
      console.warn('⚠️ No token found in localStorage for request:', config.url);
    }
    
    // 🔥 SMART CONTENT-TYPE DETECTION
    if (config.data instanceof FormData) {
      config.headers['Content-Type'] = 'multipart/form-data';
      console.log(`📎 [${config.method?.toUpperCase()}] ${config.url} → FORM-DATA (Files)`);
    } else if (typeof config.data === 'object' && config.data !== null) {
      config.headers['Content-Type'] = 'application/json';
      console.log(`📄 [${config.method?.toUpperCase()}] ${config.url} → JSON`);
    }
    
    // USER INFO
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      console.log(`👤 User: ${user.email || 'Guest'} → ${config.url}`);
    } catch (e) {}

    return config;
  },
  (error) => Promise.reject(error)
);

// 🔥 RESPONSE INTERCEPTOR
apiClient.interceptors.response.use(
  (response) => {
    console.log(`✅ [${response.status}] ${response.config.url} → OK`);
    return response;
  },
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url;
    console.error(`❌ [${status}] ${url}:`, error.response?.data || error.message); // ✅ Log chi tiết lỗi 500
    
    if (status === 401) {
      console.log('🔓 TOKEN EXPIRED OR INVALID → LOGOUT');
      localStorage.clear();
      if (window.location.pathname !== '/react/login') { // ✅ Sửa thành /react/login
        window.location.href = '/react/login?sessionExpired=true';
      }
    } else if (status === 500) {
      console.error('🚨 SERVER ERROR:', error.response?.data?.message || 'Internal Server Error');
    }
    
    return Promise.reject(error);
  }
);

// 🌐 SUPER SMART FETCH OVERRIDE - FILE UPLOAD SUPPORT!
const originalFetch = window.fetch;
window.fetch = async function(input, init = {}) {
  const url = typeof input === 'string' ? input : input.url;
  const token = localStorage.getItem('token');
  const hasFiles = init?.body instanceof FormData;
  
  // 🔥 SMART HEADERS - DETECT FILES!
  const headers = new Headers(init.headers || {});
  
  if (hasFiles) {
    console.log(`📎 FETCH FILES → ${url} | FormData detected`);
  } else {
    headers.set('Content-Type', 'application/json');
  }
  
  // THÊM TOKEN
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
    console.log(`🔑 Token sent: ${token.substring(0, 10)}...`);
  } else {
    console.warn('⚠️ No token found in localStorage for fetch:', url);
  }
  
  const config = {
    ...init,
    headers,
    credentials: 'include',
  };
  
  console.log(`🌐 FETCH → ${url} | Files: ${hasFiles ? '✓' : '✗'} | Token: ${token ? '✓' : '✗'}`);
  
  try {
    const response = await originalFetch(input, config);
    
    if (response.status === 401) {
      console.log('🔓 FETCH 401 → LOGOUT');
      localStorage.clear();
      if (window.location.pathname !== '/react/login') {
        window.location.href = '/react/login?sessionExpired=true';
      }
    } else if (response.status === 500) {
      const errorData = await response.json().catch(() => ({}));
      console.error('🚨 FETCH SERVER ERROR:', errorData.message || 'Internal Server Error');
    }
    
    console.log(`✅ FETCH [${response.status}] ${url}`);
    return response;
    
  } catch (error) {
    console.error('❌ FETCH ERROR:', url, error);
    throw error;
  }
};

// 🔧 AXIOS OVERRIDE
if (window.axios) {
  const originalAxiosCreate = window.axios.create;
  window.axios.create = function(...args) {
    const instance = originalAxiosCreate.call(this, ...args);
    
    instance.interceptors.request.use((config) => {
      const token = localStorage.getItem('token');
      if (token && !config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      
      if (config.data instanceof FormData) {
        config.headers['Content-Type'] = 'multipart/form-data';
      } else if (typeof config.data === 'object') {
        config.headers['Content-Type'] = 'application/json';
      }
      return config;
    });
    
    return instance;
  };
}

// 🔥 API HELPERS - FILE UPLOAD SUPPORT
export const api = {
  get: (url, params = {}) => apiClient.get(url, { params }),
  post: (url, data = {}) => apiClient.post(url, data),
  postForm: (url, formData) => apiClient.post(url, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  upload: (url, formData) => apiClient.post(url, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
};

// 🛡️ GLOBAL ERROR HANDLER
window.addEventListener('unhandledrejection', (event) => {
  const error = event.reason;
  if (error?.response?.status === 401) {
    localStorage.clear();
    if (window.location.pathname !== '/react/login') {
      window.location.href = '/react/login?globalError=true';
    }
  } else if (error?.response?.status === 500) {
    console.error('🚨 GLOBAL SERVER ERROR:', error.response?.data?.message || 'Internal Server Error');
  }
});

// INIT
console.log('🚀🔥 GLOBAL API v2.2 - SERVER ERROR LOGGING!');
console.log('✅ SMART HEADERS: JSON vs FormData');
console.log('✅ READY FOR PRODUCTION! 🌟');