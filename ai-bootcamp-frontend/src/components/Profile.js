import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getCurrentUser } from '../api/auth';
import './Profile.css';

export default function Profile({ token, setToken }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await getCurrentUser(token);
        setUser(userData);
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
                  <Link className="nav-link active" to="/profile">
                    <i className="bi-person me-2"></i>
                    Profil
                  </Link>
                </li>

                <li className="nav-item">
                  <Link className="nav-link" to="/settings">
                    <i className="bi-gear me-2"></i>
                    Ayarlar
                  </Link>
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
              <h1 className="h2 mb-0">Profil</h1>
              <small className="text-muted">Kişisel bilgilerinizi görüntüleyin ve yönetin</small>
            </div>

            <div className="row">
              <div className="col-lg-8">
                <div className="custom-block bg-white">
                  <h5 className="mb-4">Kullanıcı Bilgileri</h5>
                  
                  <div className="row">
                    <div className="col-md-4 text-center mb-4">
                      <img 
                        src="https://via.placeholder.com/150x150/007bff/ffffff?text=U" 
                        className="img-fluid rounded-circle mb-3" 
                        alt="Profile" 
                        style={{ width: '150px', height: '150px' }}
                      />
                      <button className="btn btn-outline-primary btn-sm">
                        <i className="bi-camera me-1"></i>
                        Fotoğraf Değiştir
                      </button>
                    </div>
                    
                    <div className="col-md-8">
                      <div className="row mb-3">
                        <div className="col-sm-4">
                          <label className="form-label fw-bold">Kullanıcı Adı:</label>
                        </div>
                        <div className="col-sm-8">
                          <p className="form-control-plaintext">{user?.username || 'Belirtilmemiş'}</p>
                        </div>
                      </div>
                      
                      <div className="row mb-3">
                        <div className="col-sm-4">
                          <label className="form-label fw-bold">E-posta:</label>
                        </div>
                        <div className="col-sm-8">
                          <p className="form-control-plaintext">{user?.email || 'Belirtilmemiş'}</p>
                        </div>
                      </div>
                      
                      <div className="row mb-3">
                        <div className="col-sm-4">
                          <label className="form-label fw-bold">Üyelik Durumu:</label>
                        </div>
                        <div className="col-sm-8">
                          <span className="badge bg-success">Aktif</span>
                        </div>
                      </div>
                      
                      <div className="row mb-3">
                        <div className="col-sm-4">
                          <label className="form-label fw-bold">Üyelik Türü:</label>
                        </div>
                        <div className="col-sm-8">
                          <span className="badge bg-primary">Ücretsiz Üye</span>
                        </div>
                      </div>
                      
                      <div className="row mb-3">
                        <div className="col-sm-4">
                          <label className="form-label fw-bold">Kayıt Tarihi:</label>
                        </div>
                        <div className="col-sm-8">
                          <p className="form-control-plaintext">2024</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="custom-block bg-white mt-4">
                  <h5 className="mb-4">Hızlı İstatistikler</h5>
                  
                  <div className="row text-center">
                    <div className="col-md-3 mb-3">
                      <div className="custom-block-numbers">
                        <span className="h3 text-primary">0</span>
                      </div>
                      <small>Toplam Test</small>
                    </div>
                    
                    <div className="col-md-3 mb-3">
                      <div className="custom-block-numbers">
                        <span className="h3 text-success">0%</span>
                      </div>
                      <small>Başarı Oranı</small>
                    </div>
                    
                    <div className="col-md-3 mb-3">
                      <div className="custom-block-numbers">
                        <span className="h3 text-info">0</span>
                      </div>
                      <small>Çözülen Soru</small>
                    </div>
                    
                    <div className="col-md-3 mb-3">
                      <div className="custom-block-numbers">
                        <span className="h3 text-warning">0</span>
                      </div>
                      <small>Aktif Gün</small>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-lg-4">
                <div className="custom-block bg-white">
                  <h5 className="mb-4">Hızlı Erişim</h5>
                  
                  <div className="d-grid gap-2">
                    <Link to="/home" className="btn btn-outline-primary">
                      <i className="bi-house me-2"></i>
                      Ana Sayfa
                    </Link>
                    
                    <Link to="/statistics" className="btn btn-outline-success">
                      <i className="bi-graph-up me-2"></i>
                      İstatistikler
                    </Link>
                    
                    <Link to="/completed-tests" className="btn btn-outline-info">
                      <i className="bi-file-text me-2"></i>
                      Testler
                    </Link>
                    
                    <Link to="/settings" className="btn btn-outline-secondary">
                      <i className="bi-gear me-2"></i>
                      Ayarlar
                    </Link>
                  </div>
                </div>

                <div className="custom-block bg-white mt-4">
                  <h5 className="mb-4">Son Aktiviteler</h5>
                  
                  <div className="text-center py-3">
                    <p className="text-muted mb-0">Henüz aktivite yok</p>
                    <small>Test çözmeye başlayın!</small>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
