import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getCurrentUser } from '../api/auth';
import './Settings.css';

export default function Settings({ token, setToken }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    notifications: {
      email: true,
      push: true,
      testReminders: true,
      weeklyReports: true
    },
    privacy: {
      showProfile: true,
      showStats: true,
      allowMessages: false
    },
    preferences: {
      theme: 'light',
      language: 'tr',
      timezone: 'Europe/Istanbul'
    }
  });

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await getCurrentUser(token);
        setUser(userData);
        setFormData(prev => ({
          ...prev,
          username: userData.username || '',
          email: userData.email || ''
        }));
      } catch (error) {
        console.error('Kullanıcı bilgileri alınamadı:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [token]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken('');
    navigate('/');
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNotificationChange = (key, value) => {
    setFormData(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: value
      }
    }));
  };

  const handlePrivacyChange = (key, value) => {
    setFormData(prev => ({
      ...prev,
      privacy: {
        ...prev.privacy,
        [key]: value
      }
    }));
  };

  const handlePreferenceChange = (key, value) => {
    setFormData(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [key]: value
      }
    }));
  };

  const handleSaveProfile = async () => {
    alert('Profil bilgileri güncellendi!');
  };

  const handleChangePassword = async () => {
    if (formData.newPassword !== formData.confirmPassword) {
      alert('Yeni şifreler eşleşmiyor!');
      return;
    }
    if (formData.newPassword.length < 6) {
      alert('Şifre en az 6 karakter olmalıdır!');
      return;
    }
    alert('Şifre başarıyla değiştirildi!');
    setFormData(prev => ({
      ...prev,
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    }));
  };

  const handleSaveSettings = async () => {
    alert('Ayarlar kaydedildi!');
  };

  if (loading) {
    return (
      <div className="main-wrapper">
        <div className="container-fluid">
          <div className="row justify-content-center">
            <div className="col-md-8">
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Yükleniyor...</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="main-wrapper">
      {/* HazerFen Logo - Absolute Top Left */}
      <div className="top-logo">
        <Link to="/home" className="logo-link">
          <div className="logo">
            <span className="bold">hazer</span><span className="cursive">Fen</span>
          </div>
          <div className="logo-slogan">BİLGİYLE KANATLAN!</div>
        </Link>
      </div>



      <div className="container-fluid">
        <div className="row">
          {/* Sidebar */}
          <nav id="sidebarMenu" className="col-md-3 col-lg-3 d-md-block sidebar collapse">
            <div className="position-sticky py-4 px-3 sidebar-sticky">
              <ul className="nav flex-column h-100">
                <li className="nav-item">
                  <Link className="nav-link" to="/home">
                    <i className="bi-house-fill me-2"></i>
                    Ana Sayfa
                  </Link>
                </li>

                <li className="nav-item">
                  <Link className="nav-link" to="/statistics">
                    <i className="bi-graph-up me-2"></i>
                    İstatistikler
                  </Link>
                </li>

                <li className="nav-item">
                  <Link className="nav-link" to="/completed-tests">
                    <i className="bi-file-text me-2"></i>
                    Testler
                  </Link>
                </li>

                <li className="nav-item">
                  <Link className="nav-link" to="/profile">
                    <i className="bi-person me-2"></i>
                    Profil
                  </Link>
                </li>

                <li className="nav-item">
                  <a className="nav-link active" href="#">
                    <i className="bi-gear me-2"></i>
                    Ayarlar
                  </a>
                </li>

                <li className="nav-item border-top mt-auto pt-2">
                  <a className="nav-link" href="#" onClick={handleLogout}>
                    <i className="bi-box-arrow-left me-2"></i>
                    Çıkış Yap
                  </a>
                </li>
              </ul>
            </div>
          </nav>

          {/* Main Content */}
          <main className="main-wrapper col-md-9 ms-sm-auto py-4 col-lg-9 px-md-4">
            <div className="title-group mb-3">
              <h1 className="h2 mb-0">Ayarlar</h1>
              <small className="text-muted">Hesap ayarlarınızı yönetin</small>
            </div>

            <div className="row">
              <div className="col-lg-3">
                <div className="custom-block bg-white">
                  <h5 className="mb-4">Ayarlar Menüsü</h5>
                  
                  <div className="nav flex-column nav-pills">
                    <button 
                      className={`nav-link text-start ${activeTab === 'profile' ? 'active' : ''}`}
                      onClick={() => setActiveTab('profile')}
                    >
                      <i className="bi-person me-2"></i>
                      Profil Bilgileri
                    </button>
                    
                    <button 
                      className={`nav-link text-start ${activeTab === 'security' ? 'active' : ''}`}
                      onClick={() => setActiveTab('security')}
                    >
                      <i className="bi-shield-lock me-2"></i>
                      Güvenlik
                    </button>
                    
                    <button 
                      className={`nav-link text-start ${activeTab === 'notifications' ? 'active' : ''}`}
                      onClick={() => setActiveTab('notifications')}
                    >
                      <i className="bi-bell me-2"></i>
                      Bildirimler
                    </button>
                    
                    <button 
                      className={`nav-link text-start ${activeTab === 'privacy' ? 'active' : ''}`}
                      onClick={() => setActiveTab('privacy')}
                    >
                      <i className="bi-eye me-2"></i>
                      Gizlilik
                    </button>
                    
                    <button 
                      className={`nav-link text-start ${activeTab === 'preferences' ? 'active' : ''}`}
                      onClick={() => setActiveTab('preferences')}
                    >
                      <i className="bi-gear me-2"></i>
                      Tercihler
                    </button>
                  </div>
                </div>
              </div>

              <div className="col-lg-9">
                <div className="custom-block bg-white">
                  {activeTab === 'profile' && (
                    <div>
                      <h5 className="mb-4">Profil Bilgileri</h5>
                      
                      <div className="row">
                        <div className="col-md-6 mb-3">
                          <label className="form-label">Kullanıcı Adı</label>
                          <input 
                            type="text" 
                            className="form-control" 
                            value={formData.username}
                            onChange={(e) => handleInputChange('username', e.target.value)}
                          />
                        </div>
                        
                        <div className="col-md-6 mb-3">
                          <label className="form-label">E-posta</label>
                          <input 
                            type="email" 
                            className="form-control" 
                            value={formData.email}
                            onChange={(e) => handleInputChange('email', e.target.value)}
                          />
                        </div>
                      </div>
                      
                      <button className="btn btn-primary" onClick={handleSaveProfile}>
                        <i className="bi-check me-2"></i>
                        Kaydet
                      </button>
                    </div>
                  )}

                  {activeTab === 'security' && (
                    <div>
                      <h5 className="mb-4">Güvenlik Ayarları</h5>
                      
                      <div className="row">
                        <div className="col-md-12 mb-3">
                          <label className="form-label">Mevcut Şifre</label>
                          <input 
                            type="password" 
                            className="form-control" 
                            value={formData.currentPassword}
                            onChange={(e) => handleInputChange('currentPassword', e.target.value)}
                          />
                        </div>
                        
                        <div className="col-md-6 mb-3">
                          <label className="form-label">Yeni Şifre</label>
                          <input 
                            type="password" 
                            className="form-control" 
                            value={formData.newPassword}
                            onChange={(e) => handleInputChange('newPassword', e.target.value)}
                          />
                        </div>
                        
                        <div className="col-md-6 mb-3">
                          <label className="form-label">Yeni Şifre (Tekrar)</label>
                          <input 
                            type="password" 
                            className="form-control" 
                            value={formData.confirmPassword}
                            onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                          />
                        </div>
                      </div>
                      
                      <button className="btn btn-primary" onClick={handleChangePassword}>
                        <i className="bi-key me-2"></i>
                        Şifre Değiştir
                      </button>
                    </div>
                  )}

                  {activeTab === 'notifications' && (
                    <div>
                      <h5 className="mb-4">Bildirim Ayarları</h5>
                      
                      <div className="mb-3">
                        <div className="form-check form-switch">
                          <input 
                            className="form-check-input" 
                            type="checkbox" 
                            id="emailNotifications"
                            checked={formData.notifications.email}
                            onChange={(e) => handleNotificationChange('email', e.target.checked)}
                          />
                          <label className="form-check-label" htmlFor="emailNotifications">
                            E-posta Bildirimleri
                          </label>
                        </div>
                      </div>
                      
                      <div className="mb-3">
                        <div className="form-check form-switch">
                          <input 
                            className="form-check-input" 
                            type="checkbox" 
                            id="pushNotifications"
                            checked={formData.notifications.push}
                            onChange={(e) => handleNotificationChange('push', e.target.checked)}
                          />
                          <label className="form-check-label" htmlFor="pushNotifications">
                            Push Bildirimleri
                          </label>
                        </div>
                      </div>
                      
                      <div className="mb-3">
                        <div className="form-check form-switch">
                          <input 
                            className="form-check-input" 
                            type="checkbox" 
                            id="testReminders"
                            checked={formData.notifications.testReminders}
                            onChange={(e) => handleNotificationChange('testReminders', e.target.checked)}
                          />
                          <label className="form-check-label" htmlFor="testReminders">
                            Test Hatırlatıcıları
                          </label>
                        </div>
                      </div>
                      
                      <div className="mb-3">
                        <div className="form-check form-switch">
                          <input 
                            className="form-check-input" 
                            type="checkbox" 
                            id="weeklyReports"
                            checked={formData.notifications.weeklyReports}
                            onChange={(e) => handleNotificationChange('weeklyReports', e.target.checked)}
                          />
                          <label className="form-check-label" htmlFor="weeklyReports">
                            Haftalık Raporlar
                          </label>
                        </div>
                      </div>
                      
                      <button className="btn btn-primary" onClick={handleSaveSettings}>
                        <i className="bi-check me-2"></i>
                        Kaydet
                      </button>
                    </div>
                  )}

                  {activeTab === 'privacy' && (
                    <div>
                      <h5 className="mb-4">Gizlilik Ayarları</h5>
                      
                      <div className="mb-3">
                        <div className="form-check form-switch">
                          <input 
                            className="form-check-input" 
                            type="checkbox" 
                            id="showProfile"
                            checked={formData.privacy.showProfile}
                            onChange={(e) => handlePrivacyChange('showProfile', e.target.checked)}
                          />
                          <label className="form-check-label" htmlFor="showProfile">
                            Profilimi Göster
                          </label>
                        </div>
                      </div>
                      
                      <div className="mb-3">
                        <div className="form-check form-switch">
                          <input 
                            className="form-check-input" 
                            type="checkbox" 
                            id="showStats"
                            checked={formData.privacy.showStats}
                            onChange={(e) => handlePrivacyChange('showStats', e.target.checked)}
                          />
                          <label className="form-check-label" htmlFor="showStats">
                            İstatistiklerimi Göster
                          </label>
                        </div>
                      </div>
                      
                      <div className="mb-3">
                        <div className="form-check form-switch">
                          <input 
                            className="form-check-input" 
                            type="checkbox" 
                            id="allowMessages"
                            checked={formData.privacy.allowMessages}
                            onChange={(e) => handlePrivacyChange('allowMessages', e.target.checked)}
                          />
                          <label className="form-check-label" htmlFor="allowMessages">
                            Mesaj Almaya İzin Ver
                          </label>
                        </div>
                      </div>
                      
                      <button className="btn btn-primary" onClick={handleSaveSettings}>
                        <i className="bi-check me-2"></i>
                        Kaydet
                      </button>
                    </div>
                  )}

                  {activeTab === 'preferences' && (
                    <div>
                      <h5 className="mb-4">Tercihler</h5>
                      
                      <div className="row">
                        <div className="col-md-6 mb-3">
                          <label className="form-label">Tema</label>
                          <select 
                            className="form-control" 
                            value={formData.preferences.theme}
                            onChange={(e) => handlePreferenceChange('theme', e.target.value)}
                          >
                            <option value="light">Açık Tema</option>
                            <option value="dark">Koyu Tema</option>
                            <option value="auto">Otomatik</option>
                          </select>
                        </div>
                        
                        <div className="col-md-6 mb-3">
                          <label className="form-label">Dil</label>
                          <select 
                            className="form-control" 
                            value={formData.preferences.language}
                            onChange={(e) => handlePreferenceChange('language', e.target.value)}
                          >
                            <option value="tr">Türkçe</option>
                            <option value="en">English</option>
                          </select>
                        </div>
                        
                        <div className="col-md-6 mb-3">
                          <label className="form-label">Saat Dilimi</label>
                          <select 
                            className="form-control" 
                            value={formData.preferences.timezone}
                            onChange={(e) => handlePreferenceChange('timezone', e.target.value)}
                          >
                            <option value="Europe/Istanbul">İstanbul (UTC+3)</option>
                            <option value="Europe/London">Londra (UTC+0)</option>
                            <option value="America/New_York">New York (UTC-5)</option>
                          </select>
                        </div>
                      </div>
                      
                      <button className="btn btn-primary" onClick={handleSaveSettings}>
                        <i className="bi-check me-2"></i>
                        Kaydet
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
} 