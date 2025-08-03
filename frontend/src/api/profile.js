const API_BASE_URL = 'http://localhost:8000';

export const getUserLevel = async (token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/profile/level`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Kullanıcı seviyesi alınamadı');
    }

    return await response.json();
  } catch (error) {
    console.error('Kullanıcı seviyesi alma hatası:', error);
    throw error;
  }
};

export const updateProfilePicture = async (token, pictureName) => {
  try {
    const response = await fetch(`${API_BASE_URL}/profile/picture?picture_name=${pictureName}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Profil resmi güncellenemedi');
    }

    return await response.json();
  } catch (error) {
    console.error('Profil resmi güncelleme hatası:', error);
    throw error;
  }
};

export const getAvailablePictures = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/profile/pictures`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Profil resimleri alınamadı');
    }

    return await response.json();
  } catch (error) {
    console.error('Profil resimleri alma hatası:', error);
    throw error;
  }
};

export const setRandomPicture = async (token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/profile/picture/random`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Rastgele profil resmi atanamadı');
    }

    return await response.json();
  } catch (error) {
    console.error('Rastgele profil resmi atama hatası:', error);
    throw error;
  }
}; 