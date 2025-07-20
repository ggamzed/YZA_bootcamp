import React from 'react';
import { useNavigate } from 'react-router-dom';
import './TestSelectPage.css';

export default function TestSelectPage({ token }) {
  const nav = useNavigate();
  const dersler = [
    { id: 1, name: 'Matematik' },
    { id: 2, name: 'Fizik' },
    { id: 3, name: 'Biyoloji' },
    { id: 4, name: 'Tarih' },
    { id: 5, name: 'Türkçe' },
  ];

  const selectDers = (dersId) => {
    nav(`/question?ders_id=${dersId}`);
  };

  return (
    <div className="select-container">
      <h2>Bir ders seçin</h2>
      <div className="button-group">
        {dersler.map(d => (
          <button key={d.id} onClick={() => selectDers(d.id)}>
            {d.name}
          </button>
        ))}
      </div>
    </div>
  );
}