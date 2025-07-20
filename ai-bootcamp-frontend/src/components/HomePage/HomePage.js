import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { submitAnswer } from '../../api/answers';
import './HomePage.css';

export default function HomePage({ token, setToken }) {
  const navigate = useNavigate();

  const [dersId, setDersId]       = useState('');
  const [etiket, setEtiket]       = useState('');
  const [questions, setQuestions] = useState([]);
  const [idx, setIdx]             = useState(0);
  const [sel, setSel]             = useState('');
  const [msg, setMsg]             = useState('');
  const [loading, setLoading]     = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);

  const canvasRef = useRef(null);

  const dersler = [
    { id: 1, name: 'Matematik' },
    { id: 2, name: 'Fizik' },
    { id: 3, name: 'Kimya' },
    { id: 4, name: 'Biyoloji' },
    { id: 5, name: 'Türkçe' },
    { id: 6, name: 'Tarih' },
  ];
  const etiketler = ['TYT', 'AYT', 'YKS', 'DGS', 'KPSS'];

  const showCanvasSubjects = ['Matematik', 'Fizik', 'Kimya'];
  const currentSubjectName = questions.length
    ? (dersler.find(d => d.id === questions[idx].ders_id)?.name || '')
    : '';
  const shouldShowCanvas = showCanvasSubjects.includes(currentSubjectName);

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
      ctx.lineWidth   = 2;
      ctx.lineCap     = 'round';
      ctx.strokeStyle = '#000';
      ctx.lineTo(e.clientX - r.left, e.clientY - r.top);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(e.clientX - r.left, e.clientY - r.top);
    };

    canvas.addEventListener('mousedown', start);
    canvas.addEventListener('mouseup',   stop);
    canvas.addEventListener('mouseout',  stop);
    canvas.addEventListener('mousemove', draw);
    return () => {
      canvas.removeEventListener('mousedown', start);
      canvas.removeEventListener('mouseup',   stop);
      canvas.removeEventListener('mouseout',  stop);
      canvas.removeEventListener('mousemove', draw);
    };
  }, [questions.length]);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const startTest = async () => {
    if (!dersId || !etiket) return alert('Lütfen ders ve etiket seçin');
    setLoading(true);
    const res = await fetch(
      `/questions/batch?ders_id=${dersId}&etiket=${encodeURIComponent(etiket)}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const data = await res.json();
    setQuestions(data);
    setIdx(0);
    setSel('');
    setMsg('');
    setShowExplanation(false);
    setLoading(false);
  };

  const handleCheck = () => {
    if (!sel) return alert('Lütfen bir şık seçin');
    const q = questions[idx];
    const correct = sel === q.correct_choice;
    setMsg(correct ? '✔️ Doğru' : '❌ Yanlış');
    setShowExplanation(true);
  };

  const handleSubmit = async () => {
    const q = questions[idx];
    const correct = sel === q.correct_choice;
    await submitAnswer({
      soru_id:      q.soru_id,
      selected:     sel,
      ders_id:      q.ders_id,
      konu_id:      q.konu_id,
      altbaslik_id: q.altbaslik_id,
      zorluk:       q.zorluk,
      is_correct:   correct ? 1 : 0,
      user_id:      q.user_id || 1,
    }, token);

    if (idx + 1 < questions.length) {
      setIdx(idx + 1);
      setSel('');
      setMsg('');
      setShowExplanation(false);
    } else {
      alert('Test tamamlandı!');
      setQuestions([]);
      setDersId('');
      setEtiket('');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken('');
    navigate('/');
  };

  return (
    <div className="home-container">
      <nav className="home-sidebar">
        <ul>
          <li><Link to="/home">🏠 Anasayfa</Link></li>
          <li><Link to="/statistics">📊 İstatistikler</Link></li>
          <li><Link to="#">📁 Çözülen Testler</Link></li>
          <li><Link to="#">🧠 Öğrenme Geçmişi</Link></li>
          <li><Link to="#">⚙️ Ayarlar</Link></li>
          <li>
            <button className="logout-button" onClick={handleLogout}>
              🚪 Çıkış Yap
            </button>
          </li>
        </ul>
      </nav>

      <div className="home-content">
        {!questions.length ? (
          <div className="test-form">
            <h2>Hızlı Test Başlat</h2>
            <label>Ders</label>
            <select value={dersId} onChange={e => setDersId(e.target.value)}>
              <option value="" disabled>Seçin</option>
              {dersler.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>

            <label>Etiket</label>
            <select value={etiket} onChange={e => setEtiket(e.target.value)}>
              <option value="" disabled>Seçin</option>
              {etiketler.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>

            <button onClick={startTest} disabled={loading}>
              {loading ? 'Yükleniyor...' : 'Teste Başla'}
            </button>
          </div>
        ) : (
          <div className="test-area">
            {questions[idx].image_url && (
              <div className="image-wrapper">
                <img
                  src={questions[idx].image_url}
                  alt="Soru görseli"
                  className="question-image"
                />
              </div>
            )}

            <h3>{questions[idx].soru_metin}</h3>

            {Object.entries(questions[idx].choices).map(([lbl, txt]) => (
              <label key={lbl}>
                <input
                  type="radio"
                  name="answer"
                  value={lbl}
                  checked={sel === lbl}
                  onChange={() => setSel(lbl)}
                  disabled={showExplanation}
                />
                {lbl}) {txt}
              </label>
            ))}

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button
                onClick={handleCheck}
                disabled={showExplanation}
              >
                Kontrol Et
              </button>
              <button
                onClick={handleSubmit}
                disabled={!showExplanation}
              >
                Sonraki
              </button>
            </div>

            {msg && <div className="result-msg">{msg}</div>}
            {showExplanation && questions[idx].dogru_cevap_aciklamasi && (
              <div className="question-message">
                Açıklama: {questions[idx].dogru_cevap_aciklamasi}
              </div>
            )}

            <div className="progress">{idx + 1} / {questions.length}</div>

            {shouldShowCanvas && (
              <>
                <div className="notepad">
                  <canvas
                    id="sketchpad"
                    ref={canvasRef}
                    width={500}
                    height={250}
                  />
                </div>
                <button
                  className="clear-button"
                  onClick={clearCanvas}
                >
                  🗑️ Çizimleri Temizle
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}