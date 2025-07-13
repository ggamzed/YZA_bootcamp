import React, { useEffect, useState } from 'react';
import { fetchStats } from '../../api/statistics';
import './StatsPage.css';

export default function Statistics({ token }) {
  const [data, setData] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const stats = await fetchStats(token);
        setData(stats);
      } catch (err) {
        console.error('İstatistik verisi alınamadı:', err);
      }
    })();
  }, [token]);

  if (data.length === 0) return <p>Yükleniyor...</p>;

  return (
    <div className="stats-container">
      <h2>Ders & Konu Bazlı Başarı İstatistikleri</h2>
      <table className="stats-table">
        <thead>
          <tr>
            <th>Ders ID</th>
            <th>Konu ID</th>
            <th>Doğru Sayısı</th>
            <th>Toplam</th>
            <th>Başarı %</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i}>
              <td>{row.ders_id}</td>
              <td>{row.konu_id}</td>
              <td>{row.correct}</td>
              <td>{row.total}</td>
              <td>{row.accuracy.toFixed(1)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
