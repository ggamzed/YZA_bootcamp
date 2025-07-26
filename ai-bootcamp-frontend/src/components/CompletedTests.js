import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './CompletedTests.css';

export default function CompletedTests({ token }) {
  const navigate = useNavigate();
  const [completedTests, setCompletedTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTest, setSelectedTest] = useState(null);
  const [showReport, setShowReport] = useState(false);

  const dersler = [
    { id: 1, name: 'Matematik' },
    { id: 2, name: 'Fizik' },
    { id: 3, name: 'Kimya' },
    { id: 4, name: 'Biyoloji' },
    { id: 5, name: 'Türkçe' },
    { id: 6, name: 'Tarih' },
  ];

  useEffect(() => {
    fetchCompletedTests();
  }, []);

  const fetchCompletedTests = async () => {
    try {
      const response = await fetch('/stats/completed-tests', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setCompletedTests(data);
      } else {
        console.error('Test verileri alınamadı');
      }
    } catch (error) {
      console.error('Hata:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTestClick = (test) => {
    setSelectedTest(test);
    setShowReport(true);
  };

  const handleCloseReport = () => {
    setShowReport(false);
    setSelectedTest(null);
  };

  const getDersName = (dersId) => {
    return dersler.find(d => d.id === dersId)?.name || 'Bilinmeyen Ders';
  };

  const getZorlukText = (zorluk) => {
    switch (zorluk) {
      case 1: return 'Kolay';
      case 2: return 'Orta';
      case 3: return 'Zor';
      default: return `Seviye ${zorluk}`;
    }
  };

  const formatDate = (dateString) => {
    // Backend'den gelen tarih zaten Türkiye formatında (dd.mm.yyyy hh:mm)
    // Sadece daha okunabilir hale getirelim
    const [date, time] = dateString.split(' ');
    const [day, month, year] = date.split('.');
    const [hour, minute] = time.split(':');
    
    const months = [
      'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
      'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
    ];
    
    return `${day} ${months[parseInt(month) - 1]} ${year} - ${hour}:${minute}`;
  };

  if (loading) {
    return (
      <div className="completed-tests-container">
        <div className="loading">Yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="completed-tests-container">
      <div className="completed-tests-header">
        <h1>Çözülen Testler</h1>
        <button 
          className="back-button"
          onClick={() => navigate('/home')}
        >
          ← Anasayfaya Dön
        </button>
      </div>

      {completedTests.length === 0 ? (
        <div className="no-tests">
          <h3>Henüz test çözülmemiş</h3>
          <p>Test çözmeye başlamak için anasayfaya dönün ve bir test başlatın.</p>
          <button 
            className="start-test-button"
            onClick={() => navigate('/home')}
          >
            Test Başlat
          </button>
        </div>
      ) : (
        <div className="tests-grid">
          {completedTests.map((test, index) => (
            <div 
              key={index} 
              className="test-card"
              onClick={() => handleTestClick(test)}
            >
              <div className="test-header">
                <h3>{getDersName(test.ders_id)}</h3>
                <span className="test-date">{formatDate(test.test_date)}</span>
              </div>
              
              <div className="test-stats">
                <div className="stat-item">
                  <span className="stat-label">Toplam Soru:</span>
                  <span className="stat-value">{test.total_questions}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Doğru:</span>
                  <span className="stat-value correct">{test.correct_answers}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Yanlış:</span>
                  <span className="stat-value incorrect">{test.incorrect_answers}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Başarı:</span>
                  <span className="stat-value accuracy">{test.accuracy}%</span>
                </div>
              </div>
              
              <div className="test-footer">
                <span className="view-report">Raporu Görüntüle →</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Test Raporu Modal */}
      {showReport && selectedTest && (
        <div className="report-modal-overlay">
          <div className="report-modal">
            <div className="report-header">
              <h2>Test Raporu</h2>
              <button className="close-button" onClick={handleCloseReport}>×</button>
            </div>
            
            <div className="report-content">
              <div className="report-summary">
                <h3>{getDersName(selectedTest.ders_id)} - {formatDate(selectedTest.test_date)}</h3>
                <div className="summary-stats">
                  <div className="summary-item">
                    <span className="summary-label">Genel Başarı:</span>
                    <span className="summary-value">
                      {selectedTest.correct_answers} doğru / {selectedTest.incorrect_answers} yanlış 
                      ({selectedTest.accuracy}%)
                    </span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Toplam Soru:</span>
                    <span className="summary-value">{selectedTest.total_questions}</span>
                  </div>
                </div>
              </div>

              {selectedTest.konu_bazli.length > 0 && (
                <div className="report-section">
                  <h4>Konu Bazlı Performans</h4>
                  <table className="report-table">
                    <thead>
                      <tr>
                        <th>Konu ID</th>
                        <th>Toplam</th>
                        <th>Doğru</th>
                        <th>Başarı %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedTest.konu_bazli.map((konu, i) => (
                        <tr key={i}>
                          <td>{konu.konu_id}</td>
                          <td>{konu.total}</td>
                          <td>{konu.correct}</td>
                          <td>{konu.accuracy}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {selectedTest.zorluk_bazli.length > 0 && (
                <div className="report-section">
                  <h4>Zorluk Seviyesi Bazında</h4>
                  <table className="report-table">
                    <thead>
                      <tr>
                        <th>Zorluk</th>
                        <th>Toplam</th>
                        <th>Doğru</th>
                        <th>Başarı %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedTest.zorluk_bazli.map((zorluk, i) => (
                        <tr key={i}>
                          <td>{getZorlukText(zorluk.zorluk)}</td>
                          <td>{zorluk.total}</td>
                          <td>{zorluk.correct}</td>
                          <td>{zorluk.accuracy}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="report-analysis">
                <h4>Analiz & Gelişim Önerileri</h4>
                <div className="analysis-content">
                  {selectedTest.accuracy >= 80 ? (
                    <p className="positive-feedback">
                      🎉 Mükemmel performans! Bu testte çok başarılı oldun. 
                      Bu seviyeyi korumaya devam et.
                    </p>
                  ) : selectedTest.accuracy >= 60 ? (
                    <p className="good-feedback">
                      👍 İyi bir performans gösterdin. Yanlış yaptığın konularda 
                      biraz daha pratik yaparak başarı oranını artırabilirsin.
                    </p>
                  ) : (
                    <p className="improvement-feedback">
                      📚 Bu testte zorlandığın görülüyor. Yanlış yaptığın konularda 
                      temel kavramları tekrar etmeni ve daha fazla pratik yapmanı öneririz.
                    </p>
                  )}
                  
                  <ul className="suggestions">
                    <li>Yanlış yaptığın konularda ek testler çöz</li>
                    <li>Temel kavramları tekrar gözden geçir</li>
                    <li>Zaman yönetimi için pratik yap</li>
                    <li>Düzenli olarak test çözmeye devam et</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="report-footer">
              <button className="close-report-button" onClick={handleCloseReport}>
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 