import React, { useState } from 'react';
import { submitAnswer, predictAnswer } from '../api/answers';

export default function TestPage({ token }) {
  const [dersId, setDersId] = useState(1);
  const [konuId, setKonuId] = useState(1);
  const [zorluk, setZorluk] = useState(1);
  const [isCorrect, setIsCorrect] = useState(1);
  const [msg, setMsg] = useState('');

  const doSubmit = async () => {
    try {
      await submitAnswer(
        { ders_id: dersId, konu_id: konuId, zorluk, is_correct: isCorrect },
        token
      );
      setMsg('Cevap kaydedildi.');
    } catch {
      setMsg('Submit hatası');
    }
  };

  const doPredict = async () => {
    try {
      const res = await predictAnswer(
        { ders_id: dersId, konu_id: konuId, zorluk },
        token
      );
      setMsg(JSON.stringify(res.correct_probability));
    } catch {
      setMsg('Predict hatası');
    }
  };

  return (
    <div className="test-page">
      <h2>Model Test</h2>
      <label htmlFor="DersID">Ders ID:</label><br/>
      <input
        type="number"
        value={dersId}
        onChange={e => setDersId(+e.target.value)}
        placeholder="ders_id"
      />
      <label htmlFor="KonuId">Konu ID:</label><br/>
      <input
        type="number"
        value={konuId}
        onChange={e => setKonuId(+e.target.value)}
        placeholder="konu_id"
      />
      <label htmlFor="Zorluk seviyesi">Zorluk seviyesi:</label><br/>
      <input
        type="number"
        value={zorluk}
        onChange={e => setZorluk(+e.target.value)}
        placeholder="zorluk"
      />
      <label htmlFor="isCorrect">Doğru mu? (1=Evet / 0=Hayır):</label><br/>
      <input
        type="number"
        value={isCorrect}
        onChange={e => setIsCorrect(+e.target.value)}
        placeholder="is_correct"
      />
      <button onClick={doSubmit}>Cevap Gönder</button>
      <button onClick={doPredict}>Tahmin Al</button>
      <p className="message">{msg}</p>
    </div>
  );
}
