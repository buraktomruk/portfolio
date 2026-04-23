import React from 'react';
import { User, MapPin, Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const About = () => {
  const { t } = useTranslation();

  return (
    <section id="about" className="py-20 bg-white dark:bg-slate-800/50">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row gap-12 items-start">
          <div className="md:w-1/3">
            <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
              <User className="w-8 h-8 text-blue-600" />
              {t('about.title')}
            </h2>
            <div className="aspect-square rounded-2xl overflow-hidden bg-slate-200 dark:bg-slate-700 relative shadow-xl -rotate-3 hover:rotate-0 transition-transform duration-500 border-4 border-white dark:border-slate-600">
              <img
                src="/ai_burak.JPG"
                alt="Burak Tomruk"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "/ai_burak_maskable.png";
                }}
              />
            </div>
          </div>
          <div className="md:w-2/3">
            <p className="text-lg leading-relaxed text-slate-600 dark:text-slate-300 mb-6">
              {t('about.p1')}
            </p>
            <p className="text-lg leading-relaxed text-slate-600 dark:text-slate-300 mb-6">
              {t('about.p2')}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
              <div className="flex items-center gap-3 p-4 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                <MapPin className="text-blue-500" />
                <div>
                  <div className="text-xs text-slate-500 uppercase font-semibold">{t('about.location_title')}</div>
                  <div className="font-medium">{t('about.location')}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                <Globe className="text-blue-500" />
                <div>
                  <div className="text-xs text-slate-500 uppercase font-semibold">{t('about.languages_title')}</div>
                  <div className="font-medium">{t('about.languages')}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
