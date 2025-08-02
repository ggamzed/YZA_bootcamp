import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

export async function submitAnswer(data, token) {
  const res = await axios.post(
    `${API_BASE_URL}/answers/submit`,
    data,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data;
}

export async function predictAnswer(data, token) {
  const res = await axios.post(
    `${API_BASE_URL}/answers/predict`,
    data,
    { headers: { Authorization: `Bearer ${token}` } }
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
