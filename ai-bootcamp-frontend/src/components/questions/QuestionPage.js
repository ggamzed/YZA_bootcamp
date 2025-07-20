import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { submitAnswer } from '../../api/answers';
import './questionPage.css';

export default function QuestionPage({ token }) {
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState('');
  const [message, setMessage] = useState('');
  const [showExplanation, setShowExplanation] = useState(false);
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

    const start = e => {
      drawing = true;
      ctx.beginPath();
      const r = canvas.getBoundingClientRect();
      ctx.moveTo(e.clientX - r.left, e.clientY - r.top);
    };
    const stop = () => {
      drawing = false;
      ctx.beginPath();
    };
    const draw = e => {
      if (!drawing) return;
      const r = canvas.getBoundingClientRect();
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.strokeStyle = '#000';
      ctx.lineTo(e.clientX - r.left, e.clientY - r.top);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(e.clientX - r.left, e.clientY - r.top);
    };

    canvas.addEventListener('mousedown', start);
    canvas.addEventListener('mouseup', stop);
    canvas.addEventListener('mouseout', stop);
    canvas.addEventListener('mousemove', draw);
    return () => {
      canvas.removeEventListener('mousedown', start);
      canvas.removeEventListener('mouseup', stop);
      canvas.removeEventListener('mouseout', stop);
      canvas.removeEventListener('mousemove', draw);
    };
  }, []);

  async function fetchBatch() {
    const res = await fetch(`/questions/batch?ders_id=${dersId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setQuestions(data);
    setCurrent(0);
    setSelected('');
    setMessage('');
    setShowExplanation(false);
    setAnswerHistory([]);
  }

  const question = questions[current];

  const handleCheck = () => {
    if (!selected) {
      setMessage('Lütfen bir seçenek seçin.');
      return;
    }
    const isCorrect = selected === question.dogru_cevap;
    setMessage(isCorrect ? '✔️ Doğru' : '❌ Yanlış');
    setShowExplanation(true);
  };

  const handleSubmit = async () => {
    const isCorrect = selected === question.dogru_cevap;

    await submitAnswer({
      soru_id: question.soru_id,
      ders_id: question.ders_id,
      konu_id: question.konu_id,
      zorluk: question.zorluk,
      altbaslik_id: question.altbaslik_id,
      is_correct: isCorrect,
      selected,
    }, token);

    const newHistory = [...answerHistory, isCorrect];
    setAnswerHistory(newHistory);

    if (current + 1 < questions.length) {
      setCurrent(current + 1);
      setSelected('');
      setMessage('');
      setShowExplanation(false);
    } else {
      nav('/stats');
    }
  };

  if (questions.length === 0) {
    return <p className="question-page">Yükleniyor…</p>;
  }

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
          {['A', 'B', 'C', 'D', 'E'].map(opt =>
            question.secenekler[opt] ? (
              <button
                key={opt}
                className={selected === opt ? 'selected' : ''}
                onClick={() => setSelected(opt)}
                disabled={showExplanation}
              >
                {opt}) {question.secenekler[opt]}
              </button>
            ) : null
          )}
        </div>

        {message && <p className="question-message">{message}</p>}
        {showExplanation && question.dogru_cevap_aciklamasi && (
          <p className="question-message">
            Açıklama: {question.dogru_cevap_aciklamasi}
          </p>
        )}

        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
          <button
            className="submit-button"
            onClick={handleCheck}
            disabled={showExplanation}
          >
            Kontrol Et
          </button>

          <button
            className="submit-button"
            onClick={handleSubmit}
            disabled={!showExplanation}
          >
            Sonraki Soru
          </button>
        </div>

        <div className="notepad">
          <canvas id="sketchpad" ref={canvasRef} width="400" height="250" />
        </div>
      </div>
    </div>
  );
}
