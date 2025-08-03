import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { submitAnswer, getAnswerPrediction, getTotalQuestionsBySubject } from '../api/answers';
import { useUser } from '../contexts/UserContext';
import Header from './Header';
import './HomePage/HomePage.css';

export default function TestPage({ onLogout }) {
  const navigate = useNavigate();
  const { token, user: globalUser, setUser: setGlobalUser } = useUser();
  const location = useLocation();
  const { dersId, etiket, questions: initialQuestions, testSessionId } = location.state || {};

  const [questions, setQuestions] = useState(initialQuestions || []);
  const [idx, setIdx] = useState(0);
  const [sel, setSel] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [answerHistory, setAnswerHistory] = useState([]);
  const [aiPrediction, setAiPrediction] = useState(null);
  const [showPrediction, setShowPrediction] = useState(false);
  const [questionStartTime, setQuestionStartTime] = useState(null);
  const [questionTimes, setQuestionTimes] = useState([]);
  const [subjectQuestionCounts, setSubjectQuestionCounts] = useState({});
  const [currentSubjectAIEnabled, setCurrentSubjectAIEnabled] = useState(false);
  const [userData, setUserData] = useState(null);

  const canvasRef = useRef(null);

  const dersler = [
    { id: 1, name: 'Matematik', icon: 'bi-calculator' },
    { id: 2, name: 'Fizik', icon: 'bi-lightning' },
    { id: 3, name: 'Kimya', icon: 'bi-flask' },
    { id: 4, name: 'Biyoloji', icon: 'bi-heart-pulse' },
    { id: 5, name: 'Türkçe', icon: 'bi-book' },
    { id: 6, name: 'Tarih', icon: 'bi-clock-history' },
  ];

  const getKonuIsmi = (dersId, konuId) => {
    const konuIsimleri = {
      1: { 1: 'Basit Eşitsizlikler', 2: 'Fonksiyonlar', 3: 'Olasılık' },
      2: { 1: 'Basit Makineler', 2: 'İş, Güç ve Enerji', 3: 'Atom Modelleri' },
      3: { 1: 'Kimyasal Türler Arası Etkileşimler', 2: 'Karışımlar', 3: 'Gazlar' },
      4: { 1: 'Sinir Sistemi', 2: 'Sindirim Sistemi', 3: 'Solunum Sistemi' },
      5: { 1: 'Sözcükte Anlam', 2: 'Cümlede Anlam', 3: 'Ses Bilgisi' },
      6: { 1: 'İlk Türk Devletleri', 2: 'Türk-İslam Devletleri', 3: 'Kurtuluş Savaşı\'nda Cepheler' }
    };
    return konuIsimleri[dersId]?.[konuId] || `Konu ${konuId}`;
  };

  const showCanvasSubjects = ['Matematik', 'Fizik', 'Kimya'];
  const currentSubjectName = questions.length
    ? (dersler.find(d => d.id === questions[idx]?.ders_id)?.name || '')
    : '';
  const shouldShowCanvas = showCanvasSubjects.includes(currentSubjectName);

  useEffect(() => {
    if (!questions.length && !initialQuestions) {
      navigate('/home');
    }
  }, [questions.length, initialQuestions, navigate]);

  // Kullanıcı verilerini al
  useEffect(() => {
    const fetchUserData = async () => {
      if (token) {
        try {
          const response = await fetch('/auth/me', {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (response.ok) {
            const userData = await response.json();
            console.log('DEBUG TestPage - User data loaded:', {
              username: userData.username,
              hide_ai_recommendations: userData.hide_ai_recommendations
            });
            setUserData(userData);
            // Global user state'ini de güncelle
            setGlobalUser(userData);
          }
        } catch (error) {
          console.error('Kullanıcı verileri alınamadı:', error);
        }
      }
    };
    
    fetchUserData();
  }, [token, setGlobalUser]);

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

  const handleCheck = async () => {
    if (!sel) {
      setMsg('⚠️ Boş bırakıldı');
      setShowExplanation(true);
      return;
    }
    const q = questions[idx];
    if (!q) return;
    
    try {
      const correct = sel === q.dogru_cevap;
      setMsg(correct ? '✔️ Doğru' : '❌ Yanlış');
      setShowExplanation(true);
      
      const prediction = await getAnswerPrediction({
        ...q,
        is_correct: correct
      }, token);
      setAiPrediction(prediction);
      setShowPrediction(true);
    } catch (error) {
      console.error('AI tahmin hatası:', error);
      const correct = sel === q.dogru_cevap;
      setMsg(correct ? '✔️ Doğru' : '❌ Yanlış');
      setShowExplanation(true);
    }
  };

  const handleSubmit = async () => {
    try {
      const q = questions[idx];
      if (!q) return;
      
      // Eğer soru boş bırakıldıysa, sadece sonraki soruya geç
      if (!sel) {
        setAnswerHistory(prev => [...prev, {
          soru_id: q.soru_id,
          ders_id: q.ders_id,
          konu_id: q.konu_id,
          altbaslik_id: q.altbaslik_id,
          zorluk: q.zorluk,
          correct_choice: q.dogru_cevap,
          selected: null, // Boş bırakıldığını belirtmek için null
          is_correct: false,
          konu_adi: dersler.find(d => d.id === q.ders_id)?.name || '',
          soru_konu: q.konu_id,
          question_time: 0, // Boş sorular için süre 0
        }]);

        if (idx + 1 < questions.length) {
          setIdx(idx + 1);
          setSel('');
          setMsg('');
          setShowExplanation(false);
          setShowPrediction(false);
          setAiPrediction(null);
          setQuestionStartTime(Date.now());
        } else {
          setShowReport(true);
        }
        return;
      }

      const correct = sel === q.dogru_cevap;
      
      const currentTime = Date.now();
      const questionTime = questionStartTime ? Math.round((currentTime - questionStartTime) / 1000) : 0; // saniye cinsinden
      
      await submitAnswer({
        soru_id: q.soru_id,
        selected: sel,
        ders_id: q.ders_id,
        konu_id: q.konu_id,
        altbaslik_id: q.altbaslik_id,
        zorluk: q.zorluk,
        is_correct: correct ? 1 : 0,
        user_id: q.user_id || 1,
        test_session_id: testSessionId, // Add test_session_id to the submission
      }, token);

      // Backend'ten güncel sayaçları çek
      try {
        const updatedData = await getTotalQuestionsBySubject(token);
        setSubjectQuestionCounts(updatedData);
      } catch (error) {
        console.error('Sayaç güncellemesi başarısız:', error);
      }

      try {
        const response = await fetch('http://localhost:8000/answers/predict', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            user_id: q.user_id || 1,
            ders_id: q.ders_id,
            konu_id: q.konu_id,
            altbaslik_id: q.altbaslik_id,
            zorluk: q.zorluk,
            is_correct: correct
          })
        });

        if (response.ok) {
          const predictionData = await response.json();
          // AI tahminini her zaman al ama sadece 30 soru sonrası göster
          setAiPrediction(predictionData);
        }
      } catch (error) {
        console.error('AI model güncelleme hatası:', error);
      }

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
        question_time: questionTime,
      }]);

      setQuestionTimes(prev => [...prev, questionTime]);

      if (idx + 1 < questions.length) {
        setIdx(idx + 1);
        setSel('');
        setMsg('');
        setShowExplanation(false);
        setShowPrediction(false);
        setAiPrediction(null);
        setQuestionStartTime(Date.now());
      } else {
        setShowReport(true);
      }
    } catch (error) {
      console.error('Cevap gönderme hatası:', error);
      let errorMessage = 'Cevap gönderilirken bir hata oluştu. Lütfen tekrar deneyin.';
      
      if (error.message.includes('401')) {
        errorMessage = 'Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.';
      } else if (error.message.includes('500')) {
        errorMessage = 'Sunucu hatası. Cevabınız kaydedilemedi.';
      } else if (error.message.includes('fetch')) {
        errorMessage = 'İnternet bağlantınızı kontrol edin ve tekrar deneyin.';
      }
      
      setMsg(errorMessage);
    }
  };

  const handleReportClose = async () => {
    try {
      // Test oturumunu bitir
      if (testSessionId) {
        await fetch(
          `http://localhost:8000/questions/end-test?test_session_id=${testSessionId}`,
          { 
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` } 
          }
        );
      }
    } catch (error) {
      console.error('Test bitirme hatası:', error);
    }
    
    setShowReport(false);
    setQuestions([]);
    setAnswerHistory([]);
    setIdx(0);
    setShowPrediction(false);
    setAiPrediction(null);
    setQuestionStartTime(null);
    setQuestionTimes([]);
    navigate('/home');
  };

  const toplamSoru = questions.length;
  const dogru = answerHistory.filter(a => a.is_correct).length;
  const yanlis = answerHistory.filter(a => a.selected && !a.is_correct).length;
  const bos = answerHistory.filter(a => !a.selected).length;
  

  const ortalamaSure = questionTimes.length > 0 
    ? Math.round(questionTimes.reduce((sum, time) => sum + time, 0) / questionTimes.length)
    : 0;

  const konuBazliMap = {};
  answerHistory.forEach(a => {
    const key = a.konu_id;
    if (!konuBazliMap[key]) konuBazliMap[key] = { konu: key, konu_id: key, ders_id: a.ders_id, toplam: 0, dogru: 0, yanlis: 0, bos: 0, toplamSure: 0 };
    konuBazliMap[key].toplam++;
    if (!a.selected) konuBazliMap[key].bos++;
    else if (a.is_correct) konuBazliMap[key].dogru++;
    else konuBazliMap[key].yanlis++;
    if (a.question_time) konuBazliMap[key].toplamSure += a.question_time;
  });
  const konuBazli = Object.values(konuBazliMap).map(k => ({
    ...k,
    ortalamaSure: k.toplam > 0 ? Math.round(k.toplamSure / k.toplam) : 0
  }));


  const getAnalysisAndRecommendations = () => {
    const recommendations = [];
    

    const weakestTopic = konuBazli
      .filter(k => k.toplam > 0)
      .sort((a, b) => (a.dogru / a.toplam) - (b.dogru / b.toplam))[0];
    
    if (weakestTopic && (weakestTopic.dogru / weakestTopic.toplam) < 0.5) {
      recommendations.push(
        `${getKonuIsmi(weakestTopic.ders_id, weakestTopic.konu_id)} konusunda zorlandığın gözlemlendi (${Math.round((weakestTopic.dogru / weakestTopic.toplam) * 100)}% başarı). Bu konudaki temel kavramları tekrar etmeni öneririz.`
      );
    }

    const slowestTopic = konuBazli
      .filter(k => k.toplam > 0 && k.ortalamaSure > 0)
      .sort((a, b) => b.ortalamaSure - a.ortalamaSure)[0];
    
    if (slowestTopic && slowestTopic.ortalamaSure > ortalamaSure * 1.3) {
      recommendations.push(
        `${getKonuIsmi(slowestTopic.ders_id, slowestTopic.konu_id)} konusunda çözüm süren ortalamanın %${Math.round(((slowestTopic.ortalamaSure - ortalamaSure) / ortalamaSure) * 100)} üzerinde (${slowestTopic.ortalamaSure}s). Zaman yönetimi için pratik yapabilirsin.`
      );
    }
    
    const successRate = toplamSoru > 0 ? (dogru / toplamSoru) : 0;
    if (successRate < 0.6) {
      recommendations.push(
        `Genel başarı oranın %${Math.round(successRate * 100)}. Doğru cevap oranını artırmak için yanlış yaptığın konularda ek testler çözebilirsin.`
      );
    } else if (successRate > 0.8) {
      recommendations.push(
        `Mükemmel! %${Math.round(successRate * 100)} başarı oranınla gerçekten iyi performans gösterdin. Daha zorlu sorularla kendini test edebilirsin.`
      );
    }
    
    const bestTopic = konuBazli
      .filter(k => k.toplam > 0)
      .sort((a, b) => (b.dogru / b.toplam) - (a.dogru / a.toplam))[0];
    
    if (bestTopic && (bestTopic.dogru / bestTopic.toplam) > 0.8) {
      recommendations.push(
        `${getKonuIsmi(bestTopic.ders_id, bestTopic.konu_id)} konusunda çok başarılısın (%${Math.round((bestTopic.dogru / bestTopic.toplam) * 100)} başarı)! Bu güçlü yanını korumaya devam et.`
      );
    }
    
    if (recommendations.length === 0) {
      recommendations.push(
        "Genel olarak iyi bir performans gösterdin. Sürekli pratik yaparak daha da gelişebilirsin."
      );
    }
    
    return recommendations;
  };

  const analysisRecommendations = getAnalysisAndRecommendations();

  const getMotivationalMessage = () => {
    const successRate = toplamSoru > 0 ? (dogru / toplamSoru) : 0;
    
    if (successRate >= 0.9) {
      return "Mükemmel performans! Sen gerçekten çok başarılısın. Bu seviyeyi korumaya devam et!";
    } else if (successRate >= 0.8) {
      return "Harika bir çaba gösterdin! Gerçekten iyi performans sergiledin. Daha da gelişmeye devam et!";
    } else if (successRate >= 0.7) {
      return "İyi bir performans gösterdin! Biraz daha pratik yaparak daha da iyileşebilirsin.";
    } else if (successRate >= 0.6) {
      return "Orta seviyede bir performans gösterdin. Daha fazla çalışarak gelişebilirsin. Vazgeçme!";
    } else {
      return "Bu sefer istediğin sonucu alamadın ama endişelenme! Her başarısızlık başarıya giden yoldur. Daha fazla pratik yaparak gelişeceksin!";
    }
  };

  const motivationalMessage = getMotivationalMessage();

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

  useEffect(() => {
    if (questions.length > 0 && !questionStartTime) {
      setQuestionStartTime(Date.now());
    }
  }, [questions.length, questionStartTime]);

  useEffect(() => {
    if (!token) {
      setQuestions([]);
      setAnswerHistory([]);
      setIdx(0);
      setShowReport(false);
      setShowPrediction(false);
      setAiPrediction(null);
      setQuestionStartTime(null);
      setQuestionTimes([]);
      setSubjectQuestionCounts({});
      setCurrentSubjectAIEnabled(false);
    }
  }, [token]);

  // Ders bazlı soru sayısını yükle
  useEffect(() => {
    const loadSubjectQuestions = async () => {
      if (token) {
        try {
          const data = await getTotalQuestionsBySubject(token);
          setSubjectQuestionCounts(data);
          
          // Mevcut ders için AI durumunu kontrol et
          const currentDersId = questions[0]?.ders_id;
          if (currentDersId && data[currentDersId]) {
            setCurrentSubjectAIEnabled(data[currentDersId].ai_enabled);
          }
        } catch (error) {
          console.error('Ders bazlı soru sayısı yüklenemedi:', error);
        }
      }
    };

    loadSubjectQuestions();
  }, [token, questions]);

  // subjectQuestionCounts değiştiğinde currentSubjectAIEnabled'ı güncelle
  useEffect(() => {
    const currentDersId = questions[0]?.ders_id;
    if (currentDersId && subjectQuestionCounts[currentDersId]) {
      const currentCount = subjectQuestionCounts[currentDersId].total_questions || 0;
      setCurrentSubjectAIEnabled(currentCount >= 30);
    }
  }, [subjectQuestionCounts, questions]);

  if (!questions.length) {
    return (
      <div className="main-wrapper">
        <div className="container-fluid">
          <div className="row justify-content-center">
            <div className="col-md-6 text-center">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Yükleniyor...</span>
              </div>
              <p className="mt-3">Test yükleniyor...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    }
  };

  return (
    <div className="main-wrapper">
      <Header />

      <div className="container-fluid">
        <div className="row">
          {/* Main Content */}
          <main className="main-wrapper col-12 py-4 px-md-4">
            <div className="title-group mb-3">
              <h1 className="h2 mb-0">Test - {dersler.find(d => d.id === questions[idx]?.ders_id)?.name} ({etiket})</h1>
              <small className="text-muted">Soru {idx + 1} / {questions.length}</small>
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
                    <b>Ortalama Çözüm Süresi:</b> {ortalamaSure} saniye
                  </div>
                  <h3>Konu Bazlı Doğru/Yanlış</h3>
                  <table className="account-table" style={{margin: '0 auto 1.5rem auto'}}>
                    <thead>
                      <tr>
                        <th>Konu</th><th>Toplam</th><th>Doğru</th><th>Yanlış</th><th>Boş</th><th>Ort. Süre</th>
                      </tr>
                    </thead>
                    <tbody>
                      {konuBazli.map((k, i) => (
                        <tr key={i}>
                          <td>{getKonuIsmi(k.ders_id, k.konu_id)}</td><td>{k.toplam}</td><td>{k.dogru}</td><td>{k.yanlis}</td><td>{k.bos}</td><td>{k.ortalamaSure}s</td>
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
                      {analysisRecommendations.map((rec, index) => (
                        <li key={index} style={{marginBottom: '0.5rem'}}>{rec}</li>
                      ))}
                    </ul>
                    <div style={{marginTop: '1rem', color: '#2e7d32', fontWeight: 'bold'}}>
                      {motivationalMessage}
                    </div>
                  </div>
                  <button onClick={handleReportClose} style={{ marginTop: '2.5rem', padding: '0.7rem 2.5rem', fontSize: '1.1rem', borderRadius: 8, background: '#007bff', color: 'white', border: 'none', cursor: 'pointer' }}>Ana Sayfaya Dön</button>
                </div>
              </div>
            )}

            {/* Test Area */}
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
                 <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
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
                                               <div 
                          key={lbl} 
                          className="form-check mb-3 p-3 border rounded" 
                          style={{ 
                            borderColor: sel === lbl ? '#007bff' : '#e9ecef',
                            backgroundColor: sel === lbl ? '#f8f9ff' : '#fff',
                            transition: 'all 0.3s ease',
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '0.75rem',
                            maxWidth: '50%',
                            width: '50%',
                            minHeight: 'auto',
                            cursor: 'pointer'
                          }}
                          onClick={() => {
                            if (!showExplanation) {
                              setSel(sel === lbl ? '' : lbl);
                            }
                          }}
                        >
                          <input
                            className="form-check-input"
                            type="radio"
                            name="answer"
                            id={`option-${lbl}`}
                            value={lbl}
                            checked={sel === lbl}
                            onChange={() => {}} // Boş bırakıyoruz çünkü onClick ile kontrol ediyoruz
                            disabled={showExplanation}
                            style={{ 
                              marginTop: '0.2rem',
                              flexShrink: 0
                            }}
                          />
                          <div className="flex-grow-1" style={{ 
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '0.75rem',
                            width: '100%'
                          }}>
                            <span className="badge bg-primary" style={{ 
                              fontSize: '0.75rem',
                              padding: '0.25rem 0.5rem',
                              flexShrink: 0,
                              marginTop: '0.1rem'
                            }}>{lbl}</span>
                            <span style={{ 
                              fontSize: '0.95rem', 
                              lineHeight: '1.4',
                              flexGrow: 1,
                              wordWrap: 'break-word',
                              overflowWrap: 'break-word'
                            }}>{txt || 'Şık metni yüklenemedi'}</span>
                          </div>
                        </div>
                     ));
                   })()}
                 </div>

                 {/* Butonlar - Alt Taraf */}
                 <div className="d-flex justify-content-center gap-3 mt-4">
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
                   <div className={`alert ${
                     msg.includes('✔️') ? 'alert-success' : 
                     msg.includes('⚠️') ? 'alert-warning' : 
                     'alert-danger'
                   } mb-4`}>
                     {msg}
                   </div>
                 )}

                {/* AI Tahmin Mesajı - Her zaman alınır ama sadece o ders için 30 soru sonrası gösterilir */}
                {(() => {
                  const shouldShow = showPrediction && aiPrediction && currentSubjectAIEnabled && !(userData?.hide_ai_recommendations);
                  console.log('DEBUG TestPage - AI Prediction Display Check:', {
                    showPrediction,
                    aiPrediction: !!aiPrediction,
                    currentSubjectAIEnabled,
                    userData_hide_ai: userData?.hide_ai_recommendations,
                    shouldShow
                  });
                  return shouldShow;
                })() && (
                  <div className={`alert mb-4 ${
                    aiPrediction.motivational_message.type === 'excellent' ? 'alert-success' :
                    aiPrediction.motivational_message.type === 'strong' ? 'alert-info' :
                    aiPrediction.motivational_message.type === 'good' ? 'alert-primary' :
                    aiPrediction.motivational_message.type === 'medium' ? 'alert-warning' :
                    'alert-secondary'
                  }`}>
                    <div className="d-flex align-items-start">
                      <div className="me-3" style={{ fontSize: '2rem' }}>
                        {aiPrediction.motivational_message.emoji}
                      </div>
                      <div className="flex-grow-1">
                        <h6 className="mb-2">{aiPrediction.motivational_message.title}</h6>
                        <p className="mb-2">{aiPrediction.motivational_message.message}</p>
                        
                        {/* AI Tahmin */}
                        <div className="mt-3">
                          <div className="d-flex align-items-center">
                            <small className="text-muted me-2">AI Tahmin:</small>
                            <div className="progress flex-grow-1 me-2" style={{ height: '8px' }}>
                              <div 
                                className="progress-bar bg-primary" 
                                style={{ width: `${aiPrediction.prediction_percentage}%` }}
                              ></div>
                            </div>
                            <small className="text-muted">%{aiPrediction.prediction_percentage}</small>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* AI Önerisi Mesajı (o ders için 30 soru altında) */}
                {showPrediction && !currentSubjectAIEnabled && !(userData?.hide_ai_recommendations) && 
                 (subjectQuestionCounts[questions[0]?.ders_id]?.total_questions || 0) < 30 && (
                  <div className="alert alert-info mb-4">
                    <div className="d-flex align-items-start">
                      <div className="me-3" style={{ fontSize: '2rem' }}>
                        🤖
                      </div>
                      <div className="flex-grow-1">
                        <h6 className="mb-2">AI Önerileri Yakında Aktif Olacak</h6>
                        <p className="mb-0">
                          Bu ders için AI önerileri ve tahminler için {Math.max(0, 30 - (subjectQuestionCounts[questions[0]?.ders_id]?.total_questions || 0))} soru daha çözmeniz gerekiyor. 
                          Bu sayede AI modeliniz bu ders için performansınızı daha iyi analiz edebilir.
                        </p>
                      </div>
                    </div>
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
          </main>
        </div>
      </div>
    </div>
  );
}