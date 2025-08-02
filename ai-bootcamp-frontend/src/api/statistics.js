import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

export async function fetchStats(token) {
  const res = await axios.get(`${API_BASE_URL}/stats/summary`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

export async function fetchCompletedTests(token) {
  const res = await axios.get(`${API_BASE_URL}/stats/completed-tests`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

export async function fetchSubjectStats(token) {
  const res = await axios.get(`${API_BASE_URL}/stats/subject-stats`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

export async function fetchTopicStats(token, timeFilter = 'all') {
  const res = await axios.get(`${API_BASE_URL}/stats/topic-stats?time_filter=${timeFilter}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

export async function fetchAIRecommendations(token) {
  const res = await axios.get(`${API_BASE_URL}/stats/ai-recommendations`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}
