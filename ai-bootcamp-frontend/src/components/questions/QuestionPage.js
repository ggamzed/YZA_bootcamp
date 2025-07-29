import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { submitAnswer } from '../../api/answers';
import './questionPage.css';

// Soru metnini parse eden bileşen
const QuestionText = ({ text }) => {
  // Soru işaretine göre böl
  const parts = text.split('?');
  
  if (parts.length >= 2) {
    const mainQuestion = parts[0].trim() + '?';
    const additionalInfo = parts.slice(1).join('?').trim();
    
    return (
      <>
        {/* Ana Soru */}
        <div style={{
          marginBottom: additionalInfo ? '1rem' : '0'
        }}>
          <p style={{
            fontSize: '1.2rem',
            lineHeight: '1.7',
            color: '#2c3e50',
            margin: 0,
            fontWeight: '600'
          }}>
            {mainQuestion}
          </p>
        </div>
        
        {/* Ek Bilgiler */}
        {additionalInfo && (
          <div style={{
            padding: '1rem',
            background: '#f8f9fa',
            borderRadius: '8px',
            border: '1px solid #e9ecef',
            marginTop: '1rem'
          }}>
            <p style={{
              fontSize: '1rem',
              lineHeight: '1.6',
              color: '#6c757d',
              margin: 0,
              fontStyle: 'italic'
            }}>
              {additionalInfo}
            </p>
          </div>
        )}
      </>
    );
  }
  
  // Soru işareti yoksa, cümle yapısına göre ayır
  const sentences = text.split(/[.!]+/).filter(s => s.trim());
  
  if (sentences.length >= 2) {
    const mainQuestion = sentences[0].trim();
    const additionalInfo = sentences.slice(1).join('. ').trim();
    
    return (
      <>
        {/* Ana Soru */}
        <div style={{
          marginBottom: additionalInfo ? '1rem' : '0'
        }}>
          <p style={{
            fontSize: '1.2rem',
            lineHeight: '1.7',
            color: '#2c3e50',
            margin: 0,
            fontWeight: '600'
          }}>
            {mainQuestion}
          </p>
        </div>
        
        {/* Ek Bilgiler */}
        {additionalInfo && (
          <div style={{
            padding: '1rem',
            background: '#f8f9fa',
            borderRadius: '8px',
            border: '1px solid #e9ecef',
            marginTop: '1rem'
          }}>
            <p style={{
              fontSize: '1rem',
              lineHeight: '1.6',
              color: '#6c757d',
              margin: 0,
              fontStyle: 'italic'
            }}>
              {additionalInfo}
            </p>
          </div>
        )}
      </>
    );
  }
  
  // Tek cümle varsa
  return (
    <p style={{
      fontSize: '1.2rem',
      lineHeight: '1.7',
      color: '#2c3e50',
      margin: 0,
      fontWeight: '600'
    }}>
      {text}
    </p>
  );
};

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
      
      {/* İlerleme Çubuğu */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '4px',
        background: '#e9ecef',
        zIndex: 1000
      }}>
        <div style={{
          height: '100%',
          background: 'linear-gradient(90deg, #667eea, #764ba2)',
          width: `${((current + 1) / questions.length) * 100}%`,
          transition: 'width 0.3s ease'
        }}></div>
      </div>
      
      <div className="question-container">
        {/* Soru Başlığı ve İlerleme */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem',
          padding: '1rem',
          background: '#f8f9fa',
          borderRadius: '12px',
          border: '1px solid #e9ecef'
        }}>
          <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#2c3e50' }}>
            Soru {current + 1} / {questions.length}
          </h2>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.9rem',
            color: '#6c757d'
          }}>
            <span>İlerleme:</span>
            <span style={{ fontWeight: 'bold', color: '#667eea' }}>
              {Math.round(((current + 1) / questions.length) * 100)}%
            </span>
          </div>
        </div>
        
        {/* Soru Metni */}
        <div style={{
          background: '#fff',
          padding: '1.5rem',
          borderRadius: '12px',
          border: '2px solid #e9ecef',
          marginBottom: '2rem',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
        }}>
          <QuestionText text={question.soru_metni} />
        </div>

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
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '1rem'
                }}
              >
                <span style={{
                  background: selected === opt ? '#fff' : '#e9ecef',
                  color: selected === opt ? '#667eea' : '#6c757d',
                  width: '2rem',
                  height: '2rem',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  fontSize: '1rem',
                  flexShrink: 0,
                  marginTop: '0.2rem'
                }}>
                  {opt}
                </span>
                <span style={{
                  textAlign: 'left',
                  flex: 1
                }}>
                  {question.secenekler[opt]}
                </span>
              </button>
            ) : null
          )}
        </div>

        {/* Mesajlar */}
        {message && (
          <div style={{
            margin: '1.5rem 0',
            padding: '1rem 1.5rem',
            borderRadius: '12px',
            fontWeight: '500',
            textAlign: 'center',
            fontSize: '1.1rem',
            background: message.includes('✔️') ? '#d4edda' : '#f8d7da',
            color: message.includes('✔️') ? '#155724' : '#721c24',
            border: `1px solid ${message.includes('✔️') ? '#c3e6cb' : '#f5c6cb'}`,
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            {message}
          </div>
        )}
        
        {showExplanation && question.dogru_cevap_aciklamasi && (
          <div style={{
            margin: '1.5rem 0',
            padding: '1.5rem',
            borderRadius: '12px',
            background: '#e3f2fd',
            border: '2px solid #2196f3',
            boxShadow: '0 4px 12px rgba(33, 150, 243, 0.15)'
          }}>
            <h4 style={{
              margin: '0 0 1rem 0',
              color: '#1976d2',
              fontSize: '1.1rem',
              fontWeight: '600'
            }}>
              📝 Açıklama
            </h4>
            <p style={{
              margin: 0,
              fontSize: '1rem',
              lineHeight: '1.6',
              color: '#1565c0'
            }}>
              {question.dogru_cevap_aciklamasi}
            </p>
          </div>
        )}

        {/* Butonlar */}
        <div style={{ 
          display: 'flex', 
          gap: '1rem', 
          marginTop: '2rem',
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          <button
            className="submit-button"
            onClick={handleCheck}
            disabled={showExplanation}
            style={{
              background: showExplanation ? '#6c757d' : 'linear-gradient(135deg, #17a2b8, #20c997)',
              minWidth: '140px'
            }}
          >
            {showExplanation ? 'Kontrol Edildi' : 'Kontrol Et'}
          </button>

          {current + 1 < questions.length ? (
            <button
              className="submit-button"
              onClick={handleSubmit}
              disabled={!showExplanation}
              style={{
                background: !showExplanation ? '#6c757d' : 'linear-gradient(135deg, #28a745, #20c997)',
                minWidth: '140px'
              }}
            >
              Sonraki Soru →
            </button>
          ) : (
            <button
              className="submit-button"
              onClick={() => {
                console.log('TEST BİTTİ, RAPOR AÇILMALI');
                setShowReport(true);
              }}
              disabled={!showExplanation}
              style={{
                background: !showExplanation ? '#6c757d' : 'linear-gradient(135deg, #dc3545, #fd7e14)',
                minWidth: '140px'
              }}
            >
              Testi Bitir 🏁
            </button>
          )}
        </div>

        {/* Notepad */}
        <div style={{
          marginTop: '2rem',
          padding: '1.5rem',
          background: '#f8f9fa',
          borderRadius: '12px',
          border: '2px solid #e9ecef'
        }}>
          <h4 style={{
            margin: '0 0 1rem 0',
            color: '#495057',
            fontSize: '1rem',
            fontWeight: '600',
            textAlign: 'center'
          }}>
            📝 Not Defteri
          </h4>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            minHeight: '250px'
          }}>
            <canvas 
              id="sketchpad" 
              ref={canvasRef} 
              width="400" 
              height="250"
              style={{
                border: '2px solid #dee2e6',
                borderRadius: '12px',
                background: '#fff',
                cursor: 'crosshair',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                transition: 'border-color 0.3s ease'
              }}
            />
          </div>
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
