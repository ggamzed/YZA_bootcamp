import axios from 'axios';


export async function login(email, password) {
  const res = await axios.post(
    '/auth/login',
    { email, password }
  );
  return res.data;
}


export async function register(email, username, password) {
  const res = await axios.post(
    '/auth/register',
    { email, username, password }
  );
  return res.data;
}
