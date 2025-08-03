import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function TestReport() {
  const toplamSoru = 30;
  const dogru = 18;
  const yanlis = 9;
  const bos = 3;
  const ortSure = 75;
  const konuBazli = [
    { konu: 'Temel Kavramlar', toplam: 5, dogru: 4, yanlis: 1, bos: 0 },
    { konu: 'Problemler', toplam: 10, dogru: 5, yanlis: 5, bos: 0 },
    { konu: 'Üslü Sayılar', toplam: 5, dogru: 2, yanlis: 3, bos: 0 },
    { konu: 'Sayı Basamakları', toplam: 5, dogru: 4, yanlis: 0, bos: 1 },
    { konu: 'Bölme-Bölünebilme', toplam: 5, dogru: 3, yanlis: 1, bos: 1 },
  ];
  const zorlukBazli = [
    { seviye: 'Kolay', toplam: 10, dogru: 9, yanlis: 1, bos: 0 },
    { seviye: 'Orta', toplam: 15, dogru: 7, yanlis: 6, bos: 2 },
    { seviye: 'Zor', toplam: 5, dogru: 2, yanlis: 2, bos: 1 },
  ];

  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div className="stats-container" style={{maxWidth: 700, margin: '0 auto', padding: '2rem 1rem'}}>
      <h2>Test Raporun</h2>
      <div style={{marginBottom: '2rem'}}>
        <b>Genel Başarı:</b> {dogru} doğru / {yanlis} yanlış / {bos} boş ({Math.round((dogru/toplamSoru)*100)}%)<br/>
        <b>Ortalama Çözüm Süresi:</b> {ortSure} saniye
      </div>
      <h3>Konu Bazlı Doğru/Yanlış</h3>
      <table className="stats-table">
        <thead>
          <tr>
            <th>Konu</th><th>Toplam</th><th>Doğru</th><th>Yanlış</th><th>Boş</th>
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
      <table className="stats-table">
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
        <ul>
          <li>Problemler konusunda zorlandığın gözlemlendi. Bu konudaki temel kavramları tekrar etmeni öneririz.</li>
          <li>Zor sorularda çözüm süren ortalamanın %30 üzerinde. Zaman yönetimi için pratik yapabilirsin.</li>
          <li>Doğru cevap oranını artırmak için yanlış yaptığın konularda ek testler çözebilirsin.</li>
        </ul>
        <div style={{marginTop: '1rem', color: '#2e7d32', fontWeight: 'bold'}}>
          Harika bir çaba gösterdin! Unutma, her test seni daha iyiye götürür. Vazgeçme, başarıya çok yakınsın!
        </div>
      </div>
    </div>
  );
} 