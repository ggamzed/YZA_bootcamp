import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getCurrentUser } from '../api/auth';
import { updateProfilePicture, getAvailablePictures, setRandomPicture, getUserLevel } from '../api/profile';
import { useUser } from '../contexts/UserContext';
import Header from './Header';
import './Profile.css';

export default function Profile({ onLogout }) {
  const { token } = useUser();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [availablePictures, setAvailablePictures] = useState([]);
  const [showPictureSelector, setShowPictureSelector] = useState(false);
  const [updatingPicture, setUpdatingPicture] = useState(false);
  const [userLevel, setUserLevel] = useState(null);

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

  useEffect(() => {
    const fetchAvailablePictures = async () => {
      try {
        const data = await getAvailablePictures();
        setAvailablePictures(data.profile_pictures || []);
      } catch (error) {
        console.error('Profil resimleri alınamadı:', error);
        setAvailablePictures([]);
      }
    };
    fetchAvailablePictures();
  }, []);

  useEffect(() => {
    const fetchUserLevel = async () => {
      try {
        const levelData = await getUserLevel(token);
        setUserLevel(levelData);
      } catch (error) {
        console.error('Kullanıcı seviyesi alınamadı:', error);
      }
    };
    fetchUserLevel();
  }, [token]);

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    }
  };

  const handlePictureChange = async (pictureName) => {
    setUpdatingPicture(true);
    try {
      await updateProfilePicture(token, pictureName);
      // Kullanıcı bilgilerini yeniden yükle
      const userData = await getCurrentUser(token);
      setUser(userData);
      setShowPictureSelector(false);
    } catch (error) {
      console.error('Profil resmi güncellenemedi:', error);
      alert('Profil resmi güncellenirken bir hata oluştu.');
    } finally {
      setUpdatingPicture(false);
    }
  };

  const handleRandomPicture = async () => {
    setUpdatingPicture(true);
    try {
      await setRandomPicture(token);
      // Kullanıcı bilgilerini yeniden yükle
      const userData = await getCurrentUser(token);
      setUser(userData);
    } catch (error) {
      console.error('Rastgele profil resmi atanamadı:', error);
      alert('Rastgele profil resmi atanırken bir hata oluştu.');
    } finally {
      setUpdatingPicture(false);
    }
  };

  const getLevelColor = (levelId) => {
    switch (levelId) {
      case 1: return 'bg-secondary'; // Tembel Fil - Gri
      case 2: return 'bg-warning';   // Hızlı Karınca - Sarı
      case 3: return 'bg-success';   // Zıplayan Çekirge - Yeşil
      case 4: return 'bg-primary';   // Çalışkan Arı - Mavi
      default: return 'bg-secondary';
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
                        src={`http://localhost:8000/img/${user?.profile_picture || 'kurbaga.jpeg'}`}
                        className="img-fluid rounded-circle mb-3" 
                        alt="Profile" 
                        style={{ width: '150px', height: '150px', objectFit: 'cover' }}
                      />
                      <div className="d-grid gap-2">
                        <button 
                          className="btn btn-outline-primary btn-sm"
                          onClick={() => setShowPictureSelector(!showPictureSelector)}
                          disabled={updatingPicture}
                        >
                          <i className="bi-camera me-1"></i>
                          {updatingPicture ? 'Güncelleniyor...' : 'Fotoğraf Değiştir'}
                        </button>
                        <button 
                          className="btn btn-outline-secondary btn-sm"
                          onClick={handleRandomPicture}
                          disabled={updatingPicture}
                        >
                          <i className="bi-shuffle me-1"></i>
                          Rastgele Seç
                        </button>
                      </div>

                      {/* Profil Resmi Seçici */}
                      {showPictureSelector && (
                        <div className="mt-3 p-3 border rounded">
                          <h6 className="mb-3">Profil Resmi Seçin</h6>
                          <div className="row g-2">
                            {availablePictures && availablePictures.length > 0 ? (
                              availablePictures.map((picture) => (
                                <div key={picture} className="col-6">
                                  <div 
                                    className={`border rounded p-2 text-center cursor-pointer ${
                                      user?.profile_picture === picture ? 'border-primary bg-light' : ''
                                    }`}
                                    onClick={() => handlePictureChange(picture)}
                                    style={{ cursor: 'pointer' }}
                                  >
                                    <img 
                                      src={`http://localhost:8000/img/${picture}`}
                                      alt={picture}
                                      className="img-fluid rounded"
                                      style={{ width: '60px', height: '60px', objectFit: 'cover' }}
                                    />
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="col-12 text-center">
                                <p className="text-muted">Profil resimleri yükleniyor...</p>
                              </div>
                            )}
                          </div>
                          <button 
                            className="btn btn-sm btn-outline-secondary mt-2 w-100"
                            onClick={() => setShowPictureSelector(false)}
                          >
                            Kapat
                          </button>
                        </div>
                      )}
                    </div>
                    
                                         <div className="col-md-8">
                       <div className="row mb-3">
                         <div className="col-sm-3">
                           <label className="form-label fw-bold">Kullanıcı Adı:</label>
                         </div>
                         <div className="col-sm-9">
                           <p className="form-control-plaintext mb-0 text-start">{user?.username || 'Belirtilmemiş'}</p>
                         </div>
                       </div>
                       
                       <div className="row mb-3">
                         <div className="col-sm-3">
                           <label className="form-label fw-bold">E-posta:</label>
                         </div>
                         <div className="col-sm-9">
                           <p className="form-control-plaintext mb-0 text-start">{user?.email || 'Belirtilmemiş'}</p>
                         </div>
                       </div>
                       
                       <div className="row mb-3">
                         <div className="col-sm-3">
                           <label className="form-label fw-bold">Ad:</label>
                         </div>
                         <div className="col-sm-9">
                           <p className="form-control-plaintext mb-0 text-start">{user?.first_name || 'Belirtilmemiş'}</p>
                         </div>
                       </div>
                       
                       <div className="row mb-3">
                         <div className="col-sm-3">
                           <label className="form-label fw-bold">Soyad:</label>
                         </div>
                         <div className="col-sm-9">
                           <p className="form-control-plaintext mb-0 text-start">{user?.last_name || 'Belirtilmemiş'}</p>
                         </div>
                       </div>
                       
                       <div className="row mb-3">
                         <div className="col-sm-3">
                           <label className="form-label fw-bold">Doğum Tarihi:</label>
                         </div>
                         <div className="col-sm-9">
                           <p className="form-control-plaintext mb-0 text-start">
                             {user?.birth_date ? new Date(user.birth_date).toLocaleDateString('tr-TR') : 'Belirtilmemiş'}
                           </p>
                         </div>
                       </div>
                       
                       <div className="row mb-3">
                         <div className="col-sm-3">
                           <label className="form-label fw-bold">Seviye:</label>
                         </div>
                         <div className="col-sm-9">
                           {userLevel ? (
                             <div className="d-flex align-items-center">
                               <span className={`badge ${getLevelColor(userLevel.level_info.level_id)} me-3`}>
                                 {userLevel.level_info.level}
                               </span>
                               <small className="text-muted">
                                 {userLevel.level_info.total_questions} soru
                               </small>
                             </div>
                           ) : (
                             <span className="badge bg-secondary">Yükleniyor...</span>
                           )}
                         </div>
                       </div>
                       
                       <div className="row mb-3">
                         <div className="col-sm-3">
                           <label className="form-label fw-bold">Kayıt Tarihi:</label>
                         </div>
                         <div className="col-sm-9">
                           <p className="form-control-plaintext mb-0 text-start">
                             {user?.created_at ? new Date(user.created_at).toLocaleDateString('tr-TR', {
                               year: 'numeric',
                               month: 'long',
                               day: 'numeric'
                             }) : 'Belirtilmemiş'}
                           </p>
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
                        <span className="h3 text-primary">{userLevel?.level_info?.total_questions || 0}</span>
                      </div>
                      <small>Toplam Soru</small>
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
                      <small>Toplam Test</small>
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
