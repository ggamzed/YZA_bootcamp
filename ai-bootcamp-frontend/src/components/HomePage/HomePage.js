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
  const [showReport, setShowReport] = useState(false);
  const [answerHistory, setAnswerHistory] = useState([]);

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

    // Cevap geçmişine ekle
    setAnswerHistory(prev => [...prev, {
      soru_id: q.soru_id,
      ders_id: q.ders_id,
      konu_id: q.konu_id,
      altbaslik_id: q.altbaslik_id,
      zorluk: q.zorluk,
      correct_choice: q.correct_choice,
      selected: sel,
      is_correct: correct,
      konu_adi: dersler.find(d => d.id === q.ders_id)?.name || '',
      soru_konu: q.konu_id,
    }]);

    if (idx + 1 < questions.length) {
      setIdx(idx + 1);
      setSel('');
      setMsg('');
      setShowExplanation(false);
    } else {
      setShowReport(true);
    }
  };

  const handleReportClose = () => {
    setShowReport(false);
    setQuestions([]);
    setDersId('');
    setEtiket('');
    setAnswerHistory([]);
    setIdx(0);
  };

  // RAPOR HESAPLAMA (dinamik)
  const toplamSoru = questions.length;
  const dogru = answerHistory.filter(a => a.is_correct).length;
  const yanlis = answerHistory.filter(a => a.selected && !a.is_correct).length;
  const bos = answerHistory.filter(a => !a.selected).length;

  // Konu bazlı doğru/yanlış
  const konuBazliMap = {};
  answerHistory.forEach(a => {
    const key = a.konu_id;
    if (!konuBazliMap[key]) konuBazliMap[key] = { konu: key, toplam: 0, dogru: 0, yanlis: 0, bos: 0 };
    konuBazliMap[key].toplam++;
    if (!a.selected) konuBazliMap[key].bos++;
    else if (a.is_correct) konuBazliMap[key].dogru++;
    else konuBazliMap[key].yanlis++;
  });
  const konuBazli = Object.values(konuBazliMap);

  // Zorluk bazlı doğru/yanlış
  const zorlukBazliMap = {};
  answerHistory.forEach(a => {
    const key = a.zorluk;
    if (!zorlukBazliMap[key]) zorlukBazliMap[key] = { seviye: key, toplam: 0, dogru: 0, yanlis: 0, bos: 0 };
    zorlukBazliMap[key].toplam++;
    if (!a.selected) zorlukBazliMap[key].bos++;
    else if (a.is_correct) zorlukBazliMap[key].dogru++;
    else zorlukBazliMap[key].yanlis++;
  });
  const zorlukBazli = Object.values(zorlukBazliMap);

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
          <li><Link to="/completed-tests">📁 Çözülen Testler</Link></li>
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
        {showReport && (
          <div style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
          }}>
            <div style={{ background: 'white', padding: '2.5rem 2.5rem', borderRadius: 16, boxShadow: '0 2px 16px #0002', textAlign: 'center', maxWidth: 700, width: '90vw', maxHeight: '90vh', overflowY: 'auto' }}>
              <h2 style={{marginBottom: '1.5rem'}}>Test Raporun</h2>
              <div style={{marginBottom: '2rem'}}>
                <b>Genel Başarı:</b> {dogru} doğru / {yanlis} yanlış / {bos} boş ({toplamSoru ? Math.round((dogru/toplamSoru)*100) : 0}%)<br/>
                <b>Ortalama Çözüm Süresi:</b> 75 saniye
              </div>
              <h3>Konu Bazlı Doğru/Yanlış</h3>
              <table className="stats-table" style={{margin: '0 auto 1.5rem auto'}}>
                <thead>
                  <tr>
                    <th>Konu ID</th><th>Toplam</th><th>Doğru</th><th>Yanlış</th><th>Boş</th>
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