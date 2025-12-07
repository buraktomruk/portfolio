import React from 'react';
import { GraduationCap, MapPin } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const Education = () => {
  const { t } = useTranslation();

  return (
    <section id="education" className="py-20 bg-white dark:bg-slate-800/30">
      <div className="container mx-auto px-6">
        <h2 className="text-3xl font-bold mb-12 flex items-center gap-3">
          <GraduationCap className="w-8 h-8 text-blue-600" />
          {t('education.title')}
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="p-8 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:shadow-lg transition-shadow">
            <div className="text-sm font-semibold text-blue-600 dark:text-blue-400 mb-2">{t('education.tum.date')}</div>
            <h3 className="text-xl font-bold mb-2">{t('education.tum.university')}</h3>
            <div className="text-lg text-slate-700 dark:text-slate-300 mb-4">{t('education.tum.degree')}</div>
            <div className="text-slate-500 dark:text-slate-400 flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4" /> {t('education.tum.location')}
            </div>
          </div>

          <div className="p-8 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:shadow-lg transition-shadow">
            <div className="text-sm font-semibold text-blue-600 dark:text-blue-400 mb-2">{t('education.bogazici.date')}</div>
            <h3 className="text-xl font-bold mb-2">{t('education.bogazici.university')}</h3>
            <div className="text-lg text-slate-700 dark:text-slate-300 mb-4">{t('education.bogazici.degree')}</div>
            <div className="text-slate-500 dark:text-slate-400 flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4" /> {t('education.bogazici.location')}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Education;