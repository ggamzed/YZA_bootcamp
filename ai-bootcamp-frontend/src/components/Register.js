import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '../api/auth';

export default function Register() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const nav = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const data = await register(email, username, password);
      alert(data.message || 'Kayıt başarılı!');
      nav('/');
    } catch (err) {
      console.error(err);
      const msg =
        err.response?.data?.detail ||
        err.message ||
        'Bilinmeyen hata';
      alert('Kayıt hatası: ' + msg);
    }
  };

  return (
    <div className="form-container">
      <h2>Kayıt Ol</h2>
      <form onSubmit={handleRegister}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
        <input
          placeholder="Username"
          value={username}
          onChange={e => setUsername(e.target.value)}
        />
        <input
          type="password"
          placeholder="Şifre"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
        <button type="submit">Kayıt Ol</button>
      </form>
      <p style={{ marginTop: '1rem', textAlign: 'center' }}>
        Zaten hesabın var mı?{' '}
        <Link to="/" style={{ color: '#007bff', textDecoration: 'none' }}>
          Giriş Yap
        </Link>
      </p>
    </div>
  );
}
