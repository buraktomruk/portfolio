import React from 'react';
import { Code2, Globe, Database, Terminal } from 'lucide-react';
import { SKILLS } from '../data/resumeData.js';
import { useTranslation } from 'react-i18next';

const SkillGroup = ({ title, icon, skills }) => (
  <div className="border-t border-slate-200 py-5 dark:border-white/10">
    <div className="mb-3 flex items-center gap-3 text-blue-600 dark:text-blue-400">
      {icon}
      <h3 className="font-semibold text-base text-slate-900 dark:text-white">{title}</h3>
    </div>
    <div className="flex flex-wrap gap-2 pl-9">
      {skills.map((skill, i) => (
        <span key={i} className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 dark:bg-white/[0.06] dark:text-slate-300">
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
    { key: 'delivery', icon: <Terminal className="w-6 h-6" />, skills: [...SKILLS.devops, ...SKILLS.testing] },
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
          <div className="mb-8 flex flex-col items-start gap-6 md:flex-row md:items-end md:justify-between">
            <h2 className="text-3xl font-bold flex items-center gap-3">
              <Code2 className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              {t('skills.title')}
            </h2>
          </div>
          
          <div className="grid grid-cols-1 gap-x-10 md:grid-cols-3">
            {skillCategories.map(category => (
              <SkillGroup
                key={category.key}
                title={t(`skills.groups.${category.key}`)}
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
