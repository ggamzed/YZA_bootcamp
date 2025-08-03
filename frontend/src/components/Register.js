import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '../api/auth';
import './Register.css';

export default function Register() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [errors, setErrors] = useState({});
  const nav = useNavigate();

  const validateUsername = (username) => {
    if (username.length < 5) {
      return 'Kullanıcı adı en az 5 karakter olmalıdır';
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      return 'Kullanıcı adı sadece harf, rakam, alt çizgi (_) ve tire (-) içerebilir';
    }
    if (/[_-]{2,}/.test(username)) {
      return 'Kullanıcı adında ardışık özel karakterler olamaz';
    }
    if (username.startsWith('_') || username.startsWith('-') || 
        username.endsWith('_') || username.endsWith('-')) {
      return 'Kullanıcı adı alt çizgi veya tire ile başlayamaz veya bitemez';
    }
    return null;
  };

  const validatePassword = (password) => {
    if (password.length < 8) {
      return 'Şifre en az 8 karakter olmalıdır';
    }
    return null;
  };

  const validateName = (name, fieldName) => {
    if (!name || name.trim() === '') {
      return `${fieldName} alanı zorunludur`;
    }
    if (name.length > 30) {
      return `${fieldName} maksimum 30 karakter olabilir`;
    }
    if ((name.split(' ').length - 1) > 2) {
      return `${fieldName} maksimum 2 boşluk içerebilir`;
    }
    if (!/^[a-zA-ZğüşıöçĞÜŞİÖÇ\s]+$/.test(name)) {
      return `${fieldName} sadece harf ve boşluk içerebilir`;
    }
    return null;
  };

  const validateBirthDate = (date) => {
    if (!date) {
      return 'Doğum tarihi alanı zorunludur';
    }
    const selectedDate = new Date(date);
    const today = new Date();
    if (selectedDate > today) {
      return 'Doğum tarihi gelecek bir tarih olamaz';
    }
    if (selectedDate.getFullYear() < 1900) {
      return 'Geçerli bir doğum tarihi giriniz';
    }
    return null;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    
    // Client-side validation
    const usernameError = validateUsername(username);
    const passwordError = validatePassword(password);
    const firstNameError = validateName(firstName, 'Ad');
    const lastNameError = validateName(lastName, 'Soyad');
    const birthDateError = validateBirthDate(birthDate);
    
    if (usernameError || passwordError || firstNameError || lastNameError || birthDateError) {
      setErrors({
        username: usernameError,
        password: passwordError,
        firstName: firstNameError,
        lastName: lastNameError,
        birthDate: birthDateError
      });
      return;
    }

    setErrors({});
    
    try {
      const data = await register(email, username, password, firstName, lastName, birthDate);
      alert(data.message || 'Kayıt başarılı!');
      nav('/');
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Bilinmeyen hata';
      alert('Kayıt hatası: ' + msg);
    }
  };

  return (
    <div className="register-container">
      <h2>Kayıt Ol</h2>
      <form onSubmit={handleRegister}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="form-input"
          required
        />
        <input
          placeholder="Kullanıcı Adı (en az 5 karakter)"
          value={username}
          onChange={e => {
            setUsername(e.target.value);
            if (errors.username) {
              setErrors(prev => ({ ...prev, username: null }));
            }
          }}
          className={`form-input ${errors.username ? 'error' : ''}`}
          required
        />
        {errors.username && <div className="error-message">{errors.username}</div>}
        
        <input
          type="password"
          placeholder="Şifre (en az 8 karakter)"
          value={password}
          onChange={e => {
            setPassword(e.target.value);
            if (errors.password) {
              setErrors(prev => ({ ...prev, password: null }));
            }
          }}
          className={`form-input ${errors.password ? 'error' : ''}`}
          required
        />
        {errors.password && <div className="error-message">{errors.password}</div>}
        
        <input
          type="text"
          placeholder="Ad (maksimum 30 karakter, 2 boşluk)"
          value={firstName}
          onChange={e => {
            setFirstName(e.target.value);
            if (errors.firstName) {
              setErrors(prev => ({ ...prev, firstName: null }));
            }
          }}
          className={`form-input ${errors.firstName ? 'error' : ''}`}
          required
        />
        {errors.firstName && <div className="error-message">{errors.firstName}</div>}
        
        <input
          type="text"
          placeholder="Soyad (maksimum 30 karakter, 2 boşluk)"
          value={lastName}
          onChange={e => {
            setLastName(e.target.value);
            if (errors.lastName) {
              setErrors(prev => ({ ...prev, lastName: null }));
            }
          }}
          className={`form-input ${errors.lastName ? 'error' : ''}`}
          required
        />
        {errors.lastName && <div className="error-message">{errors.lastName}</div>}
        
        <input
          type="date"
          placeholder="Doğum Tarihi"
          value={birthDate}
          onChange={e => {
            setBirthDate(e.target.value);
            if (errors.birthDate) {
              setErrors(prev => ({ ...prev, birthDate: null }));
            }
          }}
          className={`form-input ${errors.birthDate ? 'error' : ''}`}
          required
        />
        {errors.birthDate && <div className="error-message">{errors.birthDate}</div>}
        
        <button type="submit" className="register-button">Kayıt Ol</button>
      </form>
      <p className="form-link">
        Zaten hesabın var mı?{' '}
        <Link to="/">Giriş Yap</Link>
      </p>
    </div>
  );
}
