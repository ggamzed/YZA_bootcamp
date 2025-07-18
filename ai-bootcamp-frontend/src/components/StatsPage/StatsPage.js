// src/components/StatsPage/StatsPage.js
import React, { useEffect, useState } from 'react';
import { fetchStats } from '../../api/statistics';
import './StatsPage.css';

// Ders adları
const DERS_ISIMLERI = {
  1: 'Matematik',
  2: 'Fizik',
  3: 'Biyoloji',
  4: 'Tarih',
  5: 'Türkçe',
  6: 'Kimya'
};

// Konu (topic) adları (örnek olarak matematik için)
const KONU_ISIMLERI = {
  1: 'Basit Eşitsizlikler',
  2: 'Fonksiyonlar',
  3: 'Olasılık'
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

  // Sayısal ID’leri isimlere çevir
  const mappedData = data.map(row => {
    const dersName = DERS_ISIMLERI[row.ders_id] || `#${row.ders_id}`;
    const konuName = KONU_ISIMLERI[row.konu_id] || `#${row.konu_id}`;
    const altName  = ALT_BASLIK_ISIMLERI[row.konu_id]?.[row.altbaslik_id]
                     || `#${row.altbaslik_id}`;
    return {
      ...row,
      dersName,
      konuName,
      altbaslikName: altName
    };
  });

  return (
    <div className="stats-container">
      <h2>Ders ⇢ Konu ⇢ Alt Başlık Bazlı Başarı</h2>
      <table className="stats-table">
        <thead>
          <tr>
            <th>Ders</th>
            <th>Konu</th>
            <th>Alt Başlık</th>
            <th>Doğru</th>
            <th>Toplam</th>
            <th>Başarı %</th>
          </tr>
        </thead>
        <tbody>
          {mappedData.map((row, i) => (
            <tr key={i}>
              <td>{row.dersName}</td>
              <td>{row.konuName}</td>
              <td>{row.altbaslikName}</td>
              <td>{row.correct}</td>
              <td>{row.total}</td>
              <td>{row.accuracy}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
