import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getCurrentUser } from '../../api/auth';
import { fetchStats, fetchSubjectStats, fetchTopicStats, fetchTimeStats } from '../../api/statistics';
import { useUser } from '../../contexts/UserContext';
import Header from '../Header';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import './StatsPage.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler
);

const DERS_ISIMLERI = {
  1: 'Matematik',
  2: 'Fizik',
  3: 'Kimya',
  4: 'Biyoloji',
  5: 'Türkçe',
  6: 'Tarih'
};

const KONU_ISIMLERI = {
  1: {
    1: 'Basit Eşitsizlikler',
    2: 'Fonksiyonlar',
    3: 'Olasılık',
    4: 'Türev',
    5: 'İntegral',
    6: 'Trigonometri',
    7: 'Logaritma',
    8: 'Limit',
    9: 'Süreklilik',
    10: 'Asimptotlar'
  },
  2: {
    1: 'Mekanik',
    2: 'Elektrik',
    3: 'Optik',
    4: 'Termodinamik',
    5: 'Dalgalar',
    6: 'Atom Fiziği',
    7: 'Nükleer Fizik',
    8: 'Manyetizma',
    9: 'Elektromanyetizma',
    10: 'Modern Fizik'
  },
  3: {
    1: 'Atomun Yapısı',
    2: 'Periyodik Sistem',
    3: 'Kimyasal Bağlar',
    4: 'Mol Kavramı',
    5: 'Kimyasal Tepkimeler',
    6: 'Çözeltiler',
    7: 'Asitler ve Bazlar',
    8: 'Elektrokimya',
    9: 'Organik Kimya',
    10: 'Çevre Kimyası'
  },
  4: {
    1: 'Hücre Bilimi',
    2: 'Genetik',
    3: 'Evrim',
    4: 'Sistemler',
    5: 'Ekoloji',
    6: 'Bitki Biyolojisi',
    7: 'Hayvan Biyolojisi',
    8: 'İnsan Fizyolojisi',
    9: 'Mikrobiyoloji',
    10: 'Biyoteknoloji'
  },
  5: {
    1: 'Dil Bilgisi',
    2: 'Anlatım Bozuklukları',
    3: 'Paragraf',
    4: 'Cümle Yapısı',
    5: 'Kelime Bilgisi',
    6: 'Yazım Kuralları',
    7: 'Noktalama',
    8: 'Ses Bilgisi',
    9: 'Şekil Bilgisi',
    10: 'Söz Sanatları'
  },
  6: {
    1: 'İnkılap Tarihi',
    2: 'Osmanlı Tarihi',
    3: 'Cumhuriyet Tarihi',
    4: 'İslam Tarihi',
    5: 'Orta Çağ Tarihi',
    6: 'Yeni Çağ Tarihi',
    7: 'Yakın Çağ Tarihi',
    8: 'Türk Tarihi',
    9: 'Dünya Tarihi',
    10: 'Çağdaş Tarih'
  }
};

export default function Statistics({ onLogout }) {
  const navigate = useNavigate();
  const { token, resetKey } = useUser();
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState('all'); // all, week, month, year
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [expandedSubjects, setExpandedSubjects] = useState(new Set());
  const [user, setUser] = useState(null);
  const [timeStats, setTimeStats] = useState([]);

  useEffect(() => {
    setStats([]);
    setLoading(true);
    setTimeFilter('all');
    setSelectedSubject('all');
    setExpandedSubjects(new Set());
    setUser(null);

    if (token) {
      setTimeout(() => {
        fetchAllStats();
        fetchUser();
      }, 100);
    }
  }, [token, resetKey]);

  useEffect(() => {
    if (token) {
      setTimeout(() => {
        fetchAllStats();
      }, 100);
    }
  }, [timeFilter, token]);

  const fetchUser = async () => {
    try {
      console.log('DEBUG: Fetching user with token:', token ? 'Token exists' : 'No token');
      const userData = await getCurrentUser(token);
      console.log('DEBUG: User data received:', userData);
      setUser(userData);
    } catch (error) {
      console.error('Kullanıcı bilgileri alınamadı:', error);
    }
  };

  const fetchAllStats = async () => {
    try {
      setLoading(true);
      console.log('DEBUG: Fetching stats with token:', token ? 'Token exists' : 'No token');
      const data = await fetchStats(token);
      console.log('DEBUG: Stats data received:', data.length, 'items');
      console.log('DEBUG: Stats data sample:', data.slice(0, 3));
      setStats(data);
      
      const timeData = await fetchTimeStats(token);
      console.log('DEBUG: Time stats data received:', timeData);
      setTimeStats(timeData);
    } catch (error) {
      console.error('İstatistik yükleme hatası:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDersName = (dersId) => {
    return DERS_ISIMLERI[dersId] || `Ders ${dersId}`;
  };

  const getKonuName = (dersId, konuId) => {
    return KONU_ISIMLERI[dersId]?.[konuId] || `Konu ${konuId}`;
  };

  const getZorlukText = (zorluk) => {
    const zorlukMap = {
      1: 'Kolay',
      2: 'Orta',
      3: 'Zor',
      4: 'Çok Zor',
      5: 'Uzman'
    };
    return zorlukMap[zorluk] || 'Bilinmiyor';
  };

  const getProgressColor = (accuracy) => {
    if (accuracy >= 80) return 'success';
    if (accuracy >= 60) return 'warning';
    return 'danger';
  };

  const toggleSubjectExpansion = (dersId) => {
    const newExpanded = new Set(expandedSubjects);
    if (newExpanded.has(dersId)) {
      newExpanded.delete(dersId);
    } else {
      newExpanded.add(dersId);
    }
    setExpandedSubjects(newExpanded);
  };

  const getSubjectTopics = (dersId) => {
 
    const konuStats = stats.filter(stat => stat.ders_id === dersId && stat.konu_id > 0);
    console.log(`DEBUG: getSubjectTopics for ders ${dersId}:`, konuStats.length, 'konu stats');
    return konuStats;
  };

  const getFilteredStats = (subject) => {
    let filtered = stats;
    
    if (subject !== 'all') {
      filtered = filtered.filter(stat => stat.ders_id === parseInt(subject));
    }


    const now = new Date();
    const filterDate = new Date();
    
    switch (timeFilter) {
      case 'week':
        filterDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        filterDate.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        filterDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        return filtered;
    }

    return filtered.filter(stat => {
      if (!stat.answered_at) return true;
      try {
        const statDate = new Date(stat.answered_at);
        const turkeyStatDate = new Date(statDate.getTime() + (3 * 60 * 60 * 1000));
        return turkeyStatDate >= filterDate;
      } catch (error) {
        return true;
      }
    });
  };

  const getTimeFilterTitle = () => {
    const titles = {
      all: 'Tüm Zamanlar',
      week: 'Son 1 Hafta',
      month: 'Son 1 Ay',
      year: 'Son 1 Yıl'
    };
    return titles[timeFilter] || 'Tüm Zamanlar';
  };

  const prepareChartData = () => {
    const filteredStats = getFilteredStats(selectedSubject);
    
    const konuStats = filteredStats.filter(stat => stat.konu_id > 0);
    
    const subjectStats = {};
    konuStats.forEach(stat => {
      const dersName = getDersName(stat.ders_id);
      if (!subjectStats[dersName]) {
        subjectStats[dersName] = { total: 0, correct: 0 };
      }
      subjectStats[dersName].total += stat.total || 1;
      subjectStats[dersName].correct += stat.correct || (stat.is_correct ? 1 : 0);
    });

    const labels = Object.keys(subjectStats);
    const data = labels.map(ders => {
      const stats = subjectStats[ders];
      return stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
    });

    return {
      labels,
      datasets: [{
        label: 'Başarı Oranı (%)',
        data,
        backgroundColor: [
          'rgba(255, 99, 132, 0.8)',
          'rgba(54, 162, 235, 0.8)',
          'rgba(255, 206, 86, 0.8)',
          'rgba(75, 192, 192, 0.8)',
          'rgba(153, 102, 255, 0.8)',
          'rgba(255, 159, 64, 0.8)'
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)'
        ],
        borderWidth: 2
      }]
    };
  };

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      localStorage.removeItem('token');
    }
    navigate('/');
  };

  const chartData = prepareChartData();

  const prepareTimeChartData = () => {
    const labels = timeStats.map(stat => getDersName(stat.ders_id));
    const data = timeStats.map(stat => stat.total_minutes);

    return {
      labels,
      datasets: [{
        label: 'Toplam Süre (Dakika)',
        data,
        backgroundColor: [
          'rgba(255, 99, 132, 0.8)',
          'rgba(54, 162, 235, 0.8)',
          'rgba(255, 206, 86, 0.8)',
          'rgba(75, 192, 192, 0.8)',
          'rgba(153, 102, 255, 0.8)',
          'rgba(255, 159, 64, 0.8)'
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)'
        ],
        borderWidth: 2
      }]
    };
  };

  const timeChartData = prepareTimeChartData();

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
                  <a className="nav-link active" aria-current="page" href="#">
                    <i className="bi-graph-up me-2"></i>
                    İstatistikler
                  </a>
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
              <h1 className="h2 mb-0">İstatistikler</h1>
              <small className="text-muted">Performansınızı analiz edin ve gelişim alanlarınızı keşfedin</small>
            </div>

            {/* Filters */}
            <div className="row mb-4">
              <div className="col-lg-6">
                <div className="custom-block bg-white">
                  <h5 className="mb-3">Filtreler</h5>
                  <div className="row">
                    <div className="col-6">
                      <label className="form-label">Zaman Aralığı</label>
                      <select 
                        className="form-control" 
                        value={timeFilter} 
                        onChange={(e) => setTimeFilter(e.target.value)}
                      >
                        <option value="all">Tüm Zamanlar</option>
                        <option value="week">Son 1 Hafta</option>
                        <option value="month">Son 1 Ay</option>
                        <option value="year">Son 1 Yıl</option>
                      </select>
                    </div>
                    <div className="col-6">
                      <label className="form-label">Ders</label>
                      <select 
                        className="form-control" 
                        value={selectedSubject} 
                        onChange={(e) => setSelectedSubject(e.target.value)}
                      >
                        <option value="all">Tüm Dersler</option>
                        {Object.entries(DERS_ISIMLERI).map(([id, name]) => (
                          <option key={id} value={id}>{name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-lg-6">
                <div className="custom-block bg-white">
                  <h5 className="mb-3">Genel Özet</h5>
                  <div className="row text-center">
                    <div className="col-4">
                      <div className="custom-block-numbers">
                        <span className="h3 text-primary">
                          {(() => {
                            const filtered = getFilteredStats(selectedSubject);
                            const konuStats = filtered.filter(stat => stat.konu_id > 0);
                            return konuStats.reduce((sum, stat) => sum + (stat.total || 1), 0);
                          })()}
                        </span>
                      </div>
                      <small>Toplam Soru</small>
                    </div>
                    <div className="col-4">
                      <div className="custom-block-numbers">
                        <span className="h3 text-success">
                          {(() => {
                            const filtered = getFilteredStats(selectedSubject);
                            const konuStats = filtered.filter(stat => stat.konu_id > 0);
                            const total = konuStats.reduce((sum, stat) => sum + (stat.total || 1), 0);
                            const correct = konuStats.reduce((sum, stat) => sum + (stat.correct || 0), 0);
                            return total > 0 ? Math.round((correct / total) * 100) : 0;
                          })()}%
                        </span>
                      </div>
                      <small>Başarı Oranı</small>
                    </div>
                    <div className="col-4">
                      <div className="custom-block-numbers">
                        <span className="h3 text-info">
                          {(() => {
                            const filtered = getFilteredStats(selectedSubject);
                            const konuStats = filtered.filter(stat => stat.konu_id > 0);
                            const uniqueSubjects = new Set(konuStats.map(s => s.ders_id)).size;
                            return uniqueSubjects;
                          })()}
                        </span>
                      </div>
                      <small>Aktif Ders</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Charts */}
            <div className="row mb-4">
              <div className="col-lg-6">
                <div className="custom-block bg-white">
                  <h5 className="mb-4">Ders Bazlı Başarı Oranları</h5>
                  <div style={{ height: '400px' }}>
                    <Bar 
                      data={chartData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            display: false
                          }
                        },
                        scales: {
                          y: {
                            beginAtZero: true,
                            max: 100,
                            ticks: {
                              callback: function(value) {
                                return value + '%';
                              }
                            }
                          }
                        }
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="col-lg-6">
                <div className="custom-block bg-white">
                  <h5 className="mb-4">Ders Bazlı Harcanan Süre</h5>
                  <div style={{ height: '400px' }}>
                    <Bar 
                      data={timeChartData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            display: false
                          }
                        },
                        scales: {
                          y: {
                            beginAtZero: true,
                            ticks: {
                              callback: function(value) {
                                return value + ' dk';
                              }
                            }
                          }
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Detailed Statistics */}
            <div className="row">
              <div className="col-12">
                <div className="custom-block bg-white">
                  <h5 className="mb-4">Detaylı İstatistikler</h5>
                  
                  {loading ? (
                    <div className="text-center py-4">
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Yükleniyor...</span>
                      </div>
                    </div>
                  ) : (
                    <div className="accordion" id="statsAccordion">
                      {Object.entries(DERS_ISIMLERI).map(([dersId, dersName]) => {
                        const subjectStats = getSubjectTopics(parseInt(dersId));
                        const isExpanded = expandedSubjects.has(parseInt(dersId));
                        
                        if (subjectStats.length === 0) return null;

                        const totalQuestions = subjectStats.reduce((sum, stat) => sum + (stat.total || 1), 0);
                        const correctAnswers = subjectStats.reduce((sum, stat) => sum + (stat.correct || 0), 0);
                        const accuracy = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;

                        return (
                          <div key={dersId} className="accordion-item">
                            <h2 className="accordion-header">
                              <button 
                                className={`accordion-button ${!isExpanded ? 'collapsed' : ''}`}
                                type="button"
                                onClick={() => toggleSubjectExpansion(parseInt(dersId))}
                              >
                                <div className="d-flex justify-content-between align-items-center w-100 me-3">
                                  <span>
                                    <i className={`bi-${dersId === '1' ? 'calculator' : dersId === '2' ? 'lightning' : dersId === '3' ? 'flask' : dersId === '4' ? 'heart-pulse' : dersId === '5' ? 'book' : 'clock-history'} me-2`}></i>
                                    {dersName}
                                  </span>
                                  <div className="d-flex align-items-center">
                                    <span className="badge bg-primary me-2">{totalQuestions} soru</span>
                                    <span className={`badge bg-${getProgressColor(accuracy)}`}>{accuracy}%</span>
                                  </div>
                                </div>
                              </button>
                            </h2>
                            
                            {isExpanded && (
                              <div className="accordion-collapse collapse show">
                                <div className="accordion-body">
                                  <div className="table-responsive">
                                    <table className="table table-hover">
                                      <thead>
                                        <tr>
                                          <th>Konu</th>
                                          <th>Zorluk</th>
                                          <th>Toplam</th>
                                          <th>Doğru</th>
                                          <th>Başarı</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {subjectStats.map((stat, index) => {
                                          const konuName = getKonuName(stat.ders_id, stat.konu_id);
                                          const total = stat.total || 1;
                                          const correct = stat.correct || 0;
                                          const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
                                          
                                          return (
                                            <tr key={index}>
                                              <td>{konuName}</td>
                                              <td>
                                                <span className={`badge bg-${stat.zorluk <= 2 ? 'success' : stat.zorluk <= 3 ? 'warning' : 'danger'}`}>
                                                  {getZorlukText(stat.zorluk)}
                                                </span>
                                              </td>
                                              <td>{total}</td>
                                              <td>
                                                <span className="text-success">{correct}</span>
                                              </td>
                                              <td>
                                                <div className="progress" style={{ height: '20px' }}>
                                                  <div 
                                                    className={`progress-bar bg-${accuracy >= 80 ? 'success' : accuracy >= 60 ? 'warning' : 'danger'}`}
                                                    style={{ width: `${accuracy}%` }}
                                                  ></div>
                                                </div>
                                                <small className="text-muted">{accuracy}%</small>
                                              </td>
                                            </tr>
                                          );
                                        })}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
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
