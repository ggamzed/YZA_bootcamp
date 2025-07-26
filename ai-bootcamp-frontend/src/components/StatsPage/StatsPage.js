// src/components/StatsPage/StatsPage.js
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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

// Chart.js bileşenlerini kaydet
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

// Ders adları
const DERS_ISIMLERI = {
  1: 'Matematik',
  2: 'Fizik',
  3: 'Kimya',
  4: 'Biyoloji',
  5: 'Türkçe',
  6: 'Tarih'
};

// Konu (topic) adları - ders bazlı
const KONU_ISIMLERI = {
  // Matematik (ders_id: 1)
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
  // Fizik (ders_id: 2)
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
  // Kimya (ders_id: 3)
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
  // Biyoloji (ders_id: 4)
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
  // Türkçe (ders_id: 5)
  5: {
    1: 'Dil Bilgisi',
    2: 'Anlatım Bozuklukları',
    3: 'Paragraf',
    4: 'Cümle Yapısı',
    5: 'Sözcük Türleri',
    6: 'Yazım Kuralları',
    7: 'Noktalama',
    8: 'Ses Bilgisi',
    9: 'Şekil Bilgisi',
    10: 'Cümle Bilgisi'
  },
  // Tarih (ders_id: 6)
  6: {
    1: 'İlk Çağ Uygarlıkları',
    2: 'Orta Çağ Tarihi',
    3: 'Yeni Çağ Tarihi',
    4: 'Yakın Çağ Tarihi',
    5: 'Osmanlı Tarihi',
    6: 'Türkiye Cumhuriyeti',
    7: 'İnkılap Tarihi',
    8: 'Çağdaş Türk Tarihi',
    9: 'Dünya Tarihi',
    10: 'Türk Kültür Tarihi'
  }
};

// Alt başlık (subtopic) adları: konu_id → (altbaslik_id → isim)
const ALT_BASLIK_ISIMLERI = {
  1: { // Basit Eşitsizlikler
    1: 'Birinci Dereceden Bir Bilinmeyenli Eşitsizlikler',
    2: 'Eşitsizlik Sistemleri',
    3: 'Mutlak Değerli Eşitsizlikler',
    4: 'İkinci Dereceden Eşitsizlikler ve İşaret Tablosu'
  },
  2: { // Fonksiyonlar
    1: 'Fonksiyon Kavramı ve Gösterimi',
    2: 'Fonksiyon Çeşitleri (Birebir, Örten, Birim, Sabit, Tek/Çift vb.)',
    3: 'Fonksiyonlarda Dört İşlem ve Bileşke Fonksiyon',
    4: 'Bir Fonksiyonun Tersi',
    5: 'Fonksiyon Grafiklerine Yorumlama'
  },
  3: { // Olasılık
    1: 'Sayma Kuralları (Permütasyon, Kombinasyon, Binom)',
    2: 'Basit Olayların Olasılığı',
    3: 'Koşullu Olasılık',
    4: 'Bağımlı ve Bağımsız Olaylar'
  }
};

export default function Statistics({ token }) {
  const navigate = useNavigate();
  const [subjectStats, setSubjectStats] = useState([]);
  const [detailedStats, setDetailedStats] = useState([]);
  const [topicStats, setTopicStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [timeFilter, setTimeFilter] = useState('week'); // 'week', 'month', 'all'
  const [expandedSubjects, setExpandedSubjects] = useState(new Set());

  useEffect(() => {
    fetchAllStats();
  }, [token, timeFilter]);

  const fetchAllStats = async () => {
      try {
      setLoading(true);
      
      // Ders bazlı istatistikler
      const subjectResponse = await fetch('/stats/subject-stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      // Detaylı istatistikler
      const detailedResponse = await fetch('/stats/summary', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      // Konu bazlı istatistikler (zaman filtresine göre)
      const topicResponse = await fetch(`/stats/topic-stats?time_filter=${timeFilter}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (subjectResponse.ok && detailedResponse.ok && topicResponse.ok) {
        const subjectData = await subjectResponse.json();
        const detailedData = await detailedResponse.json();
        const topicData = await topicResponse.json();
        
        setSubjectStats(subjectData);
        setDetailedStats(detailedData);
        setTopicStats(topicData);
      }
    } catch (error) {
      console.error('İstatistik verisi alınamadı:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDersName = (dersId) => {
    return DERS_ISIMLERI[dersId] || `Ders ${dersId}`;
  };

  const getKonuName = (dersId, konuId) => {
    return KONU_ISIMLERI[dersId] && KONU_ISIMLERI[dersId][konuId] || `Konu ${konuId}`;
  };

  const getZorlukText = (zorluk) => {
    switch (zorluk) {
      case 1: return 'Kolay';
      case 2: return 'Orta';
      case 3: return 'Zor';
      default: return `Seviye ${zorluk}`;
    }
  };

  const getProgressColor = (accuracy) => {
    if (accuracy >= 80) return '#4caf50';
    if (accuracy >= 60) return '#ff9800';
    return '#f44336';
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
    return topicStats.filter(stat => stat.ders_id === dersId);
  };

  // Zaman filtresine göre veri getir
  const getFilteredStats = (subject) => {
    switch (timeFilter) {
      case 'week':
        return {
          correct: subject.week_correct,
          total: subject.week_total,
          incorrect: subject.week_total - subject.week_correct,
          accuracy: subject.week_accuracy,
          time: subject.week_time
        };
      case 'month':
        return {
          correct: subject.month_correct,
          total: subject.month_total,
          incorrect: subject.month_total - subject.month_correct,
          accuracy: subject.month_accuracy,
          time: subject.month_time || '0s 0dk' // Eğer yoksa varsayılan değer
        };
      case 'all':
        return {
          correct: subject.total_correct,
          total: subject.total_questions,
          incorrect: subject.total_questions - subject.total_correct,
          accuracy: subject.overall_accuracy,
          time: subject.total_time
        };
      default:
        return {
          correct: subject.week_correct,
          total: subject.week_total,
          incorrect: subject.week_total - subject.week_correct,
          accuracy: subject.week_accuracy,
          time: subject.week_time
        };
    }
  };

  const getTimeFilterTitle = () => {
    switch (timeFilter) {
      case 'week': return 'Bu Hafta';
      case 'month': return 'Bu Ay';
      case 'all': return 'Tüm Zamanlar';
      default: return 'Bu Hafta';
    }
  };

  // Grafik verilerini hazırla
  const prepareChartData = () => {
    if (subjectStats.length === 0) return null;

    // Ders bazlı başarı oranları
    const subjectAccuracyData = {
      labels: subjectStats.map(subject => getDersName(subject.ders_id)),
      datasets: [
        {
          label: 'Genel Başarı (%)',
          data: subjectStats.map(subject => subject.overall_accuracy),
          backgroundColor: subjectStats.map(subject => getProgressColor(subject.overall_accuracy)),
          borderColor: subjectStats.map(subject => getProgressColor(subject.overall_accuracy)),
          borderWidth: 2,
        }
      ]
    };

    // Haftalık vs Aylık başarı karşılaştırması
    const weeklyMonthlyData = {
      labels: subjectStats.map(subject => getDersName(subject.ders_id)),
      datasets: [
        {
          label: 'Bu Hafta (%)',
          data: subjectStats.map(subject => subject.week_accuracy),
          backgroundColor: 'rgba(54, 162, 235, 0.8)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 2,
        },
        {
          label: 'Bu Ay (%)',
          data: subjectStats.map(subject => subject.month_accuracy),
          backgroundColor: 'rgba(255, 99, 132, 0.8)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 2,
        },
        {
          label: 'Tüm Zamanlar (%)',
          data: subjectStats.map(subject => subject.overall_accuracy),
          backgroundColor: 'rgba(75, 192, 192, 0.8)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 2,
        }
      ]
    };

    // Toplam soru sayıları
    const totalQuestionsData = {
      labels: subjectStats.map(subject => getDersName(subject.ders_id)),
      datasets: [
        {
          label: 'Toplam Soru',
          data: subjectStats.map(subject => subject.total_questions),
          backgroundColor: 'rgba(75, 192, 192, 0.8)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 2,
        }
      ]
    };

    // Harcanan süre dağılımı (dakika cinsinden)
    const timeSpentData = {
      labels: subjectStats.map(subject => getDersName(subject.ders_id)),
      datasets: [
        {
          label: 'Bu Hafta (Dakika)',
          data: subjectStats.map(subject => {
            // Haftalık süreyi dakika cinsinden hesapla
            return subject.week_total * 2;
          }),
          backgroundColor: 'rgba(54, 162, 235, 0.8)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 2,
        },
        {
          label: 'Bu Ay (Dakika)',
          data: subjectStats.map(subject => {
            // Aylık süreyi dakika cinsinden hesapla
            return subject.month_total * 2;
          }),
          backgroundColor: 'rgba(255, 99, 132, 0.8)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 2,
        },
        {
          label: 'Tüm Zamanlar (Dakika)',
          data: subjectStats.map(subject => {
            // Tüm zamanlar süreyi dakika cinsinden hesapla
            return subject.total_questions * 2;
          }),
          backgroundColor: 'rgba(75, 192, 192, 0.8)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 2,
        }
      ]
    };

    // Konu bazlı başarı oranları (en iyi 10 konu)
    const topTopics = detailedStats
      .sort((a, b) => b.accuracy - a.accuracy)
      .slice(0, 10);

    const topicAccuracyData = {
      labels: topTopics.map(topic => getKonuName(topic.ders_id, topic.konu_id)),
      datasets: [
        {
          label: 'Başarı Oranı (%)',
          data: topTopics.map(topic => topic.accuracy),
          backgroundColor: topTopics.map(topic => getProgressColor(topic.accuracy)),
          borderColor: topTopics.map(topic => getProgressColor(topic.accuracy)),
          borderWidth: 2,
        }
      ]
    };

    return {
      subjectAccuracy: subjectAccuracyData,
      weeklyMonthly: weeklyMonthlyData,
      totalQuestions: totalQuestionsData,
      timeSpent: timeSpentData,
      topicAccuracy: topicAccuracyData
    };
  };

  const chartData = prepareChartData();

  if (loading) {
    return (
      <div className="stats-container">
        <div className="loading">Yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="stats-container">
      <div className="stats-header">
        <h1>📊 İstatistiklerim</h1>
        <button 
          className="back-button"
          onClick={() => navigate('/home')}
        >
          ← Anasayfaya Dön
        </button>
      </div>

      <div className="stats-tabs">
        <button 
          className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          📈 Genel Bakış
        </button>
        <button 
          className={`tab-button ${activeTab === 'detailed' ? 'active' : ''}`}
          onClick={() => setActiveTab('detailed')}
        >
          📋 Detaylı İstatistikler
        </button>
      </div>

      {activeTab === 'overview' && (
        <div className="overview-section">
          <div className="overview-header">
            <h2>{getTimeFilterTitle()} Ders Bazlı Performans</h2>
            <div className="time-filters">
              <button 
                className={`time-filter-button ${timeFilter === 'week' ? 'active' : ''}`}
                onClick={() => setTimeFilter('week')}
              >
                📅 Bu Hafta
              </button>
              <button 
                className={`time-filter-button ${timeFilter === 'month' ? 'active' : ''}`}
                onClick={() => setTimeFilter('month')}
              >
                📆 Bu Ay
              </button>
              <button 
                className={`time-filter-button ${timeFilter === 'all' ? 'active' : ''}`}
                onClick={() => setTimeFilter('all')}
              >
                📊 Tüm Zamanlar
              </button>
            </div>
          </div>
          
          {subjectStats.length === 0 ? (
            <div className="no-data">
              <p>Henüz test çözülmemiş. Test çözmeye başlayarak istatistiklerinizi görebilirsiniz.</p>
              <button 
                className="start-test-button"
                onClick={() => navigate('/home')}
              >
                Test Başlat
              </button>
            </div>
          ) : (
            <div className="subject-cards">
              {subjectStats
                .filter(subject => {
                  const filteredStats = getFilteredStats(subject);
                  return filteredStats.total > 0; // Sadece soru çözülmüş dersleri göster
                })
                .map((subject, index) => {
                  const subjectTopics = getSubjectTopics(subject.ders_id);
                  const isExpanded = expandedSubjects.has(subject.ders_id);
                  const filteredStats = getFilteredStats(subject);
                  
                  return (
                    <div key={index} className="subject-card">
                      <div className="subject-header">
                        <h3>{getDersName(subject.ders_id)}</h3>
                        <div className="header-right">
                          <div className="accuracy-badge" style={{ backgroundColor: getProgressColor(filteredStats.accuracy) }}>
                            {filteredStats.accuracy}%
                          </div>
                        </div>
                      </div>
                      
                      <div className="subject-stats">
                        <div className="stat-row">
                          <span className="stat-label">Toplam çözülen soru:</span>
                          <span className="stat-value">{filteredStats.total}</span>
                        </div>
                        
                        <div className="stat-row">
                          <span className="stat-label">Doğru çözülen soru:</span>
                          <span className="stat-value correct-answer">{filteredStats.correct}</span>
                        </div>
                        
                        <div className="stat-row">
                          <span className="stat-label">Yanlış çözülen soru:</span>
                          <span className="stat-value incorrect-answer">{filteredStats.incorrect}</span>
                        </div>
                        
                        <div className="stat-row">
                          <span className="stat-label">Harcanan süre:</span>
                          <span className="stat-value">{filteredStats.time}</span>
                        </div>
                      </div>

                      <div className="activity-dates">
                        <p><strong>İlk Test:</strong> {subject.first_answer_date}</p>
                        <p><strong>Son Test:</strong> {subject.last_answer_date}</p>
                      </div>

                      <div className="card-footer">
                        <button 
                          className="topic-stats-button"
                          onClick={() => toggleSubjectExpansion(subject.ders_id)}
                        >
                          📚 Konu Bazlı İstatistikler
                        </button>
                      </div>

                      {/* Konu Bazlı Detaylar - Butonun altında */}
                      {isExpanded && subjectTopics.length > 0 && (
                        <div className="topic-breakdown">
                          <h4>📚 Konu Bazlı Performans:</h4>
                          <div className="topic-list">
                            {subjectTopics.map((topic, topicIndex) => (
                              <div key={topicIndex} className="topic-item">
                                <div className="topic-header">
                                  <span className="topic-name">{getKonuName(topic.ders_id, topic.konu_id)}</span>
                                  <span 
                                    className="topic-accuracy" 
                                    style={{ color: getProgressColor(topic.accuracy) }}
                                  >
                                    {topic.accuracy}%
                                  </span>
                                </div>
                                <div className="topic-stats">
                                  <span className="topic-detail">
                                    {topic.correct} doğru / {topic.total} soru
                                  </span>
                                  <div className="topic-progress">
                                    <div 
                                      className="topic-progress-fill"
                                      style={{ 
                                        width: `${topic.accuracy}%`,
                                        backgroundColor: getProgressColor(topic.accuracy)
                                      }}
                                    ></div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'detailed' && (
        <div className="detailed-section">
          <h2>📊 Grafiksel İstatistikler</h2>
          
          {!chartData ? (
            <div className="no-data">
              <p>Henüz detaylı istatistik verisi bulunmuyor.</p>
            </div>
          ) : (
            <div className="charts-grid">
              {/* Ders Bazlı Başarı Oranları */}
              <div className="chart-card">
                <h3>📈 Ders Bazlı Genel Başarı Oranları</h3>
                <div className="chart-container">
                  <Bar 
                    data={chartData.subjectAccuracy}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          display: false
                        },
                        title: {
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

              {/* Haftalık, Aylık ve Tüm Zamanlar Karşılaştırması */}
              <div className="chart-card">
                <h3>📊 Haftalık, Aylık ve Tüm Zamanlar Başarı Karşılaştırması</h3>
                <div className="chart-container">
                  <Bar 
                    data={chartData.weeklyMonthly}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'top'
                        },
                        title: {
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

              {/* Toplam Soru Sayıları */}
              <div className="chart-card">
                <h3>📚 Ders Bazlı Toplam Soru Sayıları</h3>
                <div className="chart-container">
                  <Bar 
                    data={chartData.totalQuestions}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          display: false
                        },
                        title: {
                          display: false
                        }
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          ticks: {
                            stepSize: 1
                          }
                        }
                      }
                    }}
                  />
                </div>
              </div>

              {/* Harcanan Süre Dağılımı */}
              <div className="chart-card">
                <h3>⏱️ Haftalık, Aylık ve Tüm Zamanlar Harcanan Süre</h3>
                <div className="chart-container">
                  <Bar 
                    data={chartData.timeSpent}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'top'
                        },
                        title: {
                          display: false
                        }
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          max: Math.max(...chartData.timeSpent.datasets.flatMap(dataset => dataset.data)) + 100,
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

              {/* En İyi 10 Konu */}
              <div className="chart-card full-width">
                <h3>🏆 En İyi 10 Konu (Başarı Oranına Göre)</h3>
                <div className="chart-container">
                  <Bar 
                    data={chartData.topicAccuracy}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      indexAxis: 'y',
                      plugins: {
                        legend: {
                          display: false
                        },
                        title: {
                          display: false
                        }
                      },
                      scales: {
                        x: {
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
          )}
        </div>
      )}
    </div>
  );
}
