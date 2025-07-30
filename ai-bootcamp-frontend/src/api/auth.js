import axios from 'axios';

export async function login(email, password) {
  const res = await axios.post(
    '/auth/login',
    { email, password }
  );
  return { token: res.data.access_token };
}

export async function register(email, username, password) {
  const res = await axios.post(
    '/auth/register',
    { email, username, password }
  );
  return res.data;
}

export async function getCurrentUser(token) {
  const res = await axios.get('/auth/me', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}
