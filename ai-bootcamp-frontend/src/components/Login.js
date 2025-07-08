import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login } from '../api/auth';

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
      console.error(err);
      const msg =
        err.response?.data?.detail ||
        err.message ||
        'Bilinmeyen hata';
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
        />
        <input
          type="password"
          placeholder="Şifre"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
        <button type="submit">Giriş Yap</button>
      </form>
      <p style={{ marginTop: '1rem', textAlign: 'center' }}>
        Hesabın yok mu?{' '}
        <Link to="/register" style={{ color: '#007bff', textDecoration: 'none' }}>
          Kayıt Ol
        </Link>
      </p>
    </div>
  );
}
