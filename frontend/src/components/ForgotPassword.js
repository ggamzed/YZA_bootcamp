import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { forgotPassword, resetPassword } from '../api/auth';
import './ForgotPassword.css';

export default function ForgotPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [step, setStep] = useState(token ? 'reset' : 'request'); // 'request' or 'reset'
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const handleRequestReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await forgotPassword(email);
      setMessage(response.message);
      if (response.test_url) {
        // In development, show the test URL for testing
        setMessage(`${response.message} Test URL: ${response.test_url}`);
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    if (newPassword !== confirmPassword) {
      setError('Şifreler eşleşmiyor.');
      setLoading(false);
      return;
    }

    if (newPassword.length < 8) {
      setError('Şifre en az 8 karakter olmalıdır.');
      setLoading(false);
      return;
    }

    try {
      const response = await resetPassword(token, newPassword);
      setMessage(response.message);
      setStep('success');
    } catch (err) {
      setError(err.response?.data?.detail || 'Bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'success') {
    return (
      <div className="forgot-password-container">
        <div className="success-message">
          <h2>Şifre Başarıyla Sıfırlandı!</h2>
          <p>Yeni şifrenizle giriş yapabilirsiniz.</p>
          <Link to="/" className="btn btn-primary">
            Giriş Yap
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="forgot-password-container">
      <div className="forgot-password-card">
        <div className="text-center mb-4">
          <div className="profile-rounded bg-primary text-white mx-auto mb-3" style={{ width: '60px', height: '60px', fontSize: '1.5rem' }}>
            <i className="bi-key"></i>
          </div>
          <h3>Şifremi Unuttum</h3>
          <p className="text-muted">
            {step === 'request' 
              ? 'E-posta adresinizi girin, şifre sıfırlama bağlantısı göndereceğiz.'
              : 'Yeni şifrenizi belirleyin.'
            }
          </p>
        </div>

        {step === 'request' ? (
          <form onSubmit={handleRequestReset}>
            <div className="mb-3">
              <label className="form-label">E-posta Adresi</label>
              <input
                type="email"
                className="form-control form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="ornek@email.com"
              />
            </div>

            {error && (
              <div className="alert alert-danger mb-3">
                <i className="bi-exclamation-triangle me-2"></i>
                {error}
              </div>
            )}

            {message && (
              <div className="alert alert-success mb-3">
                <i className="bi-check-circle me-2"></i>
                <div>
                  {message.split('Test URL:')[0]}
                  {message.includes('Test URL:') && (
                    <div className="test-url-container">
                      <strong>Test URL:</strong>
                      <br />
                      <div className="d-flex align-items-center gap-2 mt-1">
                        <a 
                          href={message.split('Test URL:')[1].trim()} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex-grow-1"
                        >
                          {message.split('Test URL:')[1].trim()}
                        </a>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() => copyToClipboard(message.split('Test URL:')[1].trim())}
                          title="URL'yi kopyala"
                        >
                          <i className={`bi ${copied ? 'bi-check' : 'bi-clipboard'}`}></i>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <button
              type="submit"
              className="btn custom-btn w-100 mb-3"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Gönderiliyor...
                </>
              ) : (
                <>
                  <i className="bi-envelope me-2"></i>
                  Şifre Sıfırlama Bağlantısı Gönder
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword}>
            <div className="mb-3">
              <label className="form-label">Yeni Şifre</label>
              <input
                type="password"
                className="form-control form-input"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                placeholder="Yeni şifrenizi girin (en az 8 karakter)"
                minLength="8"
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Şifre Tekrar</label>
              <input
                type="password"
                className="form-control form-input"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="Şifrenizi tekrar girin"
                minLength="8"
              />
            </div>

            {error && (
              <div className="alert alert-danger mb-3">
                <i className="bi-exclamation-triangle me-2"></i>
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn custom-btn w-100 mb-3"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Şifre Sıfırlanıyor...
                </>
              ) : (
                <>
                  <i className="bi-check-circle me-2"></i>
                  Şifreyi Sıfırla
                </>
              )}
            </button>
          </form>
        )}

        <div className="text-center">
          <Link to="/" className="text-decoration-none">
            <i className="bi-arrow-left me-1"></i>
            Giriş sayfasına dön
          </Link>
        </div>
      </div>
    </div>
  );
} 