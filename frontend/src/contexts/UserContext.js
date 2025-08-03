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

  const logout = () => {
    console.log('DEBUG: Logout called');
    setToken('');
    setUser(null);
    
    clearAllCache();
    
    setTimeout(() => {
      window.location.reload();
    }, 100);
  };

  const value = {
    token,
    user,
    setUser,
    login,
    logout,
    clearAllCache,
    resetKey
  };

  return (
    <UserContext.Provider value={value}>
      <div key={resetKey}>
        {children}
      </div>
    </UserContext.Provider>
  );
}; 