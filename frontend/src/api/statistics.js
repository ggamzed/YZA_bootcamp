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

export async function fetchStats(token) {
  console.log('DEBUG: fetchStats called with token:', token ? 'Token exists' : 'No token');
  const res = await axios.get(`${API_BASE_URL}/stats/summary?_t=${Date.now()}`, {
    headers: getHeaders(token),
  });
  console.log('DEBUG: fetchStats response:', res.data.length, 'items');
  return res.data;
}

export async function fetchCompletedTests(token) {
  console.log('DEBUG: fetchCompletedTests called with token:', token ? 'Token exists' : 'No token');
  const res = await axios.get(`${API_BASE_URL}/stats/completed-tests?_t=${Date.now()}`, {
    headers: getHeaders(token),
  });
  console.log('DEBUG: fetchCompletedTests response:', res.data.length, 'items');
  return res.data;
}

export async function fetchSubjectStats(token) {
  const res = await axios.get(`${API_BASE_URL}/stats/subject-stats?_t=${Date.now()}`, {
    headers: getHeaders(token),
  });
  return res.data;
}

export async function fetchTopicStats(token, timeFilter = 'all') {
  const res = await axios.get(`${API_BASE_URL}/stats/topic-stats?time_filter=${timeFilter}&_t=${Date.now()}`, {
    headers: getHeaders(token),
  });
  return res.data;
}

export async function fetchAIRecommendations(token) {
  console.log('DEBUG: fetchAIRecommendations called with token:', token ? 'Token exists' : 'No token');
  const res = await axios.get(`${API_BASE_URL}/stats/ai-recommendations?_t=${Date.now()}`, {
    headers: getHeaders(token),
  });
  console.log('DEBUG: fetchAIRecommendations response:', res.data);
  return res.data;
}

export async function fetchTimeStats(token) {
  console.log('DEBUG: fetchTimeStats called with token:', token ? 'Token exists' : 'No token');
  const res = await axios.get(`${API_BASE_URL}/stats/time-stats?_t=${Date.now()}`, {
    headers: getHeaders(token),
  });
  console.log('DEBUG: fetchTimeStats response:', res.data);
  return res.data;
}
