import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { submitAnswer } from '../../api/answers';
import './questionPage.css';

export default function QuestionPage({ token }) {
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState('');
  const [message, setMessage] = useState('');
  const [answerHistory, setAnswerHistory] = useState([]);
  const canvasRef = useRef(null);
  const params = new URLSearchParams(useLocation().search);
  const dersId = params.get('ders_id');
  const nav = useNavigate();

  useEffect(() => {
    fetchBatch();
  }, [dersId, token]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let drawing = false;

    const startDrawing = e => {
      drawing = true;
      ctx.beginPath();
      const rect = canvas.getBoundingClientRect();
      ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    };
    const stopDrawing = () => {
      drawing = false;
      ctx.beginPath();
    };
    const draw = e => {
      if (!drawing) return;
      const rect = canvas.getBoundingClientRect();
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.strokeStyle = '#000';
      ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    };

    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);
    canvas.addEventListener('mousemove', draw);

    return () => {
      canvas.removeEventListener('mousedown', startDrawing);
      canvas.removeEventListener('mouseup', stopDrawing);
      canvas.removeEventListener('mouseout', stopDrawing);
      canvas.removeEventListener('mousemove', draw);
    };
  }, []);

  async function fetchBatch() {
    const res = await fetch(`/questions/batch?ders_id=${dersId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    setQuestions(data);
    setCurrent(0);
    setSelected('');
    setMessage('');
    setAnswerHistory([]);
  }

  if (questions.length === 0) {
    return <p className="question-page">Yükleniyor…</p>;
  }

  const question = questions[current];

  const handleSubmit = async () => {
    if (!selected) {
      setMessage('Lütfen bir seçenek seçin.');
      return;
    }

    const isCorrect = selected === question.dogru_cevap;
    await submitAnswer({
      soru_id: question.soru_id,
      ders_id: question.ders_id,
      konu_id: question.konu_id,
      zorluk: question.zorluk,
      is_correct: isCorrect
    }, token);

    const newHistory = [...answerHistory, isCorrect];
    setAnswerHistory(newHistory);

    // İki yanlış varsa batch yenile
    const lastTwo = newHistory.slice(-2);
    if (lastTwo.length === 2 && lastTwo.some(v=>!v)) {
      await fetchBatch();
      return;
    }

    if (current + 1 < questions.length) {
      setCurrent(current + 1);
      setSelected('');
      setMessage('');
    } else {
      nav('/stats');
    }
  };

  return (
    <div className="question-page">
      <div className="question-container">
        <h2>Soru {current + 1}</h2>
        <p>{question.soru_metni}</p>

        {question.gorsel_url && (
          <div className="image-wrapper">
            <img
              src={question.gorsel_url}
              alt="Soru görseli"
              className="question-image"
            />
          </div>
        )}

        <div className="options">
          {['A','B','C','D'].map(opt => (
            <button
              key={opt}
              className={selected===opt ? 'selected' : ''}
              onClick={() => setSelected(opt)}
            >
              {opt}: {question.secenekler[opt]}
            </button>
          ))}
        </div>

        <button className="submit-button" onClick={handleSubmit}>
          Cevapla
        </button>
        {message && <p className="question-message">{message}</p>}

        <div className="notepad">
          <canvas id="sketchpad" ref={canvasRef} width="400" height="250" />
        </div>
      </div>
    </div>
  );
}
