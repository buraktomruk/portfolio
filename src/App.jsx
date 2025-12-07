import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import About from './components/About';
import Skills from './components/Skills';
import Education from './components/Education';
import Footer from './components/Footer';
import AIChatWidget from './components/AIChatWidget';
import BackToTopButton from './components/BackToTopButton';
import { useTranslation } from 'react-i18next';

const App = () => {
  const { i18n } = useTranslation();
  const [currentLang, setCurrentLang] = useState(i18n.language);
  
  const [isScrolled, setIsScrolled] = useState(false);
  
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' ||
        (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const changeLanguage = (lang) => {
    i18n.changeLanguage(lang);
    setCurrentLang(lang);
  };

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-100 dark:bg-slate-900 dark:text-slate-100 dark:selection:bg-blue-900 transition-colors duration-300">
      <Navbar 
        isScrolled={isScrolled} 
        scrollToSection={scrollToSection} 
        darkMode={darkMode} 
        toggleDarkMode={toggleDarkMode} 
        changeLanguage={changeLanguage}
        currentLang={currentLang}
      />
      <Hero />
      <About />
      <Skills />
      <Education />
      <Footer />
      <AIChatWidget />
      <BackToTopButton />
    </div>
  );
};

export default App;