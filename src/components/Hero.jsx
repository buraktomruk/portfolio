import React from 'react';
import { Github, Linkedin, Mail, Download, BookOpen, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const Hero = () => {
  const { t } = useTranslation();

  return (
    <header id="home" className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
      <div className="absolute top-0 right-0 -z-10 opacity-10 dark:opacity-5">
         <svg width="800" height="800" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
           <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="0.5" fill="none" />
           <circle cx="50" cy="50" r="30" stroke="currentColor" strokeWidth="0.5" fill="none" />
           <circle cx="50" cy="50" r="20" stroke="currentColor" strokeWidth="0.5" fill="none" />
         </svg>
      </div>
      
      <div className="container mx-auto px-6">
        <div className="max-w-4xl">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 text-xs font-semibold tracking-wide uppercase mb-6">
            {t('hero.role')}
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 text-slate-900 dark:text-white">
            {t('hero.greeting')} <span className="text-blue-600 dark:text-blue-400">Burak Tomruk</span>.
          </h1>
          <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl mb-10">
            {t('hero.tagline1')} <span className="text-slate-900 dark:text-slate-200 font-medium">{t('hero.tagline2')}</span>.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 mb-10">
             <a 
               href="/resume.pdf" 
               target="_blank"
               rel="noopener noreferrer"
               className="flex items-center justify-center gap-3 px-8 py-4 rounded-full bg-slate-900 text-white font-medium hover:bg-blue-600 transition-all shadow-lg hover:shadow-blue-500/25 dark:bg-white dark:text-slate-900 dark:hover:bg-blue-400 group"
             >
               <Download className="w-5 h-5 group-hover:scale-110 transition-transform" />
               <span>{t('hero.download_resume')}</span>
             </a>
             
             <a 
               href="/thesis.pdf" 
               target="_blank"
               rel="noopener noreferrer"
               className="flex items-center justify-center gap-3 px-8 py-4 rounded-full bg-white text-slate-900 font-medium hover:bg-slate-50 transition-all border-2 border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700 group"
             >
               <BookOpen className="w-5 h-5 group-hover:scale-110 transition-transform text-blue-600 dark:text-blue-400" />
               <span>{t('hero.check_thesis')}</span>
             </a>
          </div>

          <div className="pt-8 border-t border-slate-200 dark:border-slate-800">
            <div className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">{t('hero.connect')}</div>
            <div className="flex flex-wrap gap-4">
              <a href="https://github.com/buraktomruk" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-black hover:text-black dark:hover:border-white dark:hover:text-white transition-all shadow-sm group">
                <Github className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span className="font-medium">GitHub</span>
              </a>
              <a href="https://www.linkedin.com/in/burak-tomruk-845848138/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-[#0077b5] hover:text-[#0077b5] dark:hover:text-[#0077b5] dark:hover:border-[#0077b5] transition-all shadow-sm group">
                <Linkedin className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span className="font-medium">LinkedIn</span>
              </a>
              <a href="mailto:burak.tomruk95@gmail.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-[#EA4335] hover:text-[#EA4335] dark:hover:text-[#EA4335] dark:hover:border-[#EA4335] transition-all shadow-sm group">
                <Mail className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span className="font-medium">Email</span>
              </a>
            </div>
          </div>
        </div>
      </div>
      
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce text-slate-400">
        <ChevronDown className="w-6 h-6" />
      </div>
    </header>
  );
};

export default Hero;