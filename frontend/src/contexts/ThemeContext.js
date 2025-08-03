import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    // Varsayılan olarak her zaman açık tema kullan
    // Eğer localStorage'da tema varsa ve 'light' ise kullan, değilse 'light' yap
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
      return savedTheme;
    }
    
    // localStorage'da tema yoksa veya 'dark' ise 'light' yap
    return 'light';
  });

  useEffect(() => {
    // Tema değişikliğini document'e uygula
    document.documentElement.setAttribute('data-theme', theme);
    
    // LocalStorage'a kaydet
    localStorage.setItem('theme', theme);
    
    console.log('DEBUG: Theme changed to:', theme);
  }, [theme]);

  // İlk yüklemede localStorage'da 'dark' tema varsa 'light' yap
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      localStorage.setItem('theme', 'light');
      setTheme('light');
    }
  }, []);

  // Sistem tema değişikliğini dinle (sadece auto modda)
  useEffect(() => {
    if (theme === 'auto') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      const handleChange = (e) => {
        const newTheme = e.matches ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', newTheme);
        console.log('DEBUG: System theme changed to:', newTheme);
      };
      
      mediaQuery.addEventListener('change', handleChange);
      
      // İlk yükleme için
      handleChange(mediaQuery);
      
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme]);

  const changeTheme = (newTheme) => {
    setTheme(newTheme);
  };

  const value = {
    theme,
    changeTheme
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}; 