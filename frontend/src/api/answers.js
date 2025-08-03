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

export async function submitAnswer(data, token) {
  const res = await axios.post(
    `${API_BASE_URL}/answers/submit?_t=${Date.now()}`,
    data,
    { headers: getHeaders(token) }
  );
  return res.data;
}

export async function predictAnswer(data, token) {
  const res = await axios.post(
    `${API_BASE_URL}/answers/predict?_t=${Date.now()}`,
    data,
    { headers: getHeaders(token) }
  );
  return res.data;
}

export async function getAnswerPrediction(questionData, token) {
  try {
    const predictionData = {
      user_id: 1,
      ders_id: questionData.ders_id,
      konu_id: questionData.konu_id,
      altbaslik_id: questionData.altbaslik_id,
      zorluk: questionData.zorluk,
      is_correct: questionData.is_correct
    };
    
    const response = await predictAnswer(predictionData, token);
    return response;
  } catch (error) {
    console.error('AI tahmin hatası:', error);
    return {
      prediction_percentage: 50,
      motivational_message: {
        title: "🤖 AI Analizi",
        message: "AI tahmin yapamadı, ama sen yapabilirsin!",
        type: "default",
        emoji: "🤖"
      },
      confidence_level: "low"
    };
  }
}

export const getUserStats = async (token) => {
  try {
    const response = await fetch('http://localhost:8000/answers/user-stats', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Kullanıcı istatistikleri getirme hatası:', error);
    throw error;
  }
};

export const manualCleanup = async (token) => {
  try {
    const response = await fetch('http://localhost:8000/answers/manual-cleanup', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Manuel veri temizleme hatası:', error);
    throw error;
  }
};

export const getTotalQuestionsAnswered = async (token) => {
  try {
    const response = await fetch('http://localhost:8000/answers/total-questions', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Toplam soru sayısı getirme hatası:', error);
    throw error;
  }
};

export const getTotalQuestionsBySubject = async (token) => {
  try {
    const response = await fetch('http://localhost:8000/answers/total-questions-by-subject', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Ders bazlı soru sayısı getirme hatası:', error);
    throw error;
  }
};
