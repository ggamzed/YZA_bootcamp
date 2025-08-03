import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

const getHeaders = (token) => ({
  Authorization: `Bearer ${token}`,
  'Cache-Control': 'no-cache, no-store, must-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0'
});

axios.interceptors.request.use(
  (config) => {
    config.headers = {
      ...config.headers,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    };
    
    if (config.url && !config.url.includes('?')) {
      config.url += `?_t=${Date.now()}`;
    } else if (config.url) {
      config.url += `&_t=${Date.now()}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export async function login(email, password) {
  const res = await axios.post(
    `${API_BASE_URL}/auth/login?_t=${Date.now()}`,
    { email, password }
  );
  return { token: res.data.access_token };
}

export async function register(email, username, password, firstName = '', lastName = '', birthDate = '') {
  const res = await axios.post(
    `${API_BASE_URL}/auth/register?_t=${Date.now()}`,
    { 
      email, 
      username, 
      password, 
      first_name: firstName,
      last_name: lastName,
      birth_date: birthDate ? new Date(birthDate).toISOString() : null
    }
  );
  return res.data;
}

export async function forgotPassword(email) {
  const res = await axios.post(
    `${API_BASE_URL}/auth/forgot-password?_t=${Date.now()}`,
    { email }
  );
  return res.data;
}

export async function resetPassword(token, newPassword) {
  const res = await axios.post(
    `${API_BASE_URL}/auth/reset-password?_t=${Date.now()}`,
    { token, new_password: newPassword }
  );
  return res.data;
}

export async function getCurrentUser(token) {
  const res = await axios.get(`${API_BASE_URL}/auth/me?_t=${Date.now()}`, {
    headers: getHeaders(token),
  });
  return res.data;
}

export async function updateProfile(token, profileData) {
  const res = await axios.put(`${API_BASE_URL}/auth/update-profile?_t=${Date.now()}`, profileData, {
    headers: getHeaders(token),
  });
  return res.data;
}

export async function changePassword(token, currentPassword, newPassword) {
  const res = await axios.post(`${API_BASE_URL}/auth/change-password?_t=${Date.now()}`, {
    current_password: currentPassword,
    new_password: newPassword
  }, {
    headers: getHeaders(token),
  });
  return res.data;
}

export async function updatePrivacySettings(token, privacySettings) {
  const res = await axios.put(`${API_BASE_URL}/auth/update-privacy?_t=${Date.now()}`, privacySettings, {
    headers: getHeaders(token),
  });
  return res.data;
}
