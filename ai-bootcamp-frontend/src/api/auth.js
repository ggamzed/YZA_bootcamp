import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

export async function login(email, password) {
  const res = await axios.post(
    `${API_BASE_URL}/auth/login`,
    { email, password }
  );
  return { token: res.data.access_token };
}

export async function register(email, username, password) {
  const res = await axios.post(
    `${API_BASE_URL}/auth/register`,
    { email, username, password }
  );
  return res.data;
}

export async function getCurrentUser(token) {
  const res = await axios.get(`${API_BASE_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}
