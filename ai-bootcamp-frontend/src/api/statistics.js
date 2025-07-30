import axios from 'axios';

export async function fetchStats(token) {
  const res = await axios.get('/stats/summary', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

export async function fetchCompletedTests(token) {
  const res = await axios.get('/stats/completed-tests', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

export async function fetchSubjectStats(token) {
  const res = await axios.get('/stats/subject-stats', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

export async function fetchTopicStats(token, timeFilter = 'all') {
  const res = await axios.get(`/stats/topic-stats?time_filter=${timeFilter}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

export async function fetchAIRecommendations(token) {
  const res = await axios.get('/stats/ai-recommendations', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}
