import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { submitAnswer } from '../../api/answers';
import './questionPage.css';

export default function QuestionPage({ token }) {
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent]     = useState(0);
  const [selected, setSelected]   = useState('');
  const [message, setMessage]     = useState('');
  const params = new URLSearchParams(useLocation().search);
  const dersId = params.get('ders_id');
  const nav    = useNavigate();

  useEffect(() => {
    async function fetchBatch() {
      const res = await fetch(`/questions/batch?ders_id=${dersId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setQuestions(data);
    }
    fetchBatch();
  }, [dersId, token]);

  if (questions.length === 0) {
    return <p>Yükleniyor…</p>;
  }

  const question = questions[current];

  const handleSubmit = async () => {
    if (!selected) return alert('Lütfen bir şık seçin!');
    const is_correct = selected === question.correct_choice;

    await submitAnswer({
      soru_id: question.soru_id,
      selected: selected,
      ders_id: question.ders_id,
      konu_id: question.konu_id,
      zorluk: question.zorluk,
      is_correct: is_correct ? 1 : 0
    }, token);

    setMessage(is_correct ? 'Doğru!' : 'Yanlış.');

    setTimeout(() => {
      if (current + 1 < questions.length) {
        setCurrent(current + 1);
        setSelected('');
        setMessage('');
      } else {
        nav('/test-complete');
      }
    }, 1000);
  };

  return (
    <div className="question-box">
      <h3>{question.soru_metin}</h3>
      {Object.entries(question.choices).map(([label, text]) => (
        <label key={label} className={selected === label ? 'selected' : ''}>
          <input
            type="radio"
            name="answer"
            value={label}
            checked={selected === label}
            onChange={() => setSelected(label)}
          />
          {label}) {text}
        </label>
      ))}
      <button onClick={handleSubmit}>Cevabı Gönder</button>
      {message && <p className="message">{message}</p>}
      <p>Soru {current + 1} / {questions.length}</p>
    </div>
  );
}
