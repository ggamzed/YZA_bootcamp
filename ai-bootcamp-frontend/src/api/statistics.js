import axios from 'axios';

export async function fetchStats(token) {
  const res = await axios.get('/stats/summary', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}
