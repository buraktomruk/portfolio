import React from 'react';
import { Github, Linkedin, Mail } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const SocialLink = ({ href, icon, label }) => (
  <a 
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className="p-2 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 dark:hover:text-white transition-all"
    aria-label={label}
  >
    {icon}
  </a>
);

const Footer = () => {
  const { t } = useTranslation();

  return (
    <footer className="py-12 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
      <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="text-center md:text-left">
          <div className="text-2xl font-bold tracking-tighter text-slate-900 dark:text-white mb-2">Burak Tomruk</div>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            © 2025 {t('footer.all_rights_reserved')}
          </p>
        </div>
        
        <div className="flex gap-6">
          <SocialLink href="https://github.com/buraktomruk" icon={<Github className="w-5 h-5" />} label="GitHub" />
          <SocialLink href="https://www.linkedin.com/in/burak-tomruk-845848138/" icon={<Linkedin className="w-5 h-5" />} label="LinkedIn" />
          <SocialLink href="mailto:burak.tomruk95@gmail.com" icon={<Mail className="w-5 h-5" />} label="Email" />
        </div>
      </div>
    </footer>
  );
};

export default Footer;