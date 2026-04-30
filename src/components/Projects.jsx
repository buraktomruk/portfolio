import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Activity, ArrowUpRight, ChevronDown, Circle, FolderGit2, Star } from 'lucide-react';
import { featuredWorkItems } from '../data/featuredWork.js';
import { useGithubResource } from '../hooks/useGithubResource.js';
import {
  getGithubProfileUrl,
  GITHUB_PROJECTS_ENDPOINT,
  GITHUB_STATS_ENDPOINT,
  GITHUB_ACTIVITY_ENDPOINT,
  isGithubActivityEnvelope,
  isGithubProjectsEnvelope,
  isGithubStatsEnvelope,
} from '../shared/githubStats.js';

const LANGUAGE_COLORS = {
  JavaScript: 'text-yellow-300',
  TypeScript: 'text-blue-300',
  Python: 'text-sky-300',
  Java: 'text-orange-300',
  'C++': 'text-pink-300',
  Ruby: 'text-red-300',
  Go: 'text-cyan-300',
  Rust: 'text-orange-200',
  HTML: 'text-orange-300',
  CSS: 'text-blue-300',
  Vue: 'text-emerald-300',
  Swift: 'text-orange-300',
  Dart: 'text-cyan-300',
  PHP: 'text-indigo-300',
};

const ACCENT_STYLES = {
  emerald: {
    card: 'from-emerald-500/8 via-transparent to-transparent dark:from-emerald-500/10 dark:via-transparent dark:to-transparent',
    badge: 'bg-emerald-500/10 text-emerald-700 ring-emerald-500/20 dark:text-emerald-300',
    accentText: 'text-emerald-600 dark:text-emerald-400',
    chip: 'border-emerald-500/15 bg-emerald-500/10 text-emerald-700 dark:border-emerald-400/15 dark:bg-emerald-400/10 dark:text-emerald-100',
    topLine: 'from-transparent via-emerald-500/35 to-transparent dark:via-emerald-400/40',
    hoverText: 'hover:text-emerald-700 dark:hover:text-emerald-300',
    hoverBorder: 'group-hover/link:border-emerald-500/60 dark:group-hover/link:border-emerald-300/60',
    logoRing: 'ring-emerald-500/15 dark:ring-emerald-400/20',
  },
  violet: {
    card: 'from-violet-500/8 via-transparent to-transparent dark:from-violet-500/10 dark:via-transparent dark:to-transparent',
    badge: 'bg-violet-500/10 text-violet-700 ring-violet-500/20 dark:text-violet-300',
    accentText: 'text-violet-600 dark:text-violet-400',
    chip: 'border-violet-500/15 bg-violet-500/10 text-violet-700 dark:border-violet-400/15 dark:bg-violet-400/10 dark:text-violet-100',
    topLine: 'from-transparent via-violet-500/35 to-transparent dark:via-violet-400/40',
    hoverText: 'hover:text-violet-700 dark:hover:text-violet-300',
    hoverBorder: 'group-hover/link:border-violet-500/60 dark:group-hover/link:border-violet-300/60',
    logoRing: 'ring-violet-500/15 dark:ring-violet-400/20',
  },
  cyan: {
    card: 'from-cyan-500/8 via-transparent to-transparent dark:from-cyan-500/10 dark:via-transparent dark:to-transparent',
    badge: 'bg-cyan-500/10 text-cyan-700 ring-cyan-500/20 dark:text-cyan-300',
    accentText: 'text-cyan-700 dark:text-cyan-400',
    chip: 'border-cyan-500/15 bg-cyan-500/10 text-cyan-700 dark:border-cyan-400/15 dark:bg-cyan-400/10 dark:text-cyan-100',
    topLine: 'from-transparent via-cyan-500/35 to-transparent dark:via-cyan-400/40',
    hoverText: 'hover:text-cyan-700 dark:hover:text-cyan-300',
    hoverBorder: 'group-hover/link:border-cyan-500/60 dark:group-hover/link:border-cyan-300/60',
    logoRing: 'ring-cyan-500/15 dark:ring-cyan-400/20',
  },
  indigo: {
    card: 'from-indigo-500/8 via-transparent to-transparent dark:from-indigo-500/12 dark:via-transparent dark:to-transparent',
    badge: 'bg-indigo-500/10 text-indigo-700 ring-indigo-500/20 dark:text-indigo-300',
    accentText: 'text-indigo-700 dark:text-indigo-400',
    chip: 'border-indigo-500/15 bg-indigo-500/10 text-indigo-700 dark:border-indigo-400/15 dark:bg-indigo-400/10 dark:text-indigo-100',
    topLine: 'from-transparent via-indigo-500/35 to-transparent dark:via-indigo-400/40',
    hoverText: 'hover:text-indigo-700 dark:hover:text-indigo-300',
    hoverBorder: 'group-hover/link:border-indigo-500/60 dark:group-hover/link:border-indigo-300/60',
    logoRing: 'ring-indigo-500/15 dark:ring-indigo-400/20',
  },
};

function getAccentStyles(accent) {
  return ACCENT_STYLES[accent] ?? ACCENT_STYLES.emerald;
}

function ShowcaseCard({ item, t }) {
  const accentStyles = getAccentStyles(item.accent);

  const statusLabel = t(`projects.statusLabels.${item.statusKey}`, { defaultValue: '' });
  const typeLabel = t(`projects.caseStudies.${item.id}.typeLabel`, { defaultValue: '' });
  const summary = t(`projects.caseStudies.${item.id}.summary`, { defaultValue: '' });
  const readinessNote = t(`projects.caseStudies.${item.id}.readinessNote`, { defaultValue: '' });
  const highlightItems = t(`projects.caseStudies.${item.id}.highlights`, {
    returnObjects: true,
    defaultValue: [],
  });
  const highlights = Array.isArray(highlightItems) ? highlightItems : [];

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white/90 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.24)] transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-300 dark:border-white/10 dark:bg-slate-900/55 dark:shadow-[0_24px_80px_-48px_rgba(15,23,42,0.95)] dark:hover:border-white/20">
      <div className={`pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r ${accentStyles.topLine}`} />
      <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br opacity-50 ${accentStyles.card}`} />
      <div className="pointer-events-none absolute inset-x-6 bottom-0 h-px bg-slate-200/70 dark:bg-white/5" />

      <div className="relative z-10 flex flex-1 flex-col p-6 sm:p-7">
        <div className="flex items-start justify-between gap-4">
          {statusLabel ? (
            <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.18em] ring-1 backdrop-blur-sm ${accentStyles.badge}`}>
              {statusLabel}
            </span>
          ) : (
            <span aria-hidden="true" />
          )}
          {item.logoSrc && (
            <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-[1.35rem] ring-1 shadow-[0_18px_40px_-24px_rgba(15,23,42,0.35)] dark:shadow-[0_18px_40px_-24px_rgba(15,23,42,0.95)] ${item.logoTileClass || 'bg-slate-100 dark:bg-slate-950/80'} ${accentStyles.logoRing}`}>
              <img
                src={item.logoSrc}
                alt={`${item.title} logo`}
                loading="lazy"
                className={item.logoClass || 'h-12 w-12 object-contain'}
              />
            </div>
          )}
        </div>

        <div className="mt-6">
          <h3 className="text-xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-[1.45rem]">
            {item.title}
          </h3>
          {typeLabel && (
            <p className={`mt-2 text-[11px] font-semibold uppercase tracking-[0.22em] ${accentStyles.accentText}`}>
              {typeLabel}
            </p>
          )}
        </div>

        {summary && (
          <p className="mt-4 max-w-[34ch] text-sm leading-6 text-slate-600 dark:text-slate-300">
            {summary}
          </p>
        )}

        {highlights.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-2.5">
            {highlights.slice(0, 3).map((highlight) => (
              <span
                key={highlight}
                className={`inline-flex items-center rounded-full border px-3 py-1.5 text-[11px] font-medium tracking-[0.01em] ${accentStyles.chip}`}
              >
                {highlight}
              </span>
            ))}
          </div>
        )}

        <div className="mt-auto flex items-end justify-between gap-4 border-t border-slate-200/80 pt-6 dark:border-white/5">
          <div className="min-w-0">
            {readinessNote && (
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-500">
                {readinessNote}
              </p>
            )}
          </div>
          {item.demoUrl && (
            <a
              href={item.demoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`group/link inline-flex shrink-0 items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50/90 px-3 py-2 text-[11px] font-semibold text-slate-600 transition-colors dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-300 ${accentStyles.hoverText}`}
            >
              <span className={`border-b border-dashed border-slate-400 pb-px transition-colors dark:border-slate-600 ${accentStyles.hoverBorder}`}>
                {t('projects.previewBuild')}
              </span>
              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
          )}
        </div>
      </div>
    </article>
  );
}

function SectionHeader({ 
  title, 
  isExpanded, 
  onToggle, 
  summary, 
  id,
  showLabel,
  hideLabel
}) {
  return (
    <div className="border-b border-slate-200 dark:border-white/5 pb-6">
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-xl font-bold text-slate-950 dark:text-white">{title}</h3>
        <button
          type="button"
          aria-expanded={isExpanded}
          aria-controls={id}
          onClick={onToggle}
          className="flex items-center gap-2 text-sm font-bold text-slate-500 transition-colors hover:text-slate-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-500 dark:hover:text-white"
        >
          {isExpanded ? hideLabel : showLabel}
          <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
        </button>
      </div>
      {!isExpanded && summary && (
        <p className="mt-3 text-sm text-slate-500 animate-in fade-in duration-500 dark:text-slate-500">
          {summary}
        </p>
      )}
    </div>
  );
}

function RepoCard({ project }) {
  const languageColorClass = project.language
    ? (LANGUAGE_COLORS[project.language] || 'text-slate-500')
    : 'text-slate-600';
  
  if (!project) return null;

  return (
    <article className="group relative rounded-xl border border-slate-200 bg-white p-4 transition-all hover:border-slate-300 hover:bg-slate-50 dark:border-white/5 dark:bg-white/[0.02] dark:hover:border-white/10 dark:hover:bg-white/[0.04]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <FolderGit2 className="h-3.5 w-3.5 shrink-0 text-slate-500" />
            <h4 className="truncate text-sm font-bold text-slate-950 dark:text-white">
              {project.name}
            </h4>
          </div>
          {project.description ? (
            <p className="mt-2 line-clamp-2 text-xs leading-snug text-slate-500 dark:text-slate-500">
              {project.description}
            </p>
          ) : (
            <p className="mt-2 text-xs italic text-slate-500 dark:text-slate-600">
              Selected public repository.
            </p>
          )}
        </div>
        <a
          href={project.url}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 text-slate-500 hover:text-slate-950 dark:text-slate-600 dark:hover:text-white"
        >
          <ArrowUpRight className="h-3.5 w-3.5" />
        </a>
      </div>
      
      <div className="mt-4 flex items-center gap-3 text-[9px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-600">
        <span className="flex items-center gap-1">
          <Circle className={`h-2 w-2 fill-current ${languageColorClass}`} />
          {project.language || 'Code'}
        </span>
        <span className="flex items-center gap-1">
          <Star className="h-2.5 w-2.5" />
          {project.stargazersCount}
        </span>
      </div>
    </article>
  );
}

function GithubSignal({ t, statsState, activityState, projectsState, profileUrl }) {
  const stats = statsState.response?.data;
  const activity = activityState.response?.data;
  const repoItems = projectsState.response?.data?.slice(0, 3) || [];
  const isLoading = statsState.status === 'loading' || activityState.status === 'loading';
  const isRepoLoading = projectsState.status === 'loading' && repoItems.length === 0;
  const isError = statsState.status === 'unavailable' || activityState.status === 'unavailable';

  // Deduplicate and group activity rows - Move before early returns to follow Hooks rules
  const groupedEntries = React.useMemo(() => {
    if (!activity?.entries) return [];
    
    const seen = new Set();
    return activity.entries
      .filter(entry => {
        const key = `${entry.repoName}-${entry.summary}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 3);
  }, [activity?.entries]);

  if (isError) {
    return (
      <div className="mt-8 text-center py-6 border-t border-white/5">
        <p className="text-sm text-slate-600">
          {t('projects.githubUnavailableMuted')}
        </p>
      </div>
    );
  }

  return (
    <div className="mt-8 animate-in fade-in slide-in-from-top-3 duration-500">
      <div className="rounded-2xl border border-slate-200 bg-white/80 p-5 sm:p-7 dark:border-white/5 dark:bg-white/[0.01]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
          {/* Stats Strip */}
          <div className="flex-1 lg:border-r lg:border-slate-200 lg:pr-10 dark:lg:border-white/5">
            <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-600">
              <Activity className="h-3 w-3" />
              {t('projects.githubSummaryTitle')}
            </div>
            
            <div className="mt-5 grid grid-cols-3 gap-4">
              <div>
                <p className="text-[8px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-600">
                  {t('projects.githubMetricEvents')}
                </p>
                <p className="mt-1 text-xl font-bold text-slate-950 dark:text-white">
                  {isLoading ? '...' : (activity?.totals?.eventsLast30Days || 0)}
                </p>
              </div>
              <div>
                <p className="text-[8px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-600">
                  {t('projects.githubMetricActiveDays')}
                </p>
                <p className="mt-1 text-xl font-bold text-slate-950 dark:text-white">
                  {isLoading ? '...' : (activity?.totals?.activeDaysLast30Days || 0)}
                </p>
              </div>
              <div>
                <p className="text-[8px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-600">
                  {t('projects.githubMetricTopRepo')}
                </p>
                <p className="mt-1 truncate text-xs font-bold text-slate-700 dark:text-slate-300">
                  {isLoading ? '...' : (activity?.totals?.topRepoName || '—')}
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-center gap-4">
              <a
                href={profileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-500 transition-colors hover:text-cyan-700 dark:hover:text-cyan-400"
              >
                {t('projects.githubOpenProfile')}
                <ArrowUpRight className="h-3 w-3" />
              </a>
              {stats?.totalContributionsThisYear && (
                <span className="text-[10px] font-medium text-slate-500 dark:text-slate-600">
                  {stats.totalContributionsThisYear} commits in {new Date().getFullYear()}
                </span>
              )}
            </div>
          </div>

          {/* Mini Timeline */}
          <div className="flex-[1.2]">
            <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-600">
              {t('projects.githubRecentActivity')}
            </div>
            <div className="mt-5 space-y-3">
              {isLoading ? (
                [...Array(3)].map((_, i) => (
                  <div key={i} className="h-8 w-full animate-pulse rounded-lg bg-slate-200/80 dark:bg-white/5" />
                ))
              ) : groupedEntries.length === 0 ? (
                <p className="text-xs text-slate-500 dark:text-slate-600">{t('projects.githubTimelineEmpty')}</p>
              ) : (
                groupedEntries.map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between gap-3 border-b border-slate-200 py-1 last:border-0 dark:border-white/[0.03]">
                    <span className="truncate text-xs text-slate-600 dark:text-slate-400">
                      {entry.summary}
                    </span>
                    <span className="shrink-0 text-[9px] font-bold text-slate-500 dark:text-slate-600">
                      {entry.repoName.split('/')[1]}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Selected Repositories */}
      { (repoItems.length > 0 || isRepoLoading) && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-600">
              {t('projects.repoTitle')}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {isRepoLoading ? (
              [...Array(3)].map((_, i) => (
                <div key={i} className="h-28 animate-pulse rounded-xl bg-slate-200/80 dark:bg-white/[0.02]" />
              ))
            ) : (
              repoItems.map((project) => (
                <RepoCard key={project.id} project={project} />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Projects() {
  const { t } = useTranslation();
  const [isProductsExpanded, setIsProductsExpanded] = useState(false);
  const [isGithubExpanded, setIsGithubExpanded] = useState(false);

  const statsState = useGithubResource(GITHUB_STATS_ENDPOINT, isGithubStatsEnvelope);
  const activityState = useGithubResource(GITHUB_ACTIVITY_ENDPOINT, isGithubActivityEnvelope);
  const projectsState = useGithubResource(GITHUB_PROJECTS_ENDPOINT, isGithubProjectsEnvelope);

  const profileUrl = statsState.response?.data?.profileUrl || getGithubProfileUrl();

  return (
    <section id="projects" className="relative border-t border-slate-200 bg-slate-50 py-16 text-slate-900 sm:py-24 dark:border-white/5 dark:bg-[#030712] dark:text-white">
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="max-w-3xl">
          <h2 className="text-3xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-4xl">
            {t('projects.title')}
          </h2>
          <p className="mt-4 text-base leading-relaxed text-slate-600 dark:text-slate-400">
            {t('projects.subtitle')}
          </p>
        </div>

        {/* Subsection 1: Case Studies */}
        <div className="mt-12">
          <SectionHeader
            title={t('projects.showcaseTitle')}
            isExpanded={isProductsExpanded}
            onToggle={() => setIsProductsExpanded(!isProductsExpanded)}
            summary={t('projects.summaryProducts')}
            id="live-products-section"
            showLabel={t('projects.showProducts')}
            hideLabel={t('projects.hideProducts')}
          />
          
          <div
            id="live-products-section"
            className={`grid transition-all duration-500 ease-in-out ${isProductsExpanded ? 'grid-rows-[1fr] opacity-100 mt-8' : 'grid-rows-[0fr] opacity-0'}`}
          >
            <div className="overflow-hidden">
              <div className="mb-6 rounded-2xl border border-slate-200 bg-white/85 px-5 py-4 sm:px-6 dark:border-white/8 dark:bg-white/[0.02]">
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-500">
                  {t('projects.caseStudyInProgress')}
                </p>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-400">
                  {t('projects.showcaseDescription')}
                </p>
              </div>
              <div className="grid gap-6 md:grid-cols-2">
                {featuredWorkItems.map((item) => (
                  <ShowcaseCard key={item.id} item={item} t={t} />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Subsection 2: GitHub Activity */}
        <div className="mt-8">
          <SectionHeader
            title={t('projects.githubSignalTitle')}
            isExpanded={isGithubExpanded}
            onToggle={() => setIsGithubExpanded(!isGithubExpanded)}
            summary={t('projects.summaryGithub')}
            id="github-activity-section"
            showLabel={t('projects.showGithub')}
            hideLabel={t('projects.hideGithub')}
          />
          
          <div
            id="github-activity-section"
            className={`grid transition-all duration-500 ease-in-out ${isGithubExpanded ? 'grid-rows-[1fr] opacity-100 mt-6' : 'grid-rows-[0fr] opacity-0'}`}
          >
            <div className="overflow-hidden">
              <GithubSignal 
                t={t} 
                statsState={statsState} 
                activityState={activityState} 
                projectsState={projectsState}
                profileUrl={profileUrl} 
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
