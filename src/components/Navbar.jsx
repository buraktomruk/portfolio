import React from 'react';
import { Menu, Moon, Sun, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useEffect, useRef, useState } from 'react';

const Navbar = ({ isScrolled, scrollToSection, darkMode, toggleDarkMode, changeLanguage, currentLang }) => {
  const { t } = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuButtonRef = useRef(null);
  const firstMenuItemRef = useRef(null);
  const menuRef = useRef(null);

  const sectionIds = ['about', 'projects', 'skills', 'education'];

  useEffect(() => {
    if (isMenuOpen) {
      firstMenuItemRef.current?.focus();
    }
  }, [isMenuOpen]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && isMenuOpen) {
        setIsMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    };

    const handlePointerDown = (event) => {
      const clickedOutsideMenu =
        menuRef.current &&
        !menuRef.current.contains(event.target);
      const clickedOutsideButton =
        menuButtonRef.current &&
        !menuButtonRef.current.contains(event.target);

      if (isMenuOpen && clickedOutsideMenu && clickedOutsideButton) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('pointerdown', handlePointerDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [isMenuOpen]);

  const handleSectionClick = (id) => {
    scrollToSection(id);
    setIsMenuOpen(false);
    menuButtonRef.current?.focus();
  };

  return (
    <nav className={`fixed w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-white/90 dark:bg-slate-900/90 backdrop-blur-md shadow-sm py-4' : 'bg-transparent py-6'}`}>
      <div className="container mx-auto px-6 flex justify-between items-center">
        <button
          type="button"
          onClick={() => scrollToSection('home')}
          className="rounded-md text-xl font-bold tracking-tighter bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-500"
          aria-label="Burak Tomruk — home"
        >
          BT
        </button>
        
        <div className="flex items-center gap-6">
          <div className="hidden md:flex space-x-8 text-sm font-medium">
            {sectionIds.map((id) => (
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
            className="rounded-full p-2 text-slate-600 transition-colors hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 dark:text-slate-400 dark:hover:bg-slate-800"
            aria-label={t(darkMode ? 'navbar.themeLight' : 'navbar.themeDark')}
          >
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          <button
            ref={menuButtonRef}
            type="button"
            onClick={() => setIsMenuOpen((open) => !open)}
            className="rounded-md p-2 text-slate-600 transition-colors hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 dark:text-slate-400 dark:hover:bg-slate-800 md:hidden"
            aria-expanded={isMenuOpen}
            aria-controls="mobile-navigation"
            aria-label={t(isMenuOpen ? 'navbar.closeMenu' : 'navbar.openMenu')}
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {isMenuOpen && (
        <div ref={menuRef} id="mobile-navigation" className="border-t border-slate-200/80 bg-white/95 px-6 py-4 shadow-lg backdrop-blur-md dark:border-white/10 dark:bg-slate-900/95 md:hidden">
          <div className="container mx-auto flex flex-col gap-1">
            {sectionIds.map((id, index) => (
              <button
                key={id}
                ref={index === 0 ? firstMenuItemRef : undefined}
                type="button"
                onClick={() => handleSectionClick(id)}
                className="rounded-lg px-3 py-3 text-left text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 hover:text-blue-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 dark:text-slate-200 dark:hover:bg-white/10 dark:hover:text-blue-300"
              >
                {t(`navbar.${id}`)}
              </button>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
