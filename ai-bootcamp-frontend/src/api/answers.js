import axios from 'axios';

// POST /answers/submit
export async function submitAnswer(data, token) {
  const res = await axios.post(
    '/answers/submit',
    data,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data;
}

// POST /answers/predict
export async function predictAnswer(data, token) {
  const res = await axios.post(
    '/answers/predict',
    data,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data;
}
