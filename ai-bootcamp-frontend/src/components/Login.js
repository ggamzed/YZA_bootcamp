import React, { useState } from 'react';
import { login, register } from '../api/auth';
import './Login.css';

export default function Login({ setToken }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isRegistering) {
        await register(email, username, password);
        setError('');
        setIsRegistering(false);
        alert('Kayıt başarılı! Şimdi giriş yapabilirsiniz.');
      } else {
        const response = await login(email, password);
        if (response.token) {
          setToken(response.token);
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
    setEmail('');
    setPassword('');
    setUsername('');
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
                  <span className="bold">hazer</span><span className="cursive">Fen</span>
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
                      className="form-control form-input"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required={isRegistering}
                      placeholder="Kullanıcı adınızı girin"
                    />
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
                    className="form-control form-input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Şifrenizi girin"
                  />
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
                    <a href="#" className="text-muted">Şifremi unuttum</a>
                  </small>
                </div>
              )}
            </div>

            {/* Demo credentials */}
            <div className="custom-block bg-light mt-4">
              <h6 className="mb-3">Demo Hesap</h6>
              <div className="row">
                <div className="col-6">
                  <small className="text-muted d-block">E-posta:</small>
                  <code>demo@example.com</code>
                </div>
                <div className="col-6">
                  <small className="text-muted d-block">Şifre:</small>
                  <code>demo123</code>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
