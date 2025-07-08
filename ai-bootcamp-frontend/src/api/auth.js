import axios from 'axios';

// POST /auth/login
export async function login(email, password) {
  const res = await axios.post(
    '/auth/login',
    { email, password }
  );
  return res.data;
}

// POST /auth/register
export async function register(email, username, password) {
  const res = await axios.post(
    '/auth/register',
    { email, username, password }
  );
  return res.data;
}
