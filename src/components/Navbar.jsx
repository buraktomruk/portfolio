import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const Navbar = ({ isScrolled, scrollToSection, darkMode, toggleDarkMode, changeLanguage, currentLang }) => {
  const { t } = useTranslation();

  return (
    <nav className={`fixed w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-white/90 dark:bg-slate-900/90 backdrop-blur-md shadow-sm py-4' : 'bg-transparent py-6'}`}>
      <div className="container mx-auto px-6 flex justify-between items-center">
        <div className="text-xl font-bold tracking-tighter bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
          BT
        </div>
        
        <div className="flex items-center gap-6">
          <div className="hidden md:flex space-x-8 text-sm font-medium">
            {['about', 'skills', 'education', 'projects'].map((id) => (
              <button 
                key={id}
                onClick={() => scrollToSection(id)}
                className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                {t(`navbar.${id}`)}
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-2 text-sm">
            <button 
              onClick={() => changeLanguage('en')}
              className={`font-medium ${currentLang === 'en' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400'} transition-colors`}
            >
              EN
            </button>
            <span className="text-slate-400 dark:text-slate-600">|</span>
            <button 
              onClick={() => changeLanguage('de')}
              className={`font-medium ${currentLang === 'de' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400'} transition-colors`}
            >
              DE
            </button>
          </div>
          
          <button 
            onClick={toggleDarkMode}
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-400"
            aria-label="Toggle Dark Mode"
          >
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
