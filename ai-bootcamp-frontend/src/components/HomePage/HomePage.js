import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getCurrentUser } from '../../api/auth';
import { fetchCompletedTests, fetchAIRecommendations } from '../../api/statistics';
import './HomePage.css';

export default function HomePage({ token, setToken }) {
  const navigate = useNavigate();

  const [dersId, setDersId] = useState('');
  const [etiket, setEtiket] = useState('');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [recentActivities, setRecentActivities] = useState([]);
  const [aiRecommendations, setAiRecommendations] = useState(null);

  const dersler = [
    { id: 1, name: 'Matematik', icon: 'bi-calculator' },
    { id: 2, name: 'Fizik', icon: 'bi-lightning' },
    { id: 3, name: 'Kimya', icon: 'bi-flask' },
    { id: 4, name: 'Biyoloji', icon: 'bi-heart-pulse' },
    { id: 5, name: 'Türkçe', icon: 'bi-book' },
    { id: 6, name: 'Tarih', icon: 'bi-clock-history' },
  ];
  
  const etiketler = ['TYT', 'AYT', 'YKS', 'DGS', 'KPSS'];

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

  const startTest = async () => {
    if (!dersId || !etiket) return alert('Lütfen ders ve etiket seçin');
    setLoading(true);
    try {
      const res = await fetch(
        `http://localhost:8000/questions/batch?ders_id=${dersId}&etiket=${encodeURIComponent(etiket)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const questions = await res.json();
      
      navigate('/test', { 
        state: { 
          dersId: parseInt(dersId), 
          etiket, 
          questions 
        } 
      });
    } catch (error) {
      console.error('Test başlatma hatası:', error);
      let errorMessage = 'Test başlatılırken bir hata oluştu. Lütfen tekrar deneyin.';
      
      if (error.message.includes('401')) {
        errorMessage = 'Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.';
      } else if (error.message.includes('400')) {
        errorMessage = 'Seçilen ders ve etiket için yeterli soru bulunamadı. Lütfen farklı bir seçim yapın.';
      } else if (error.message.includes('500')) {
        errorMessage = 'Sunucu hatası. Lütfen daha sonra tekrar deneyin.';
      } else if (error.message.includes('fetch')) {
        errorMessage = 'İnternet bağlantınızı kontrol edin ve tekrar deneyin.';
      }
      
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken('');
    navigate('/');
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

            <div className="row my-4">
              {/* Test Form */}
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
                      {loading ? 'Sorular Yükleniyor...' : 'Teste Başla'}
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

              {/* Sidebar Content */}
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
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}