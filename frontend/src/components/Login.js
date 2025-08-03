import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { login, register } from '../api/auth';
import { useUser } from '../contexts/UserContext';
import './Login.css';

export default function Login() {
  const { login: userLogin } = useUser();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [errors, setErrors] = useState({});

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

  const validateLastName = (lastName) => {
    if (!lastName || lastName.trim() === '') {
      return 'Soyad alanı zorunludur';
    }
    if (lastName.length > 20) {
      return 'Soyad maksimum 20 karakter olabilir';
    }
    if (lastName.includes(' ')) {
      return 'Soyad boşluk içeremez';
    }
    if (!/^[a-zA-ZğüşıöçĞÜŞİÖÇ]+$/.test(lastName)) {
      return 'Soyad sadece harf içerebilir';
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setErrors({});

    try {
      if (isRegistering) {
        // Client-side validation for registration
        const usernameError = validateUsername(username);
        const passwordError = validatePassword(password);
        const firstNameError = validateName(firstName, 'Ad');
        const lastNameError = validateLastName(lastName);
        const birthDateError = validateBirthDate(birthDate);
        
        if (usernameError || passwordError || firstNameError || lastNameError || birthDateError) {
          setErrors({
            username: usernameError,
            password: passwordError,
            firstName: firstNameError,
            lastName: lastNameError,
            birthDate: birthDateError
          });
          setLoading(false);
          return;
        }

        await register(email, username, password, firstName, lastName, birthDate);
        setError('');
        setIsRegistering(false);
        alert('Kayıt başarılı! Şimdi giriş yapabilirsiniz.');
      } else {
        localStorage.clear();
        sessionStorage.clear();
        
        if ('caches' in window) {
          caches.keys().then(names => {
            names.forEach(name => {
              caches.delete(name);
            });
          });
        }
        
        const response = await login(email, password);
        if (response.token) {
          console.log('DEBUG: Login successful, token received:', response.token ? 'Token exists' : 'No token');
          userLogin(response.token);
        } else {
          setError('Giriş başarısız. Lütfen bilgilerinizi kontrol edin.');
        }
      }
    } catch (err) {
      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError(isRegistering ? 'Kayıt olurken bir hata oluştu.' : 'Bir hata oluştu. Lütfen tekrar deneyin.');
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsRegistering(!isRegistering);
    setError('');
    setErrors({});
    setEmail('');
    setPassword('');
    setUsername('');
    setFirstName('');
    setLastName('');
    setBirthDate('');
  };

  return (
    <div className="main-wrapper">
      <div className="container-fluid">
        <div className="row justify-content-center align-items-center min-vh-100">
          <div className="col-lg-4 col-md-6 col-12">
            <div className="custom-block bg-white">
              <div className="text-center mb-4">
                <div className="custom-block-profile-image-wrap mb-3">
                  <div className="profile-rounded bg-primary text-white mx-auto" style={{ width: '80px', height: '80px', fontSize: '2rem' }}>
                    <i className="bi-mortarboard"></i>
                  </div>
                </div>
                <div className="logo">
                  <img src="/favicon.png" alt="HezarFen" className="favicon-icon-login" />
                  <span className="bold">Hezar</span><span className="cursive">Fen</span>
                </div>
                <h3>BİLGİYLE KANATLAN!</h3>
                <p className="text-muted">{isRegistering ? 'Hesap oluşturun' : 'Hesabınıza giriş yapın'}</p>
              </div>

              <form onSubmit={handleSubmit} className="custom-form">
                                 {isRegistering && (
                   <div className="mb-3">
                     <label className="form-label">Kullanıcı Adı</label>
                     <input
                       type="text"
                       className={`form-control form-input ${errors.username ? 'is-invalid' : ''}`}
                       value={username}
                       onChange={(e) => {
                         setUsername(e.target.value);
                         if (errors.username) {
                           setErrors(prev => ({ ...prev, username: null }));
                         }
                       }}
                       required={isRegistering}
                       placeholder="Kullanıcı adı"
                     />
                     {errors.username && <div className="invalid-feedback">{errors.username}</div>}
                   </div>
                 )}

                 {isRegistering && (
                   <div className="mb-3">
                     <label className="form-label">Ad</label>
                     <input
                       type="text"
                       className={`form-control form-input ${errors.firstName ? 'is-invalid' : ''}`}
                       value={firstName}
                       onChange={(e) => {
                         setFirstName(e.target.value);
                         if (errors.firstName) {
                           setErrors(prev => ({ ...prev, firstName: null }));
                         }
                       }}
                       required={isRegistering}
                       placeholder="Ad"
                     />
                     {errors.firstName && <div className="invalid-feedback">{errors.firstName}</div>}
                   </div>
                 )}

                 {isRegistering && (
                   <div className="mb-3">
                     <label className="form-label">Soyad</label>
                     <input
                       type="text"
                       className={`form-control form-input ${errors.lastName ? 'is-invalid' : ''}`}
                       value={lastName}
                       onChange={(e) => {
                         setLastName(e.target.value);
                         if (errors.lastName) {
                           setErrors(prev => ({ ...prev, lastName: null }));
                         }
                       }}
                       required={isRegistering}
                       placeholder="Soyad"
                     />
                     {errors.lastName && <div className="invalid-feedback">{errors.lastName}</div>}
                   </div>
                 )}

                {isRegistering && (
                  <div className="mb-3">
                    <label className="form-label">Doğum Tarihi</label>
                    <input
                      type="date"
                      className={`form-control form-input ${errors.birthDate ? 'is-invalid' : ''}`}
                      value={birthDate}
                      onChange={(e) => {
                        setBirthDate(e.target.value);
                        if (errors.birthDate) {
                          setErrors(prev => ({ ...prev, birthDate: null }));
                        }
                      }}
                      required={isRegistering}
                    />
                    {errors.birthDate && <div className="invalid-feedback">{errors.birthDate}</div>}
                  </div>
                )}

                <div className="mb-3">
                  <label className="form-label">E-posta</label>
                  <input
                    type="email"
                    className="form-control form-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="ornek@email.com"
                  />
                </div>

                                 <div className="mb-4">
                   <label className="form-label">Şifre</label>
                   <input
                     type="password"
                     className={`form-control form-input ${errors.password ? 'is-invalid' : ''}`}
                     value={password}
                     onChange={(e) => {
                       setPassword(e.target.value);
                       if (errors.password) {
                         setErrors(prev => ({ ...prev, password: null }));
                       }
                     }}
                     required
                     placeholder="Şifre"
                   />
                   {errors.password && <div className="invalid-feedback">{errors.password}</div>}
                 </div>

                {error && (
                  <div className="alert alert-danger mb-4">
                    <i className="bi-exclamation-triangle me-2"></i>
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  className="btn custom-btn w-100 button"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      {isRegistering ? 'Kayıt yapılıyor...' : 'Giriş yapılıyor...'}
                    </>
                  ) : (
                    <>
                      <i className={`bi-${isRegistering ? 'person-plus' : 'box-arrow-in-right'} me-2`}></i>
                      {isRegistering ? 'Kayıt Ol' : 'Giriş Yap'}
                    </>
                  )}
                </button>
              </form>

              <div className="text-center mt-4">
                <small className="text-muted">
                  {isRegistering ? 'Zaten hesabınız var mı?' : 'Hesabınız yok mu?'} 
                  <button 
                    type="button" 
                    className="btn btn-link text-primary p-0 ms-1"
                    onClick={toggleMode}
                  >
                    {isRegistering ? 'Giriş yapın' : 'Kayıt olun'}
                  </button>
                </small>
              </div>

                             {!isRegistering && (
                 <div className="text-center mt-3">
                   <small className="text-muted">
                     <Link to="/forgot-password" className="text-muted">Şifremi unuttum</Link>
                   </small>
                 </div>
               )}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
