import React from 'react';
import { Code2, Globe, Database, Terminal, Cpu } from 'lucide-react';
import { SKILLS } from '../data/resumeData.js';
import { useTranslation } from 'react-i18next';

const SkillCard = ({ title, icon, skills }) => (
  <div className="bg-white dark:bg-slate-800/50 p-6 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-500/50 transition-colors group">
    <div className="flex items-center gap-3 mb-4 text-blue-600 dark:text-blue-400 group-hover:text-blue-500 dark:group-hover:text-blue-300">
      {icon}
      <h3 className="font-semibold text-lg text-slate-900 dark:text-white">{title}</h3>
    </div>
    <div className="flex flex-wrap gap-2">
      {skills.map((skill, i) => (
        <span key={i} className="px-3 py-1.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm border border-slate-300 dark:border-slate-700 group-hover:border-slate-400 dark:group-hover:border-slate-600 transition-colors">
          {skill}
        </span>
      ))}
    </div>
  </div>
);

const Skills = () => {
  const { t } = useTranslation();

  const skillCategories = [
    { key: 'frontend', icon: <Globe className="w-6 h-6" />, skills: SKILLS.frontend },
    { key: 'backend', icon: <Database className="w-6 h-6" />, skills: SKILLS.backend },
    { key: 'devops', icon: <Terminal className="w-6 h-6" />, skills: SKILLS.devops },
    { key: 'testing', icon: <Cpu className="w-6 h-6" />, skills: SKILLS.testing },
    { key: 'other', icon: <Code2 className="w-6 h-6" />, skills: SKILLS.other },
  ];

  return (
    <section 
      id="skills" 
      className="py-20 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white relative overflow-hidden transition-colors duration-300"
    >
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 dark:bg-blue-500/5"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 dark:bg-cyan-500/5"></div>
        
        <div className="container mx-auto px-6 relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
            <h2 className="text-3xl font-bold flex items-center gap-3">
              <Code2 className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              {t('skills.title')}
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {skillCategories.map(category => (
              <SkillCard 
                key={category.key}
                title={t(`skills.categories.${category.key}`)}
                icon={category.icon} 
                skills={category.skills} 
              />
            ))}
          </div>
        </div>
    </section>
  );
};

export default Skills;