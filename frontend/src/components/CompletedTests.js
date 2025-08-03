import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getCurrentUser } from '../api/auth';
import { fetchCompletedTests as fetchCompletedTestsAPI } from '../api/statistics';
import { useUser } from '../contexts/UserContext';
import Header from './Header';
import './CompletedTests.css';

export default function CompletedTests({ onLogout }) {
  const navigate = useNavigate();
  const { token, resetKey } = useUser();
  const [completedTests, setCompletedTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [selectedTest, setSelectedTest] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const dersler = [
    { id: 1, name: 'Matematik', icon: 'bi-calculator' },
    { id: 2, name: 'Fizik', icon: 'bi-lightning' },
    { id: 3, name: 'Kimya', icon: 'bi-flask' },
    { id: 4, name: 'Biyoloji', icon: 'bi-heart-pulse' },
    { id: 5, name: 'Türkçe', icon: 'bi-book' },
    { id: 6, name: 'Tarih', icon: 'bi-clock-history' },
  ];

  useEffect(() => {

    setCompletedTests([]);
    setLoading(true);
    setUser(null);
    
 
    if (token) {

      setTimeout(() => {
        fetchCompletedTests();
        fetchUser();
      }, 100);
    }
  }, [token, resetKey]);

  const fetchUser = async () => {
    try {
      const userData = await getCurrentUser(token);
      setUser(userData);
    } catch (error) {
      console.error('Kullanıcı bilgileri alınamadı:', error);
    }
  };

  const fetchCompletedTests = async () => {
    try {
      setLoading(true);
      console.log('DEBUG: Fetching completed tests with token:', token ? 'Token exists' : 'No token');
      const data = await fetchCompletedTestsAPI(token);
      console.log('DEBUG: Completed tests data received:', data.length, 'items');
      console.log('DEBUG: First test data sample:', data[0]);
      setCompletedTests(data);
    } catch (error) {
      console.error('Test yükleme hatası:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      localStorage.removeItem('token');
    }
    navigate('/');
  };

  const getDersName = (dersId) => {
    return dersler.find(d => d.id === dersId)?.name || `Ders ${dersId}`;
  };

  const getDersIcon = (dersId) => {
    return dersler.find(d => d.id === dersId)?.icon || 'bi-question';
  };

  const getAccuracyColor = (accuracy) => {
    if (accuracy >= 80) return 'success';
    if (accuracy >= 60) return 'warning';
    return 'danger';
  };

  const handleShowDetails = (test) => {
    setSelectedTest(test);
    setShowDetailModal(true);
  };

  const handleCloseModal = () => {
    setShowDetailModal(false);
    setSelectedTest(null);
  };

  const formatDate = (dateString) => {
    if (typeof dateString === 'string' && dateString.includes('.')) {
      return dateString;
    }
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('tr-TR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Tarih bilgisi yok';
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
                  <Link className="nav-link" to="/home">
                    <i className="bi-house-fill me-2"></i>
                    Ana Sayfa
                  </Link>
                </li>

                <li className="nav-item">
                  <Link className="nav-link" to="/statistics">
                    <i className="bi-graph-up me-2"></i>
                    İstatistikler
                  </Link>
                </li>

                <li className="nav-item">
                  <a className="nav-link active" aria-current="page" href="#">
                    <i className="bi-file-text me-2"></i>
                    Çözülen Testler
                  </a>
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
              <h1 className="h2 mb-0">Çözülen Testler</h1>
              <small className="text-muted">Geçmiş test performanslarınızı inceleyin</small>
            </div>

            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Yükleniyor...</span>
                </div>
              </div>
            ) : completedTests.length === 0 ? (
              <div className="custom-block bg-white text-center py-5">
                <i className="bi-file-text display-1 text-muted mb-3"></i>
                <h4>Henüz test çözülmemiş</h4>
                <p className="text-muted">Test çözmeye başlayarak burada geçmiş performanslarınızı görebilirsiniz.</p>
                <Link to="/home" className="btn custom-btn">
                  <i className="bi-play-circle me-2"></i>
                  Test Başlat
                </Link>
              </div>
            ) : (
              <div className="row">
                {completedTests.map((test, index) => (
                  <div key={index} className="col-lg-6 col-md-12 mb-4">
                    <div className="custom-block bg-white">
                      <div className="d-flex align-items-center mb-3">
                        <div className="profile-rounded bg-primary text-white me-3">
                          <i className={getDersIcon(test.ders_id)}></i>
                        </div>
                        <div>
                          <h5 className="mb-1">{getDersName(test.ders_id)} Testi</h5>
                          <small className="text-muted">{formatDate(test.test_date)}</small>
                        </div>
                        <div className="ms-auto">
                          <span className={`badge bg-${getAccuracyColor(test.accuracy)} fs-6`}>
                            {test.accuracy}%
                          </span>
                        </div>
                      </div>

                      <div className="row text-center mb-3">
                        <div className="col-4">
                          <div className="custom-block-numbers">
                            <span className="h4 text-primary">{test.total_questions}</span>
                          </div>
                          <small>Toplam Soru</small>
                        </div>
                        <div className="col-4">
                          <div className="custom-block-numbers">
                            <span className="h4 text-success">{test.correct_answers}</span>
                          </div>
                          <small>Doğru</small>
                        </div>
                        <div className="col-4">
                          <div className="custom-block-numbers">
                            <span className="h4 text-danger">{test.incorrect_answers}</span>
                          </div>
                          <small>Yanlış</small>
                        </div>
                      </div>

                      <div className="progress mb-3" style={{ height: '8px' }}>
                        <div 
                          className="progress-bar bg-success" 
                          style={{ width: `${test.accuracy}%` }}
                        ></div>
                      </div>

                      {test.konu_bazli && test.konu_bazli.length > 0 && (
                        <div className="mb-3">
                          <h6 className="mb-2">Konu Bazlı Performans</h6>
                          <div className="table-responsive">
                            <table className="table table-sm">
                              <thead>
                                <tr>
                                  <th>Konu</th>
                                  <th>Başarı</th>
                                </tr>
                              </thead>
                              <tbody>
                                {test.konu_bazli.slice(0, 3).map((konu, idx) => (
                                  <tr key={idx}>
                                    <td>{konu.konu_name || `Konu ${konu.konu_id}`}</td>
                                    <td>
                                      <span className={`badge bg-${getAccuracyColor(konu.accuracy)}`}>
                                        {konu.accuracy}%
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      <div className="d-flex justify-content-between align-items-center">
                        <small className="text-muted">
                          <i className="bi-clock me-1"></i>
                          {test.duration_minutes ? `${Math.floor(test.duration_minutes)} dakika` : `${test.total_questions * 2} dakika`}
                        </small>
                        <button className="btn btn-outline-primary btn-sm" onClick={() => handleShowDetails(test)}>
                          <i className="bi-eye me-1"></i>
                          Detayları Gör
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Detay Modal */}
      {showDetailModal && selectedTest && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                <i className={`${getDersIcon(selectedTest.ders_id)} me-2`}></i>
                {getDersName(selectedTest.ders_id)} Test Detayları
              </h3>
              <button className="modal-close" onClick={handleCloseModal}>
                <i className="bi-x-lg"></i>
              </button>
            </div>
            
            <div className="modal-body">
              {/* Test Genel Bilgileri */}
              <div className="test-summary mb-4">
                <div className="row">
                  <div className="col-md-6">
                    <div className="info-item">
                      <label>Test Tarihi:</label>
                      <span>{selectedTest.test_date}</span>
                    </div>
                    <div className="info-item">
                      <label>Toplam Soru:</label>
                      <span>{selectedTest.total_questions}</span>
                    </div>
                    <div className="info-item">
                      <label>Test Süresi:</label>
                      <span>{selectedTest.duration_minutes ? `${Math.floor(selectedTest.duration_minutes)} dakika` : `${selectedTest.total_questions * 2} dakika`}</span>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="info-item">
                      <label>Genel Başarı:</label>
                      <span className={`badge bg-${getAccuracyColor(selectedTest.accuracy)}`}>
                        {selectedTest.accuracy}%
                      </span>
                    </div>
                    <div className="info-item">
                      <label>Doğru Cevap:</label>
                      <span className="text-success">{selectedTest.correct_answers}</span>
                    </div>
                    <div className="info-item">
                      <label>Yanlış Cevap:</label>
                      <span className="text-danger">{selectedTest.incorrect_answers}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Konu Bazlı Performans */}
              {selectedTest.konu_bazli && selectedTest.konu_bazli.length > 0 && (
                <div className="performance-section mb-4">
                  <h5 className="section-title">
                    <i className="bi-book me-2"></i>
                    Konu Bazlı Performans
                  </h5>
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead>
                        <tr>
                          <th>Konu ID</th>
                          <th>Toplam Soru</th>
                          <th>Doğru</th>
                          <th>Başarı Oranı</th>
                          <th>Durum</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedTest.konu_bazli.map((konu, idx) => (
                          <tr key={idx}>
                            <td>
                              <strong>{konu.konu_name || `Konu ${konu.konu_id}`}</strong>
                            </td>
                            <td>{konu.total}</td>
                            <td className="text-success">{konu.correct}</td>
                            <td>
                              <span className={`badge bg-${getAccuracyColor(konu.accuracy)}`}>
                                {konu.accuracy}%
                              </span>
                            </td>
                            <td>
                              {konu.accuracy >= 80 ? (
                                <span className="text-success">
                                  <i className="bi-check-circle me-1"></i>Mükemmel
                                </span>
                              ) : konu.accuracy >= 60 ? (
                                <span className="text-warning">
                                  <i className="bi-exclamation-circle me-1"></i>İyi
                                </span>
                              ) : (
                                <span className="text-danger">
                                  <i className="bi-x-circle me-1"></i>Geliştirilmeli
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Zorluk Seviyesi Bazlı Performans */}
              {selectedTest.zorluk_bazli && selectedTest.zorluk_bazli.length > 0 && (
                <div className="performance-section mb-4">
                  <h5 className="section-title">
                    <i className="bi-graph-up me-2"></i>
                    Zorluk Seviyesi Bazlı Performans
                  </h5>
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead>
                        <tr>
                          <th>Zorluk Seviyesi</th>
                          <th>Toplam Soru</th>
                          <th>Doğru</th>
                          <th>Başarı Oranı</th>
                          <th>Durum</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedTest.zorluk_bazli.map((zorluk, idx) => (
                          <tr key={idx}>
                            <td>
                              <strong>
                                {zorluk.zorluk_name || 
                                 (zorluk.zorluk === 1 ? 'Kolay' : 
                                  zorluk.zorluk === 2 ? 'Orta' : 
                                  zorluk.zorluk === 3 ? 'Zor' : `Seviye ${zorluk.zorluk}`)}
                              </strong>
                            </td>
                            <td>{zorluk.total}</td>
                            <td className="text-success">{zorluk.correct}</td>
                            <td>
                              <span className={`badge bg-${getAccuracyColor(zorluk.accuracy)}`}>
                                {zorluk.accuracy}%
                              </span>
                            </td>
                            <td>
                              {zorluk.accuracy >= 80 ? (
                                <span className="text-success">
                                  <i className="bi-check-circle me-1"></i>Mükemmel
                                </span>
                              ) : zorluk.accuracy >= 60 ? (
                                <span className="text-warning">
                                  <i className="bi-exclamation-circle me-1"></i>İyi
                                </span>
                              ) : (
                                <span className="text-danger">
                                  <i className="bi-x-circle me-1"></i>Geliştirilmeli
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Performans Analizi */}
              <div className="performance-analysis">
                <h5 className="section-title">
                  <i className="bi-lightbulb me-2"></i>
                  Performans Analizi
                </h5>
                <div className="row">
                  <div className="col-md-6">
                    <div className="analysis-card">
                      <h6>Güçlü Yönler</h6>
                      <ul className="analysis-list">
                        {selectedTest.konu_bazli && selectedTest.konu_bazli
                          .filter(konu => konu.accuracy >= 80)
                          .map((konu, idx) => (
                            <li key={idx} className="text-success">
                              <i className="bi-check-circle me-1"></i>
                              {konu.konu_name || `Konu ${konu.konu_id}`} - %{konu.accuracy} başarı
                            </li>
                          ))}
                        {(!selectedTest.konu_bazli || selectedTest.konu_bazli.filter(konu => konu.accuracy >= 80).length === 0) && (
                          <li className="text-muted">Henüz güçlü yön belirlenmedi</li>
                        )}
                      </ul>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="analysis-card">
                      <h6>Geliştirilmesi Gerekenler</h6>
                      <ul className="analysis-list">
                        {selectedTest.konu_bazli && selectedTest.konu_bazli
                          .filter(konu => konu.accuracy < 60)
                          .map((konu, idx) => (
                            <li key={idx} className="text-danger">
                              <i className="bi-exclamation-triangle me-1"></i>
                              {konu.konu_name || `Konu ${konu.konu_id}`} - %{konu.accuracy} başarı
                            </li>
                          ))}
                        {(!selectedTest.konu_bazli || selectedTest.konu_bazli.filter(konu => konu.accuracy < 60).length === 0) && (
                          <li className="text-muted">Tüm konularda iyi performans</li>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={handleCloseModal}>
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 