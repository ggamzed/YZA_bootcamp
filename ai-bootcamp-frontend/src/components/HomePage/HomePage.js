import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { submitAnswer } from '../../api/answers';
import { getCurrentUser } from '../../api/auth';
import { fetchCompletedTests, fetchAIRecommendations } from '../../api/statistics';
import './HomePage.css';

export default function HomePage({ token, setToken }) {
  const navigate = useNavigate();

  const [dersId, setDersId] = useState('');
  const [etiket, setEtiket] = useState('');
  const [questions, setQuestions] = useState([]);
  const [idx, setIdx] = useState(0);
  const [sel, setSel] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [answerHistory, setAnswerHistory] = useState([]);
  const [user, setUser] = useState(null);
  const [recentActivities, setRecentActivities] = useState([]);
  const [aiRecommendations, setAiRecommendations] = useState(null);

  const canvasRef = useRef(null);

  const dersler = [
    { id: 1, name: 'Matematik', icon: 'bi-calculator' },
    { id: 2, name: 'Fizik', icon: 'bi-lightning' },
    { id: 3, name: 'Kimya', icon: 'bi-flask' },
    { id: 4, name: 'Biyoloji', icon: 'bi-heart-pulse' },
    { id: 5, name: 'Türkçe', icon: 'bi-book' },
    { id: 6, name: 'Tarih', icon: 'bi-clock-history' },
  ];
  
  const etiketler = ['TYT', 'AYT', 'YKS', 'DGS', 'KPSS'];

  const showCanvasSubjects = ['Matematik', 'Fizik', 'Kimya'];
  const currentSubjectName = questions.length
    ? (dersler.find(d => d.id === questions[idx]?.ders_id)?.name || '')
    : '';
  const shouldShowCanvas = showCanvasSubjects.includes(currentSubjectName);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await getCurrentUser(token);
        setUser(userData);
      } catch (error) {
        console.error('Kullanıcı bilgileri alınamadı:', error);
      }
    };
    fetchUser();
  }, [token]);

  useEffect(() => {
    const fetchRecentActivities = async () => {
      try {
        const data = await fetchCompletedTests(token);
        setRecentActivities(data.slice(0, 3));
      } catch (error) {
        console.error('Son aktiviteler alınamadı:', error);
      }
    };
    fetchRecentActivities();
  }, [token]);

  useEffect(() => {
    const fetchAIRecommendations = async () => {
      try {
        const data = await fetchAIRecommendations(token);
        setAiRecommendations(data);
      } catch (error) {
        console.error('AI önerileri alınamadı:', error);
      }
    };
    fetchAIRecommendations();
  }, [token]);

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
  }, [questions.length]);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
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
    if (!q) return;
    const correct = sel === q.dogru_cevap;
    setMsg(correct ? '✔️ Doğru' : '❌ Yanlış');
    setShowExplanation(true);
  };

  const handleSubmit = async () => {
    const q = questions[idx];
    if (!q) return;
    const correct = sel === q.dogru_cevap;
    await submitAnswer({
      soru_id: q.soru_id,
      selected: sel,
      ders_id: q.ders_id,
      konu_id: q.konu_id,
      altbaslik_id: q.altbaslik_id,
      zorluk: q.zorluk,
      is_correct: correct ? 1 : 0,
      user_id: q.user_id || 1,
    }, token);

    setAnswerHistory(prev => [...prev, {
      soru_id: q.soru_id,
      ders_id: q.ders_id,
      konu_id: q.konu_id,
      altbaslik_id: q.altbaslik_id,
      zorluk: q.zorluk,
      correct_choice: q.dogru_cevap,
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

  const toplamSoru = questions.length;
  const dogru = answerHistory.filter(a => a.is_correct).length;
  const yanlis = answerHistory.filter(a => a.selected && !a.is_correct).length;
  const bos = answerHistory.filter(a => !a.selected).length;

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

  const parseQuestionText = (text) => {
    if (!text) return { mainQuestion: '', additionalInfo: '' };
    
    const parts = text.split('?');
    if (parts.length >= 2) {
      const mainQuestion = parts[0].trim() + '?';
      const additionalInfo = parts.slice(1).join('?').trim();
      return { mainQuestion, additionalInfo };
    }
    
    const sentences = text.split(/[.!]+/).filter(s => s.trim());
    if (sentences.length >= 2) {
      const mainQuestion = sentences[0].trim();
      const additionalInfo = sentences.slice(1).join('. ').trim();
      return { mainQuestion, additionalInfo };
    }
    
    return { mainQuestion: text, additionalInfo: '' };
  };

  const formatActivityTime = (dateString) => {
    try {
      const date = new Date(dateString);
      const turkeyDate = new Date(date.getTime() + (3 * 60 * 60 * 1000));
      const now = new Date();
      const diffInHours = Math.floor((now - turkeyDate) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Az önce';
    if (diffInHours < 24) return `${diffInHours} saat önce`;
    if (diffInHours < 48) return '1 gün önce';
    return `${Math.floor(diffInHours / 24)} gün önce`;
    } catch (error) {
      return 'Zaman bilgisi yok';
    }
  };

  return (
    <div className="main-wrapper">
      {/* HazerFen Logo - Absolute Top Left */}
      <div className="top-logo">
        <Link to="/home" className="logo-link">
          <div className="logo">
            <span className="bold">hazer</span><span className="cursive">Fen</span>
          </div>
          <div className="logo-slogan">BİLGİYLE KANATLAN!</div>
        </Link>
      </div>



      <div className="container-fluid">
        <div className="row">
          {/* Sidebar */}
          <nav id="sidebarMenu" className="col-md-3 col-lg-3 d-md-block sidebar collapse">
            <div className="position-sticky py-4 px-3 sidebar-sticky">
              <ul className="nav flex-column h-100">
                <li className="nav-item">
                  <a className="nav-link active" aria-current="page" href="#">
                    <i className="bi-house-fill me-2"></i>
                    Ana Sayfa
                  </a>
                </li>

                <li className="nav-item">
                  <Link className="nav-link" to="/statistics">
                    <i className="bi-graph-up me-2"></i>
                    İstatistikler
                  </Link>
                </li>

                <li className="nav-item">
                  <Link className="nav-link" to="/completed-tests">
                    <i className="bi-file-text me-2"></i>
                    Testler
                  </Link>
                </li>

                <li className="nav-item">
                  <Link className="nav-link" to="/profile">
                    <i className="bi-person me-2"></i>
                    Profil
                  </Link>
                </li>

                <li className="nav-item">
                  <Link className="nav-link" to="/settings">
                    <i className="bi-gear me-2"></i>
                    Ayarlar
                  </Link>
                </li>

                <li className="nav-item border-top mt-3 pt-2">
                  <a className="nav-link" href="#" onClick={handleLogout}>
                    <i className="bi-box-arrow-left me-2"></i>
                    Çıkış Yap
                  </a>
                </li>
              </ul>
            </div>
          </nav>

          {/* Main Content */}
          <main className="main-wrapper col-md-9 ms-sm-auto py-4 col-lg-9 px-md-4">
            <div className="title-group mb-3">
              <h1 className="h2 mb-0">Test Merkezi</h1>
              <small className="text-muted">Hoş geldiniz! Yeni testler çözmeye hazır mısınız?</small>
            </div>

            {/* Test Report Modal */}
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
                  <table className="account-table" style={{margin: '0 auto 1.5rem auto'}}>
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
                  <table className="account-table" style={{margin: '0 auto 1.5rem auto'}}>
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
                  <button onClick={handleReportClose} style={{ marginTop: '2.5rem', padding: '0.7rem 2.5rem', fontSize: '1.1rem', borderRadius: 8, background: '#007bff', color: 'white', border: 'none', cursor: 'pointer' }}>Kapat</button>
                </div>
              </div>
            )}

            <div className="row my-4">
              {/* Test Form */}
              {!questions.length ? (
                <div className="col-lg-7 col-12">
                  <div className="custom-block bg-white">
                    <h5 className="mb-4">Yeni Test Başlat</h5>
                    
                    <div className="custom-form">
                      <div className="mb-3">
                        <label className="form-label">Ders Seçin</label>
                        <select 
                          className="form-control" 
                          value={dersId} 
                          onChange={e => setDersId(e.target.value)}
                        >
                          <option value="" disabled>Ders seçin</option>
                          {dersler.map(d => (
                            <option key={d.id} value={d.id}>
                              {d.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="mb-3">
                        <label className="form-label">Etiket Seçin</label>
                        <select 
                          className="form-control" 
                          value={etiket} 
                          onChange={e => setEtiket(e.target.value)}
                        >
                          <option value="" disabled>Etiket seçin</option>
                          {etiketler.map(t => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      </div>

                      <button 
                        className="btn custom-btn w-100" 
                        onClick={startTest} 
                        disabled={loading}
                      >
                        {loading ? 'Yükleniyor...' : 'Teste Başla'}
                      </button>
                    </div>
                  </div>

                  {/* Statistics Overview */}
                  <div className="custom-block bg-white mt-4">
                    <h5 className="mb-4">Genel İstatistikler</h5>
                    
                    <div className="row">
                      <div className="col-6">
                        <div className="custom-block-bottom-item text-center">
                          <div className="custom-block-numbers">
                            <span className="h3 text-primary">{aiRecommendations?.user_stats?.total_questions || 0}</span>
                          </div>
                          <small>Toplam Test</small>
                        </div>
                      </div>
                      
                      <div className="col-6">
                        <div className="custom-block-bottom-item text-center">
                          <div className="custom-block-numbers">
                            <span className="h3 text-success">{Math.round((aiRecommendations?.user_stats?.overall_accuracy || 0) * 100)}%</span>
                          </div>
                          <small>Başarı Oranı</small>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* AI Recommendations */}
                  {aiRecommendations && (
                    <div className="custom-block bg-white mt-4">
                      <h5 className="mb-4">🤖 AI Önerileri</h5>
                      
                      <div className="row">
                        <div className="col-12">
                          <div className="alert alert-info">
                            <h6 className="alert-heading">Önerilen Zorluk Seviyesi</h6>
                            <p className="mb-2">
                              {aiRecommendations.recommendations.recommended_difficulty === 1 && '🟢 Kolay seviye sorular öneriliyor'}
                              {aiRecommendations.recommendations.recommended_difficulty === 2 && '🟡 Orta seviye sorular öneriliyor'}
                              {aiRecommendations.recommendations.recommended_difficulty === 3 && '🔴 Zor seviye sorular öneriliyor'}
                            </p>
                            <small>Genel başarı oranınıza göre optimize edilmiştir.</small>
                          </div>
                        </div>
                      </div>

                      {aiRecommendations.recommendations.weak_topics.length > 0 && (
                        <div className="row mt-3">
                          <div className="col-12">
                            <h6>📚 Geliştirilmesi Gereken Konular:</h6>
                            <ul className="list-group list-group-flush">
                              {aiRecommendations.recommendations.weak_topics.slice(0, 3).map((topic, index) => (
                                <li key={index} className="list-group-item d-flex justify-content-between align-items-center">
                                  <span>{topic.replace('topic_', 'Konu ')}</span>
                                  <span className="badge bg-warning text-dark">Düşük Performans</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                /* Test Area */
                <div className="col-lg-12 col-12">
                  <div className="custom-block bg-white">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                      <h5 className="mb-0">Test - {dersler.find(d => d.id === questions[idx]?.ders_id)?.name} ({etiket})</h5>
                      <span className="badge bg-primary">Soru {idx + 1} / {questions.length}</span>
                    </div>

                    {questions[idx]?.image_url && (
                      <div className="text-center mb-4">
                        <img
                          src={questions[idx].image_url}
                          alt="Soru görseli"
                          className="img-fluid rounded"
                          style={{ maxHeight: '300px' }}
                        />
                      </div>
                    )}

                    {/* Soru Metni */}
                    <div className="mb-4">
                      {(() => {
                        const questionText = questions[idx]?.soru_metin || questions[idx]?.soru_metni || 'Soru yükleniyor...';
                        const { mainQuestion, additionalInfo } = parseQuestionText(questionText);
                        
                        return (
                          <>
                            <div className="question-main mb-3">
                              <h6 className="mb-0" style={{ fontSize: '1.1rem', lineHeight: '1.6', color: '#2c3e50', fontWeight: '600' }}>
                                {mainQuestion}
                              </h6>
                            </div>
                            {additionalInfo && (
                              <div className="question-additional mb-3" style={{ padding: '1rem', background: '#f8f9fa', borderRadius: '8px', border: '1px solid #e9ecef' }}>
                                <p className="mb-0" style={{ fontSize: '1rem', lineHeight: '1.5', color: '#6c757d', fontStyle: 'italic' }}>
                                  {additionalInfo}
                                </p>
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>

                    {/* Şıklar */}
                    <div className="mb-4">
                      {(() => {
                        const choices = questions[idx]?.secenekler || questions[idx]?.choices || {};
                        const choiceEntries = Object.entries(choices);
                        
                        if (choiceEntries.length === 0) {
                          return (
                            <div className="alert alert-warning">
                              <i className="bi-exclamation-triangle me-2"></i>
                              Soru şıkları yüklenemedi.
                            </div>
                          );
                        }
                        
                        return choiceEntries.map(([lbl, txt]) => (
                          <div key={lbl} className="form-check mb-3 p-3 border rounded" style={{ 
                            borderColor: sel === lbl ? '#007bff' : '#e9ecef',
                            backgroundColor: sel === lbl ? '#f8f9ff' : '#fff',
                            transition: 'all 0.3s ease'
                          }}>
                            <input
                              className="form-check-input"
                              type="radio"
                              name="answer"
                              id={`option-${lbl}`}
                              value={lbl}
                              checked={sel === lbl}
                              onChange={() => setSel(lbl)}
                              disabled={showExplanation}
                              style={{ marginTop: '0.2rem' }}
                            />
                            <label className="form-check-label w-100" htmlFor={`option-${lbl}`} style={{ cursor: 'pointer', marginLeft: '0.5rem' }}>
                              <span className="badge bg-primary me-2" style={{ fontSize: '0.8rem' }}>{lbl}</span>
                              <span style={{ fontSize: '1rem', lineHeight: '1.5' }}>{txt || 'Şık metni yüklenemedi'}</span>
                            </label>
                          </div>
                        ));
                      })()}
                    </div>

                    <div className="d-flex gap-3 mb-4">
                      <button
                        className="btn custom-btn"
                        onClick={handleCheck}
                        disabled={showExplanation}
                      >
                        {showExplanation ? 'Kontrol Edildi' : 'Kontrol Et'}
                      </button>
                      
                      <button
                        className="btn custom-btn"
                        onClick={handleSubmit}
                        disabled={!showExplanation}
                      >
                        {idx + 1 < questions.length ? 'Sonraki Soru →' : 'Testi Bitir 🏁'}
                      </button>
                    </div>

                    {msg && (
                      <div className={`alert ${msg.includes('✔️') ? 'alert-success' : 'alert-danger'} mb-4`}>
                        {msg}
                      </div>
                    )}

                    {showExplanation && questions[idx]?.dogru_cevap_aciklamasi && (
                      <div className="custom-block bg-light p-3 rounded">
                        <h6 className="mb-2">📝 Açıklama</h6>
                        <p className="mb-0">{questions[idx]?.dogru_cevap_aciklamasi}</p>
                      </div>
                    )}

                    {shouldShowCanvas && (
                      <div className="mt-4">
                        <h6 className="mb-3">📝 Not Defteri</h6>
                        <div className="text-center">
                          <canvas
                            id="sketchpad"
                            ref={canvasRef}
                            width="500"
                            height="250"
                            className="border rounded"
                          />
                        </div>
                        <button
                          className="btn btn-outline-secondary mt-2"
                          onClick={clearCanvas}
                        >
                          🗑️ Çizimleri Temizle
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Sidebar Content - Test çözme sırasında gizlenir */}
              {!questions.length && (
                <div className="col-lg-5 col-12">
                  <div className="custom-block custom-block-profile text-center bg-white">
                    <div className="custom-block-profile-image-wrap mb-4">
                      <img src="https://via.placeholder.com/100x100/007bff/ffffff?text=U" className="custom-block-profile-image img-fluid rounded-circle" alt="User" />
                    </div>

                    <p className="d-flex flex-wrap mb-2">
                      <strong>Kullanıcı:</strong>
                      <span>{user?.username || 'Test Kullanıcısı'}</span>
                    </p>

                    <p className="d-flex flex-wrap mb-2">
                      <strong>Durum:</strong>
                      <span className="badge bg-success">Aktif</span>
                    </p>

                    <p className="d-flex flex-wrap mb-0">
                      <strong>Üyelik:</strong>
                      <span className="badge bg-primary">Ücretsiz Üye</span>
                    </p>
                  </div>

                  <div className="custom-block custom-block-bottom d-flex flex-wrap">
                    <div className="custom-block-bottom-item">
                      <Link to="/statistics" className="d-flex flex-column">
                        <i className="custom-block-icon bi-graph-up"></i>
                        <small>İstatistikler</small>
                      </Link>
                    </div>

                    <div className="custom-block-bottom-item">
                      <Link to="/completed-tests" className="d-flex flex-column">
                        <i className="custom-block-icon bi-file-text"></i>
                        <small>Testler</small>
                      </Link>
                    </div>

                    <div className="custom-block-bottom-item">
                      <Link to="/profile" className="d-flex flex-column">
                        <i className="custom-block-icon bi-person"></i>
                        <small>Profil</small>
                      </Link>
                    </div>

                    <div className="custom-block-bottom-item">
                      <Link to="/settings" className="d-flex flex-column">
                        <i className="custom-block-icon bi-gear"></i>
                        <small>Ayarlar</small>
                      </Link>
                    </div>
                  </div>

                  <div className="custom-block custom-block-transations">
                    <h5 className="mb-4">Son Aktiviteler</h5>

                    {recentActivities.length > 0 ? (
                      recentActivities.map((activity, index) => (
                        <div key={index} className="d-flex flex-wrap align-items-center mb-4">
                          <div className="d-flex align-items-center">
                            <div className="profile-rounded bg-primary text-white me-3">
                              <i className={`bi-${dersler.find(d => d.id === activity.ders_id)?.icon || 'calculator'}`}></i>
                            </div>

                            <div>
                              <p>{dersler.find(d => d.id === activity.ders_id)?.name || 'Test'} Testi</p>
                              <small>{formatActivityTime(activity.test_date)}</small>
                            </div>
                          </div>

                          <div className="ms-auto">
                            <span className={`badge bg-${activity.accuracy >= 80 ? 'success' : activity.accuracy >= 60 ? 'warning' : 'danger'}`}>
                              {activity.accuracy}%
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-3">
                        <p className="text-muted mb-0">Henüz aktivite yok</p>
                        <small>Test çözmeye başlayın!</small>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}