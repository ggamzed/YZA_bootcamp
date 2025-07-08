import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login } from '../api/auth';
import './Login.css'; // 👉 Artık bileşene özel

export default function Login({ setToken }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const nav = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const data = await login(email, password);
      localStorage.setItem('token', data.access_token);
      setToken(data.access_token);
      nav('/test');
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Bilinmeyen hata';
      alert('Giriş hatası: ' + msg);
    }
  };

  return (
    <div className="form-container">
      <h2>Giriş Yap</h2>
      <form onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="form-input"
        />
        <input
          type="password"
          placeholder="Şifre"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="form-input"
        />
        <button type="submit" className="form-button">Giriş Yap</button>
      </form>
      <p className="form-link">
        Hesabın yok mu?{' '}
        <Link to="/register">Kayıt Ol</Link>
      </p>
    </div>
  );
}
