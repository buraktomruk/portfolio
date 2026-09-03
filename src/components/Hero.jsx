import React from 'react';
import { Github, Linkedin, Mail, Download, ArrowDownRight } from 'lucide-react';
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
        <div className="max-w-3xl">
          <p className="mb-5 text-sm font-semibold uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400">
            {t('hero.role')}
          </p>
          <h1 className="max-w-4xl text-5xl font-bold leading-[0.98] tracking-[-0.06em] text-slate-950 dark:text-white sm:text-6xl md:text-8xl">
            {t('hero.name')}
          </h1>
          <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-300 sm:text-xl">
            {t('hero.tagline1')}
          </p>
          <p className="mt-4 text-sm font-medium text-slate-500 dark:text-slate-400">{t('hero.location')}</p>
          
          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
             <a
               href="#projects"
               className="group inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-slate-950/10 transition-all hover:-translate-y-0.5 hover:bg-blue-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 dark:bg-white dark:text-slate-950 dark:hover:bg-blue-300"
             >
               {t('hero.view_projects')}
               <ArrowDownRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:translate-y-0.5" aria-hidden="true" />
             </a>
             <a
               href="/resume.pdf"
               target="_blank"
               rel="noopener noreferrer"
               className="inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold text-slate-700 transition-colors hover:text-blue-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 dark:text-slate-200 dark:hover:text-blue-300"
             >
               <Download className="h-4 w-4" aria-hidden="true" />
               <span>{t('hero.download_resume')}</span>
             </a>
          </div>

          <div className="mt-12 flex flex-wrap gap-x-6 gap-y-3 border-t border-slate-200/80 pt-6 dark:border-white/10">
              <a href="https://github.com/buraktomruk" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition-colors hover:text-slate-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-500 dark:text-slate-400 dark:hover:text-white">
                <Github className="h-4 w-4" aria-hidden="true" />
                <span>GitHub</span>
              </a>
              <a href="https://www.linkedin.com/in/burak-tomruk-845848138/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition-colors hover:text-slate-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-500 dark:text-slate-400 dark:hover:text-white">
                <Linkedin className="h-4 w-4" aria-hidden="true" />
                <span className="font-medium">LinkedIn</span>
              </a>
              <a href="mailto:burak.tomruk95@gmail.com" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition-colors hover:text-slate-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-500 dark:text-slate-400 dark:hover:text-white">
                <Mail className="h-4 w-4" aria-hidden="true" />
                <span>{t('hero.send_message')}</span>
              </a>
          </div>
        </div>
      </div>
      
    </header>
  );
};

export default Hero;
