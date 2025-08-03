import React, { createContext, useContext, useState, useEffect } from 'react';

const UserContext = createContext();

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

const resetGlobalState = () => {
  if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
    const hook = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
    if (hook.renderers && hook.renderers.size > 0) {
      const renderer = hook.renderers.get(1);
      if (renderer && renderer.getFiberRoots) {
        const roots = renderer.getFiberRoots();
        roots.forEach(root => {
          if (root.current) {
            root.current = null;
          }
        });
      }
    }
  }
  
  const oldListeners = window.getEventListeners ? window.getEventListeners(window) : [];
  oldListeners.forEach(listener => {
    window.removeEventListener(listener.type, listener.listener);
  });
};

export const UserProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(null);
  const [resetKey, setResetKey] = useState(0);

  // Pomodoro state'leri
  const [pomodoroTime, setPomodoroTime] = useState(25 * 60); // 25 dakika (saniye cinsinden)
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [pomodoroCount, setPomodoroCount] = useState(0);
  const [currentSession, setCurrentSession] = useState('focus'); // 'focus' veya 'break'
  const [showFloatingPomodoro, setShowFloatingPomodoro] = useState(false);

  const clearAllCache = () => {
    localStorage.clear();
    
    sessionStorage.clear();
    
    if ('indexedDB' in window) {
      indexedDB.databases().then(databases => {
        databases.forEach(db => {
          indexedDB.deleteDatabase(db.name);
        });
      });
    }
    
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => {
          caches.delete(name);
        });
      });
    }
    
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        registrations.forEach(registration => {
          registration.unregister();
        });
      });
    }
    
    if ('clearStorageData' in window.chrome && window.chrome.storage) {
      window.chrome.storage.local.clear();
      window.chrome.storage.session.clear();
    }
    
    if ('fetch' in window) {
      const originalFetch = window.fetch;
      window.fetch = function(url, options = {}) {
        const separator = url.includes('?') ? '&' : '?';
        const cacheBuster = `_cb=${Date.now()}`;
        return originalFetch(`${url}${separator}${cacheBuster}`, options);
      };
    }
    
    resetGlobalState();
    
    if (document.body) {
      const scripts = document.querySelectorAll('script[src*="localhost"]');
      scripts.forEach(script => script.remove());
      
      const links = document.querySelectorAll('link[href*="localhost"]');
      links.forEach(link => link.remove());
    }
    
    setResetKey(prev => prev + 1);
  };

  useEffect(() => {
    console.log('DEBUG: Token changed in UserContext:', token ? 'Token exists' : 'No token');
    if (token) {
      localStorage.setItem('token', token);
    } else {
      clearAllCache();
      setUser(null);
    }
  }, [token]);

  const login = (newToken) => {
    console.log('DEBUG: Login called with token:', newToken ? 'Token exists' : 'No token');
    clearAllCache();
    
    setToken(newToken);
    
    setTimeout(() => {
      window.location.reload();
    }, 100);
  };

  // Pomodoro fonksiyonları
  const startPomodoro = () => {
    setIsRunning(true);
    setShowFloatingPomodoro(true);
    // Bildirim izni iste
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  };

  const pausePomodoro = () => {
    setIsRunning(false);
  };

  const resetPomodoro = () => {
    setIsRunning(false);
    setPomodoroTime(25 * 60);
    setCurrentSession('focus');
    setIsBreak(false);
    // NOT: showFloatingPomodoro'yu sıfırlamıyoruz
  };

  const closeFloatingPomodoro = () => {
    setShowFloatingPomodoro(false);
  };

  const logout = () => {
    console.log('DEBUG: Logout called');
    setToken('');
    setUser(null);
    
    // Pomodoro'yu da sıfırla
    resetPomodoro();
    
    clearAllCache();
    
    setTimeout(() => {
      window.location.reload();
    }, 100);
  };

  // Pomodoro tamamlandığında çalışan fonksiyon
  const handlePomodoroComplete = () => {
    if (currentSession === 'focus') {
      const newCount = pomodoroCount + 1;
      setPomodoroCount(newCount);
      
      // 4 pomodoro sonrasında uzun mola, aksi halde kısa mola
      if (newCount % 4 === 0) {
        setPomodoroTime(20 * 60); // 20 dakika uzun mola
        setCurrentSession('longBreak');
      } else {
        setPomodoroTime(5 * 60); // 5 dakika kısa mola
        setCurrentSession('shortBreak');
      }
      setIsBreak(true);
    } else {
      // Mola bitti, tekrar odaklanma zamanı
      setPomodoroTime(25 * 60); // 25 dakika odaklanma
      setCurrentSession('focus');
      setIsBreak(false);
    }
    
    // Tarayıcı bildirimi (izin varsa)
    if (Notification.permission === 'granted') {
      new Notification('Pomodoro Zamanlayıcısı', {
        body: currentSession === 'focus' ? 'Mola zamanı!' : 'Çalışma zamanı!',
        icon: '/favicon.png'
      });
    }
  };

  // Pomodoro zamanlayıcısı useEffect
  useEffect(() => {
    let interval = null;
    
    if (isRunning && pomodoroTime > 0) {
      interval = setInterval(() => {
        setPomodoroTime(time => time - 1);
      }, 1000);
    } else if (pomodoroTime === 0) {
      setIsRunning(false);
      handlePomodoroComplete();
    }
    
    return () => clearInterval(interval);
  }, [isRunning, pomodoroTime, currentSession, pomodoroCount]);

  // Süreyi formatla (mm:ss)
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Progress yüzdesi hesapla
  const getProgressPercentage = () => {
    let totalTime;
    if (currentSession === 'focus') {
      totalTime = 25 * 60;
    } else if (currentSession === 'shortBreak') {
      totalTime = 5 * 60;
    } else {
      totalTime = 20 * 60;
    }
    return ((totalTime - pomodoroTime) / totalTime) * 100;
  };

  const value = {
    token,
    user,
    setUser,
    login,
    logout,
    clearAllCache,
    resetKey,
    // Pomodoro state'leri
    pomodoroTime,
    isRunning,
    isBreak,
    pomodoroCount,
    currentSession,
    showFloatingPomodoro,
    // Pomodoro fonksiyonları
    startPomodoro,
    pausePomodoro,
    resetPomodoro,
    closeFloatingPomodoro,
    setShowFloatingPomodoro,
    formatTime,
    getProgressPercentage
  };

  return (
    <UserContext.Provider value={value}>
      <div key={resetKey}>
        {children}
      </div>
    </UserContext.Provider>
  );
}; 