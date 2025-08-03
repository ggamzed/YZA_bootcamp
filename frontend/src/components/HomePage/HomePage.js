import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getCurrentUser } from '../../api/auth';
import { fetchCompletedTests, fetchStats } from '../../api/statistics';
import { getUserLevel } from '../../api/profile';
import { useUser } from '../../contexts/UserContext';
import Header from '../Header';
import './HomePage.css';

// Bootstrap tooltip'leri aktif hale getirmek için
const initializeTooltips = () => {
  if (typeof window !== 'undefined' && window.bootstrap) {
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
      return new window.bootstrap.Tooltip(tooltipTriggerEl);
    });
  }
};

export default function HomePage({ onLogout }) {
  const navigate = useNavigate();
  const { 
    token, 
    resetKey, 
    user: globalUser, 
    setUser: setGlobalUser,
    // Pomodoro state'leri ve fonksiyonları
    pomodoroTime,
    isRunning,
    isBreak,
    pomodoroCount,
    currentSession,
    showFloatingPomodoro,
    startPomodoro,
    pausePomodoro,
    resetPomodoro,
    closeFloatingPomodoro,
    setShowFloatingPomodoro,
    formatTime,
    getProgressPercentage
  } = useUser();

  const [dersId, setDersId] = useState('');
  const [etiket, setEtiket] = useState('');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [recentActivities, setRecentActivities] = useState([]);
  const [userLevel, setUserLevel] = useState(null);
  const [stats, setStats] = useState([]);

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

            setUser(null);
        setRecentActivities([]);
        setStats([]);
        setLoading(false);
    

    if (token) {

      setTimeout(() => {
        const fetchUser = async () => {
          try {
            const userData = await getCurrentUser(token);
            setUser(userData);
            // Global user state'ini de güncelle
            setGlobalUser(userData);
          } catch (error) {
            console.error('Kullanıcı bilgileri alınamadı:', error);
          }
        };
        
        const fetchRecentActivities = async () => {
          try {
            const data = await fetchCompletedTests(token);
            setRecentActivities(data.slice(0, 3));
          } catch (error) {
            console.error('Son aktiviteler alınamadı:', error);
          }
        };

        const fetchStatsData = async () => {
          try {
            const data = await fetchStats(token);
            setStats(data);
          } catch (error) {
            console.error('İstatistikler alınamadı:', error);
          }
        };


        const fetchUserLevel = async () => {
          try {
            const levelData = await getUserLevel(token);
            setUserLevel(levelData);
          } catch (error) {
            console.error('Kullanıcı seviyesi alınamadı:', error);
          }
        };
        
        fetchUser();
        fetchRecentActivities();
        fetchStatsData();
        fetchUserLevel();
      }, 100);
    }
  }, [token, resetKey]);

  // Tooltip'leri başlat
  useEffect(() => {
    if (userLevel) {
      const checkBootstrap = () => {
        if (typeof window !== 'undefined' && window.bootstrap) {
          initializeTooltips();
        } else {
          setTimeout(checkBootstrap, 100);
        }
      };
      checkBootstrap();
    }
  }, [userLevel]);

  const startTest = async () => {
    if (!dersId || !etiket) return alert('Lütfen ders ve etiket seçin');
    setLoading(true);
    try {
      // Önce test oturumu başlat
      const sessionRes = await fetch(
        `http://localhost:8000/questions/start-test?ders_id=${dersId}&etiket=${encodeURIComponent(etiket)}`,
        { 
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` } 
        }
      );
      
      if (!sessionRes.ok) {
        throw new Error(`HTTP error! status: ${sessionRes.status}`);
      }
      
      const sessionData = await sessionRes.json();
      const testSessionId = sessionData.test_session_id;
      
      // Sonra soruları al
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
          questions,
          testSessionId
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
    if (onLogout) {
      onLogout();
    }
  };

  const formatActivityTime = (dateString) => {
    try {
      // Backend'den gelen tarih formatlanmış string (dd.mm.yyyy hh:mm)
      if (typeof dateString === 'string' && dateString.includes('.')) {
        // Tarih string'ini parse et
        const [datePart, timePart] = dateString.split(' ');
        const [day, month, year] = datePart.split('.');
        const [hour, minute] = timePart ? timePart.split(':') : ['00', '00'];
        
        // Türkiye saat diliminde Date objesi oluştur
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute));
        const now = new Date();
        
        // Farkı hesapla (milisaniye cinsinden)
        const diffInMs = now - date;
        const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
        const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
        const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
        
        if (diffInMinutes < 1) return 'Az önce';
        if (diffInMinutes < 60) return `${diffInMinutes} dakika önce`;
        if (diffInHours < 24) return `${diffInHours} saat önce`;
        if (diffInDays < 7) return `${diffInDays} gün önce`;
        
        // 7 günden fazla ise tarihi göster
        return dateString;
      }
      
      // Eğer ISO format string ise (fallback)
      const date = new Date(dateString);
      const now = new Date();
      const diffInMs = now - date;
      const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
      const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
      const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
      
      if (diffInMinutes < 1) return 'Az önce';
      if (diffInMinutes < 60) return `${diffInMinutes} dakika önce`;
      if (diffInHours < 24) return `${diffInHours} saat önce`;
      if (diffInDays < 7) return `${diffInDays} gün önce`;
      
      return date.toLocaleDateString('tr-TR');
    } catch (error) {
      return 'Zaman bilgisi yok';
    }
  };

  const getLevelColor = (levelId) => {
    switch (levelId) {
      case 1: return 'bg-secondary'; // Tembel Fil - Gri
      case 2: return 'bg-warning';   // Hızlı Karınca - Sarı
      case 3: return 'bg-success';   // Zıplayan Çekirge - Yeşil
      case 4: return 'bg-primary';   // Çalışkan Arı - Mavi
      default: return 'bg-secondary';
    }
  };



  return (
    <div className="main-wrapper">
      <Header />

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
                {(globalUser || user)?.show_stats === true ? (
                  <div className="custom-block bg-white mt-4">
                    <h5 className="mb-4">Genel İstatistikler</h5>
                    
                    <div className="row">
                      <div className="col-6">
                        <div className="custom-block-bottom-item text-center">
                          <div className="custom-block-numbers">
                            <span className="h3 text-primary">
                              {(() => {
                                const konuStats = stats.filter(stat => stat.konu_id > 0);
                                return konuStats.reduce((sum, stat) => sum + (stat.total || 1), 0);
                              })()}
                            </span>
                          </div>
                          <small>Toplam Soru</small>
                        </div>
                      </div>
                      
                      <div className="col-6">
                        <div className="custom-block-bottom-item text-center">
                          <div className="custom-block-numbers">
                            <span className="h3 text-success">
                              {(() => {
                                const konuStats = stats.filter(stat => stat.konu_id > 0);
                                const total = konuStats.reduce((sum, stat) => sum + (stat.total || 1), 0);
                                const correct = konuStats.reduce((sum, stat) => sum + (stat.correct || 0), 0);
                                return total > 0 ? Math.round((correct / total) * 100) : 0;
                              })()}%
                            </span>
                          </div>
                          <small>Başarı Oranı</small>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="custom-block bg-white mt-4">
                    <h5 className="mb-4">Genel İstatistikler</h5>
                    <div className="text-center py-3">
                      <i className="bi-graph-down text-muted" style={{ fontSize: '2rem' }}></i>
                      <p className="text-muted mt-2 mb-0">İstatistikler gizli</p>
                      <small className="text-muted">Bu kullanıcı istatistiklerini gizlemiş</small>
                    </div>
                  </div>
                )}

                {/* Pomodoro Zamanlayıcısı */}
                <div className={`custom-block mt-4 pomodoro-container ${isBreak ? 'break-mode' : ''}`}>
                  <h5 className="mb-4 text-center">
                    🍅 Pomodoro Zamanlayıcısı
                  </h5>
                  
                  <div className="text-center">
                    <div className="pomodoro-status">
                      {currentSession === 'focus' ? '' : 
                       currentSession === 'shortBreak' ? '☕ Kısa Mola' : 
                       '🛋️ Uzun Mola'}
                    </div>
                    
                    <div className="pomodoro-timer">
                      {formatTime(pomodoroTime)}
                    </div>
                    
                    <div className="pomodoro-progress">
                      <div 
                        className="pomodoro-progress-bar" 
                        style={{ width: `${getProgressPercentage()}%` }}
                      ></div>
                    </div>
                    
                    <div className="d-flex justify-content-center pomodoro-controls flex-wrap">
                      {!isRunning ? (
                        <button 
                          className="btn pomodoro-btn" 
                          onClick={startPomodoro}
                        >
                          <i className="bi-play-fill me-2"></i>Başlat
                        </button>
                      ) : (
                        <button 
                          className="btn pomodoro-btn" 
                          onClick={pausePomodoro}
                        >
                          <i className="bi-pause-fill me-2"></i>Duraklat
                        </button>
                      )}
                      
                      <button 
                        className="btn pomodoro-btn" 
                        onClick={resetPomodoro}
                      >
                        <i className="bi-arrow-clockwise me-2"></i>Sıfırla
                      </button>
                      
                      {!showFloatingPomodoro && (
                        <button 
                          className="btn pomodoro-btn" 
                          onClick={() => setShowFloatingPomodoro(true)}
                          title="Floating modda aç"
                        >
                          <i className="bi-pip me-2"></i>Floating
                        </button>
                      )}
                    </div>
                    
                    <div className="pomodoro-stats">
                      <div className="row">
                        <div className="col-6">
                          <div className="pomodoro-counter">
                            🎯 Tamamlanan Pomodoro
                          </div>
                          <div className="h4 mb-0">{pomodoroCount}</div>
                        </div>
                        <div className="col-6">
                          <div className="pomodoro-counter">
                            🕐 Mevcut Durum
                          </div>
                          <div className="small">
                            {currentSession === 'focus' ? 'Çalışma' : 'Mola'}
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-3 small opacity-75">
                        💡 <strong>Pomodoro Tekniği:</strong> 25 dakika odaklanma, 5 dakika mola. 
                        Her 4 pomodoro sonrasında 20 dakika uzun mola.
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sidebar Content */}
              <div className="col-lg-5 col-12">
                {(globalUser || user)?.show_profile === true ? (
                  <div className="custom-block custom-block-profile text-center bg-white">
                    <div className="custom-block-profile-image-wrap mb-4">
                      <img 
                        src={`http://localhost:8000/img/${(globalUser || user)?.profile_picture || 'kurbaga.jpeg'}`} 
                        className="custom-block-profile-image img-fluid rounded-circle" 
                        alt="User" 
                        style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                      />
                    </div>

                    <p className="d-flex flex-wrap mb-2">
                      <strong>Kullanıcı:</strong>
                      <span>{(globalUser || user)?.username || 'Test Kullanıcısı'}</span>
                    </p>

                    {((globalUser || user)?.first_name || (globalUser || user)?.last_name) && (
                      <p className="d-flex flex-wrap mb-2">
                        <strong>Ad Soyad:</strong>
                        <span>{`${(globalUser || user)?.first_name || ''} ${(globalUser || user)?.last_name || ''}`.trim()}</span>
                      </p>
                    )}

                    {(globalUser || user)?.birth_date && (
                      <p className="d-flex flex-wrap mb-2">
                        <strong>Doğum Tarihi:</strong>
                        <span>{new Date((globalUser || user).birth_date).toLocaleDateString('tr-TR')}</span>
                      </p>
                    )}

                    <p className="d-flex flex-wrap mb-0">
                      <strong>Seviye:</strong>
                      {userLevel ? (
                        <span 
                          className={`badge ${getLevelColor(userLevel.level_info.level_id)} ms-2 text-white position-relative level-tooltip`}
                          data-bs-toggle="tooltip"
                          data-bs-placement="top"
                          data-bs-custom-class="level-tooltip-custom"
                          title="Seviye Bilgileri: 🐘 Tembel Fil: 0-450 soru | 🐜 Hızlı Karınca: 451-900 soru | 🦗 Zıplayan Çekirge: 901-1200 soru | 🐝 Çalışkan Arı: 1500+ soru"
                        >
                          {userLevel.level_info.level}
                        </span>
                      ) : (
                        <span className="badge bg-secondary ms-2">Yükleniyor...</span>
                      )}
                    </p>
                  </div>
                ) : (
                  <div className="custom-block custom-block-profile text-center bg-white">
                    <div className="text-center py-4">
                      <i className="bi-eye-slash text-muted" style={{ fontSize: '3rem' }}></i>
                      <p className="text-muted mt-3">Profil gizli</p>
                      
                    </div>
                  </div>
                )}

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