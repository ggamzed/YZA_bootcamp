import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getCurrentUser, updateProfile, changePassword, updatePrivacySettings } from '../api/auth';
import { useUser } from '../contexts/UserContext';
import { useTheme } from '../contexts/ThemeContext';
import Header from './Header';
import './Settings.css';

export default function Settings({ onLogout }) {
  const navigate = useNavigate();
  const { token, user: globalUser, setUser: setGlobalUser } = useUser();
  const { theme, changeTheme } = useTheme();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    firstName: '',
    lastName: '',
    birthDate: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    
             privacy: {
      showProfile: true,
      showStats: true,
      hideAiRecommendations: false
    },
    preferences: {
      theme: theme,
      language: 'tr'
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
          email: userData.email || '',
          firstName: userData.first_name || '',
          lastName: userData.last_name || '',
          birthDate: userData.birth_date ? userData.birth_date.split('T')[0] : '',
          privacy: {
            showProfile: userData.show_profile === true,
            showStats: userData.show_stats === true,
            hideAiRecommendations: userData.hide_ai_recommendations === true
          }
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
    if (onLogout) {
      onLogout();
    }
    navigate('/');
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
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
    
    // Tema değişikliğini anında uygula
    if (key === 'theme') {
      changeTheme(value);
    }
  };

  const validateName = (name, fieldName) => {
    if (name && name.length > 30) {
      return `${fieldName} maksimum 30 karakter olabilir`;
    }
    if (name && (name.split(' ').length - 1) > 2) {
      return `${fieldName} maksimum 2 boşluk içerebilir`;
    }
    if (name && !/^[a-zA-ZğüşıöçĞÜŞİÖÇ\s]+$/.test(name)) {
      return `${fieldName} sadece harf ve boşluk içerebilir`;
    }
    return null;
  };

  const handleSaveProfile = async () => {
    try {
      // Validasyon
      if (!formData.username || !formData.email) {
        alert('Kullanıcı adı ve e-posta alanları boş olamaz!');
        return;
      }

      if (formData.username.length < 5) {
        alert('Kullanıcı adı en az 5 karakter olmalıdır!');
        return;
      }

      // E-posta formatı kontrolü
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        alert('Geçerli bir e-posta adresi giriniz!');
        return;
      }

      // Ad ve soyad validasyonu
      const firstNameError = validateName(formData.firstName, 'Ad');
      const lastNameError = validateName(formData.lastName, 'Soyad');
      
      if (firstNameError) {
        alert(firstNameError);
        return;
      }
      
      if (lastNameError) {
        alert(lastNameError);
        return;
      }

      // API çağrısı
      const response = await updateProfile(token, {
        username: formData.username,
        email: formData.email,
        first_name: formData.firstName,
        last_name: formData.lastName,
        birth_date: formData.birthDate ? new Date(formData.birthDate).toISOString() : null
      });

      // Başarılı güncelleme
      alert('Profil bilgileri başarıyla güncellendi!');
      
      // Kullanıcı bilgilerini güncelle
      setUser(response.user);
      
    } catch (error) {
      console.error('Profil güncelleme hatası:', error);
      
      if (error.response) {
        const errorMessage = error.response.data.detail || 'Profil güncellenirken bir hata oluştu.';
        alert(errorMessage);
      } else {
        alert('Profil güncellenirken bir hata oluştu. Lütfen tekrar deneyin.');
      }
    }
  };

  const handleChangePassword = async () => {
    // Validasyonlar
    if (!formData.currentPassword) {
      alert('Mevcut şifre alanı zorunludur!');
      return;
    }
    if (!formData.newPassword) {
      alert('Yeni şifre alanı zorunludur!');
      return;
    }
    if (formData.newPassword !== formData.confirmPassword) {
      alert('Yeni şifreler eşleşmiyor!');
      return;
    }
    if (formData.newPassword.length < 8) {
      alert('Şifre en az 8 karakter olmalıdır!');
      return;
    }
    if (formData.currentPassword === formData.newPassword) {
      alert('Yeni şifre mevcut şifre ile aynı olamaz!');
      return;
    }

    try {
      await changePassword(token, formData.currentPassword, formData.newPassword);
      alert('Şifre başarıyla değiştirildi!');
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'Şifre değiştirilirken bir hata oluştu.';
      alert('Hata: ' + errorMessage);
    }
  };

  const handleSaveSettings = async () => {
    try {
      if (activeTab === 'privacy') {
        // Debug: Log privacy settings being sent
        console.log('DEBUG: Sending privacy settings:', {
          show_profile: formData.privacy.showProfile,
          show_stats: formData.privacy.showStats,
          hide_ai_recommendations: formData.privacy.hideAiRecommendations
        });
        
        // Gizlilik ayarlarını kaydet
        await updatePrivacySettings(token, {
          show_profile: formData.privacy.showProfile,
          show_stats: formData.privacy.showStats,
          hide_ai_recommendations: formData.privacy.hideAiRecommendations
        });
        
        // Global user state'ini güncelle
        if (globalUser) {
          const updatedUser = {
            ...globalUser,
            show_profile: formData.privacy.showProfile,
            show_stats: formData.privacy.showStats,
            hide_ai_recommendations: formData.privacy.hideAiRecommendations
          };
          console.log('DEBUG Settings - Updating global user:', {
            old: { show_profile: globalUser.show_profile, show_stats: globalUser.show_stats, hide_ai_recommendations: globalUser.hide_ai_recommendations },
            new: { show_profile: updatedUser.show_profile, show_stats: updatedUser.show_stats, hide_ai_recommendations: updatedUser.hide_ai_recommendations }
          });
          setGlobalUser(updatedUser);
        }
        
        alert('Gizlilik ayarları başarıyla kaydedildi!');
      } else if (activeTab === 'preferences') {
        // Tercihler ayarlarını kaydet
        console.log('DEBUG: Saving preferences:', {
          theme: formData.preferences.theme,
          language: formData.preferences.language
        });
        
        // Tema değişikliğini uygula
        changeTheme(formData.preferences.theme);
        
        // LocalStorage'a kaydet
        localStorage.setItem('theme', formData.preferences.theme);
        localStorage.setItem('language', formData.preferences.language);
        
        alert('Tercihler başarıyla kaydedildi!');
      }
    } catch (error) {
      console.error('Ayarlar kaydedilirken hata:', error);
      const errorMessage = error.response?.data?.detail || 'Ayarlar kaydedilirken bir hata oluştu.';
      alert('Hata: ' + errorMessage);
    }
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
      <Header />



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

                <li className="nav-item border-top mt-3 pt-2">
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
                  
                  <ul className="nav flex-column h-100">
                    <li className="nav-item">
                      <button 
                        className={`nav-link ${activeTab === 'profile' ? 'active' : ''}`}
                        onClick={() => setActiveTab('profile')}
                      >
                        <i className="bi-person me-2"></i>
                        Profil Bilgileri
                      </button>
                    </li>
                    
                                         <li className="nav-item">
                       <button 
                         className={`nav-link ${activeTab === 'security' ? 'active' : ''}`}
                         onClick={() => setActiveTab('security')}
                       >
                         <i className="bi-shield-lock me-2"></i>
                         Güvenlik
                       </button>
                     </li>
                    
                    <li className="nav-item">
                      <button 
                        className={`nav-link ${activeTab === 'privacy' ? 'active' : ''}`}
                        onClick={() => setActiveTab('privacy')}
                      >
                        <i className="bi-eye me-2"></i>
                        Gizlilik
                      </button>
                    </li>
                    
                    <li className="nav-item">
                      <button 
                        className={`nav-link ${activeTab === 'preferences' ? 'active' : ''}`}
                        onClick={() => setActiveTab('preferences')}
                      >
                        <i className="bi-gear me-2"></i>
                        Tercihler
                      </button>
                    </li>
                  </ul>
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
                       
                       <div className="row">
                         <div className="col-md-6 mb-3">
                           <label className="form-label">Ad</label>
                           <input 
                             type="text" 
                             className="form-control" 
                             value={formData.firstName}
                             onChange={(e) => handleInputChange('firstName', e.target.value)}
                           />
                         </div>
                         
                         <div className="col-md-6 mb-3">
                           <label className="form-label">Soyad</label>
                           <input 
                             type="text" 
                             className="form-control" 
                             value={formData.lastName}
                             onChange={(e) => handleInputChange('lastName', e.target.value)}
                           />
                         </div>
                       </div>
                       
                       <div className="row">
                         <div className="col-md-6 mb-3">
                           <label className="form-label">Doğum Tarihi</label>
                           <input 
                             type="date" 
                             className="form-control" 
                             value={formData.birthDate}
                             onChange={(e) => handleInputChange('birthDate', e.target.value)}
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
                         <div className="col-md-6 mb-3">
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
                       </div>
                       
                       <div className="row">
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
                            id="hideAiRecommendations"
                            checked={formData.privacy.hideAiRecommendations}
                            onChange={(e) => handlePrivacyChange('hideAiRecommendations', e.target.checked)}
                          />
                          <label className="form-check-label" htmlFor="hideAiRecommendations">
                            Yapay Zeka Tahminlerini Gizle
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
                          <label className="form-label">
                            <i className="bi-palette me-2"></i>
                            Tema
                          </label>
                          <div className="theme-options">
                            <div 
                              className={`theme-option ${formData.preferences.theme === 'light' ? 'active' : ''}`}
                              onClick={() => handlePreferenceChange('theme', 'light')}
                            >
                              <div className="theme-preview light-theme">
                                <div className="preview-header"></div>
                                <div className="preview-content"></div>
                              </div>
                              <span>Açık Tema</span>
                            </div>
                            
                            <div 
                              className={`theme-option ${formData.preferences.theme === 'dark' ? 'active' : ''}`}
                              onClick={() => handlePreferenceChange('theme', 'dark')}
                            >
                              <div className="theme-preview dark-theme">
                                <div className="preview-header"></div>
                                <div className="preview-content"></div>
                              </div>
                              <span>Koyu Tema</span>
                            </div>
                            
                            <div 
                              className={`theme-option ${formData.preferences.theme === 'auto' ? 'active' : ''}`}
                              onClick={() => handlePreferenceChange('theme', 'auto')}
                            >
                              <div className="theme-preview auto-theme">
                                <div className="preview-header"></div>
                                <div className="preview-content"></div>
                              </div>
                              <span>Otomatik</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="col-md-6 mb-3">
                          <label className="form-label">
                            <i className="bi-translate me-2"></i>
                            Dil
                          </label>
                          <select 
                            className="form-control" 
                            value={formData.preferences.language}
                            onChange={(e) => handlePreferenceChange('language', e.target.value)}
                          >
                            <option value="tr">🇹🇷 Türkçe</option>
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