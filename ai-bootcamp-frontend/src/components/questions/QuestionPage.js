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
  const [showModal, setShowModal] = useState(false);
  const [showReport, setShowReport] = useState(false);

  // Debug için log
  console.log("current:", current, "questions.length:", questions.length, "showReport:", showReport);
  
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

    setCurrent(current + 1);
    setSelected('');
    setMessage('');
    setShowExplanation(false);
  };

  const handleModalOk = () => {
    setShowModal(false);
    nav('/test-raporu', { replace: true });
  };

  const handleReportClose = () => {
    setShowReport(false);
    nav('/home'); // veya başka bir yere yönlendirmek istersen burayı değiştir
  };

  if (questions.length === 0) {
    return <p className="question-page">Yükleniyor…</p>;
  }

  // Test raporu için örnek veriler (ileride dinamik yapılabilir)
  const toplamSoru = 30;
  const dogru = 18;
  const yanlis = 9;
  const bos = 3;
  const ortSure = 75;
  const konuBazli = [
    { konu: 'Temel Kavramlar', toplam: 5, dogru: 4, yanlis: 1, bos: 0 },
    { konu: 'Problemler', toplam: 10, dogru: 5, yanlis: 5, bos: 0 },
    { konu: 'Üslü Sayılar', toplam: 5, dogru: 2, yanlis: 3, bos: 0 },
    { konu: 'Sayı Basamakları', toplam: 5, dogru: 4, yanlis: 0, bos: 1 },
    { konu: 'Bölme-Bölünebilme', toplam: 5, dogru: 3, yanlis: 1, bos: 1 },
  ];
  const zorlukBazli = [
    { seviye: 'Kolay', toplam: 10, dogru: 9, yanlis: 1, bos: 0 },
    { seviye: 'Orta', toplam: 15, dogru: 7, yanlis: 6, bos: 2 },
    { seviye: 'Zor', toplam: 5, dogru: 2, yanlis: 2, bos: 1 },
  ];

  return (
    <div className="question-page">
      {showReport && <div style={{position:'fixed',top:0,left:0,zIndex:9999,background:'red',color:'white',padding:'2rem'}}>RAPOR MODAL BURADA</div>}
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

          {current + 1 < questions.length ? (
            <button
              className="submit-button"
              onClick={handleSubmit}
              disabled={!showExplanation}
            >
              Sonraki Soru
            </button>
          ) : (
            <button
              className="submit-button"
              onClick={() => {
                console.log('TEST BİTTİ, RAPOR AÇILMALI');
                setShowReport(true);
              }}
              disabled={!showExplanation}
            >
              Testi Bitir
            </button>
          )}
        </div>

        <div className="notepad">
          <canvas id="sketchpad" ref={canvasRef} width="400" height="250" />
        </div>
      </div>
      {showModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
        }}>
          <div style={{ background: 'white', padding: '2rem 2.5rem', borderRadius: 12, boxShadow: '0 2px 16px #0002', textAlign: 'center' }}>
            <h3 style={{marginBottom: '1.5rem'}}>Test tamamlandı!</h3>
            <button onClick={handleModalOk} style={{ padding: '0.5rem 1.5rem', fontSize: '1.1rem', borderRadius: 6, background: '#1976d2', color: 'white', border: 'none', cursor: 'pointer' }}>Tamam</button>
          </div>
        </div>
      )}
      {showReport && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
        }}>
          <div style={{ background: 'white', padding: '2.5rem 2.5rem', borderRadius: 16, boxShadow: '0 2px 16px #0002', textAlign: 'center', maxWidth: 700, width: '90vw', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{marginBottom: '1.5rem'}}>Test Raporun</h2>
            <div style={{marginBottom: '2rem'}}>
              <b>Genel Başarı:</b> {dogru} doğru / {yanlis} yanlış / {bos} boş ({Math.round((dogru/toplamSoru)*100)}%)<br/>
              <b>Ortalama Çözüm Süresi:</b> {ortSure} saniye
            </div>
            <h3>Konu Bazlı Doğru/Yanlış</h3>
            <table className="stats-table" style={{margin: '0 auto 1.5rem auto'}}>
              <thead>
                <tr>
                  <th>Konu</th><th>Toplam</th><th>Doğru</th><th>Yanlış</th><th>Boş</th>
                </tr>
              </thead>
              <tbody>
                {konuBazli.map((k, i) => (
                  <tr key={i}>
                    <td>{k.konu}</td><td>{k.toplam}</td><td>{k.dogru}</td><td>{k.yanlis}</td><td>{k.bos}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <h3>Zorluk Seviyesi Bazında</h3>
            <table className="stats-table" style={{margin: '0 auto 1.5rem auto'}}>
              <thead>
                <tr>
                  <th>Zorluk</th><th>Toplam</th><th>Doğru</th><th>Yanlış</th><th>Boş</th>
                </tr>
              </thead>
              <tbody>
                {zorlukBazli.map((z, i) => (
                  <tr key={i}>
                    <td>{z.seviye}</td><td>{z.toplam}</td><td>{z.dogru}</td><td>{z.yanlis}</td><td>{z.bos}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{marginTop: '2rem', background: '#f8f8ff', padding: '1.5rem', borderRadius: '8px'}}>
              <b>Analiz & Gelişim Önerileri</b>
              <ul style={{textAlign: 'left', margin: '1rem auto', maxWidth: 500}}>
                <li>Problemler konusunda zorlandığın gözlemlendi. Bu konudaki temel kavramları tekrar etmeni öneririz.</li>
                <li>Zor sorularda çözüm süren ortalamanın %30 üzerinde. Zaman yönetimi için pratik yapabilirsin.</li>
                <li>Doğru cevap oranını artırmak için yanlış yaptığın konularda ek testler çözebilirsin.</li>
              </ul>
              <div style={{marginTop: '1rem', color: '#2e7d32', fontWeight: 'bold'}}>
                Harika bir çaba gösterdin! Unutma, her test seni daha iyiye götürür. Vazgeçme, başarıya çok yakınsın!
              </div>
            </div>
            <button onClick={handleReportClose} style={{ marginTop: '2.5rem', padding: '0.7rem 2.5rem', fontSize: '1.1rem', borderRadius: 8, background: '#1976d2', color: 'white', border: 'none', cursor: 'pointer' }}>Kapat</button>
          </div>
        </div>
      )}
    </div>
  );
}
