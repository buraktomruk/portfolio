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
    card: 'from-emerald-500/10 via-transparent to-transparent',
    badge: 'bg-emerald-500/10 text-emerald-300 ring-emerald-500/20',
    button: 'bg-emerald-500 text-emerald-950 hover:bg-emerald-400',
    accentText: 'text-emerald-400',
  },
  violet: {
    card: 'from-violet-500/10 via-transparent to-transparent',
    badge: 'bg-violet-500/10 text-violet-300 ring-violet-500/20',
    button: 'bg-violet-500 text-violet-950 hover:bg-violet-400',
    accentText: 'text-violet-400',
  },
  cyan: {
    card: 'from-cyan-500/10 via-transparent to-transparent',
    badge: 'bg-cyan-500/10 text-cyan-300 ring-cyan-500/20',
    button: 'bg-cyan-500 text-cyan-950 hover:bg-cyan-400',
    accentText: 'text-cyan-400',
  },
  amber: {
    card: 'from-amber-500/10 via-transparent to-transparent',
    badge: 'bg-amber-500/10 text-amber-300 ring-amber-500/20',
    button: 'bg-amber-500 text-amber-950 hover:bg-amber-400',
    accentText: 'text-amber-400',
  },
};

function getAccentStyles(accent) {
  return ACCENT_STYLES[accent] ?? ACCENT_STYLES.emerald;
}

function ShowcaseCard({ item, t }) {
  const accentStyles = getAccentStyles(item.accent);
  const [hasError, setHasError] = useState(false);

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-slate-900/40 transition-all duration-300 hover:border-white/20 hover:bg-slate-900/60">
      <div className={`absolute inset-0 bg-gradient-to-br opacity-50 ${accentStyles.card}`} />
      
      <div className="relative z-10 flex flex-1 flex-col p-6 sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ring-1 ${accentStyles.badge}`}>
              {item.status}
            </span>
            <h3 className="mt-4 text-2xl font-bold tracking-tight text-white sm:text-3xl">
              {item.title}
            </h3>
          </div>
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5 p-2.5">
            {!item.previewImage || hasError ? (
              <span className="text-xl font-bold text-white/40">{item.title.charAt(0)}</span>
            ) : (
              <img
                src={item.previewImage}
                alt=""
                className="h-full w-full object-contain"
                onError={() => setHasError(true)}
              />
            )}
          </div>
        </div>

        <p className="mt-4 text-[15px] leading-relaxed text-slate-400">
          {item.description}
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          {item.stack.slice(0, 3).map((label) => (
            <span key={label} className="text-xs font-medium text-slate-500">
              #{label}
            </span>
          ))}
        </div>

        <div className="mt-auto pt-8">
          <a
            href={item.demoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-all ${accentStyles.button}`}
          >
            {t('projects.liveDemo')}
            <ArrowUpRight className="h-4 w-4" />
          </a>
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
  t 
}) {
  return (
    <div className="border-b border-white/5 pb-6">
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-xl font-bold text-white">{title}</h3>
        <button
          type="button"
          aria-expanded={isExpanded}
          aria-controls={id}
          onClick={onToggle}
          className="flex items-center gap-2 text-sm font-bold text-slate-500 transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-500"
        >
          {isExpanded ? t('projects.collapse') : t('projects.expand')}
          <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
        </button>
      </div>
      {!isExpanded && summary && (
        <p className="mt-3 text-sm text-slate-500 animate-in fade-in duration-500">
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
    <article className="group relative rounded-2xl border border-white/5 bg-white/[0.02] p-5 transition-all hover:border-white/10 hover:bg-white/[0.04]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <FolderGit2 className="h-4 w-4 shrink-0 text-slate-500" />
            <h4 className="truncate text-sm font-bold text-white">
              {project.name}
            </h4>
          </div>
          {project.description && (
            <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-slate-500">
              {project.description}
            </p>
          )}
        </div>
        <a
          href={project.url}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 text-slate-600 hover:text-white"
        >
          <ArrowUpRight className="h-4 w-4" />
        </a>
      </div>
      
      <div className="mt-4 flex items-center gap-4 text-[10px] font-bold uppercase tracking-wider text-slate-600">
        <span className="flex items-center gap-1.5">
          <Circle className={`h-2 w-2 fill-current ${languageColorClass}`} />
          {project.language || 'Code'}
        </span>
        <span className="flex items-center gap-1">
          <Star className="h-3 w-3" />
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

  if (isError) {
    return (
      <div className="mt-12 text-center py-8 border-t border-white/5">
        <p className="text-sm text-slate-600">
          {t('projects.githubUnavailableMuted')}
        </p>
      </div>
    );
  }

  const entries = activity?.entries?.slice(0, 3) || [];

  return (
    <div className="mt-12 animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="rounded-3xl border border-white/5 bg-white/[0.01] p-6 sm:p-8">
        <div className="flex flex-col gap-8 lg:flex-row">
          {/* Stats Strip */}
          <div className="flex flex-1 flex-col justify-center border-white/5 lg:border-r lg:pr-12">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
              <Activity className="h-3 w-3" />
              {t('projects.githubSummaryTitle')}
            </div>
            
            <div className="mt-6 grid grid-cols-2 gap-x-8 gap-y-6 sm:grid-cols-4 lg:grid-cols-2">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600">
                  {t('projects.githubMetricEvents')}
                </p>
                <p className="mt-1 text-2xl font-bold text-white">
                  {isLoading ? '...' : (activity?.totals?.eventsLast30Days || 0)}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600">
                  {t('projects.githubMetricActiveDays')}
                </p>
                <p className="mt-1 text-2xl font-bold text-white">
                  {isLoading ? '...' : (activity?.totals?.activeDaysLast30Days || 0)}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600">
                  {t('projects.githubMetricContributions')}
                </p>
                <p className="mt-1 text-2xl font-bold text-white">
                  {isLoading ? '...' : (stats?.totalContributionsThisYear ?? '—')}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600">
                  {t('projects.githubMetricTopRepo')}
                </p>
                <p className="mt-1 truncate text-sm font-bold text-slate-300">
                  {isLoading ? '...' : (activity?.totals?.topRepoName || '—')}
                </p>
              </div>
            </div>

            <div className="mt-8">
              <a
                href={profileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-cyan-500 transition-colors hover:text-cyan-400"
              >
                {t('projects.githubOpenProfile')}
                <ArrowUpRight className="h-3 w-3" />
              </a>
            </div>
          </div>

          {/* Mini Timeline */}
          <div className="flex-[1.5]">
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
              {t('projects.githubRecentActivity')}
            </div>
            <div className="mt-6 space-y-4">
              {isLoading ? (
                [...Array(3)].map((_, i) => (
                  <div key={i} className="h-10 w-full animate-pulse rounded-lg bg-white/5" />
                ))
              ) : entries.length === 0 ? (
                <p className="text-sm text-slate-600">{t('projects.githubTimelineEmpty')}</p>
              ) : (
                entries.map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between gap-4 py-1 border-b border-white/[0.03] last:border-0">
                    <span className="truncate text-sm text-slate-400">
                      {entry.summary}
                    </span>
                    <span className="shrink-0 text-[10px] font-bold text-slate-600">
                      {entry.repoName.split('/')[1]}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Selected Repositories - Now inside GitHub Signal */}
      { (repoItems.length > 0 || isRepoLoading) && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
              {t('projects.repoTitle')}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {isRepoLoading ? (
              [...Array(3)].map((_, i) => (
                <div key={i} className="h-32 animate-pulse rounded-2xl bg-white/[0.02]" />
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
  const [isProductsExpanded, setIsProductsExpanded] = useState(true);
  const [isGithubExpanded, setIsGithubExpanded] = useState(true);

  const statsState = useGithubResource(GITHUB_STATS_ENDPOINT, isGithubStatsEnvelope);
  const activityState = useGithubResource(GITHUB_ACTIVITY_ENDPOINT, isGithubActivityEnvelope);
  const projectsState = useGithubResource(GITHUB_PROJECTS_ENDPOINT, isGithubProjectsEnvelope);

  const profileUrl = statsState.response?.data?.profileUrl || getGithubProfileUrl();
  const activity = activityState.response?.data;

  // Summaries
  const productsSummary = `${featuredWorkItems.length} ${t('projects.summaryProducts')} · ${featuredWorkItems.map(i => i.title).join(', ')}`;
  
  const githubSummary = activity?.totals ? (
    `${activity.totals.eventsLast30Days} ${t('projects.summaryEvents')} · ${activity.totals.activeDaysLast30Days} ${t('projects.summaryActiveDays')} · ${activity.totals.topRepoName || 'portfolio'} ${t('projects.summaryMostActive')}`
  ) : t('projects.githubSummaryTitle');

  return (
    <section id="projects" className="relative border-t border-white/5 bg-[#030712] py-24 text-white sm:py-32">
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="max-w-3xl">
          <h2 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
            {t('projects.title')}
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-slate-400">
            {t('projects.subtitle')}
          </p>
        </div>

        {/* Subsection 1: Live Products */}
        <div className="mt-20">
          <SectionHeader
            title={t('projects.showcaseTitle')}
            isExpanded={isProductsExpanded}
            onToggle={() => setIsProductsExpanded(!isProductsExpanded)}
            summary={productsSummary}
            id="live-products-section"
            t={t}
          />
          
          <div
            id="live-products-section"
            className={`grid transition-all duration-500 ease-in-out ${isProductsExpanded ? 'grid-rows-[1fr] opacity-100 mt-10' : 'grid-rows-[0fr] opacity-0'}`}
          >
            <div className="overflow-hidden">
              <div className="grid gap-8 md:grid-cols-2">
                {featuredWorkItems.map((item) => (
                  <ShowcaseCard key={item.id} item={item} t={t} />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Subsection 2: GitHub Signal */}
        <div className="mt-24">
          <SectionHeader
            title={t('projects.githubSignalTitle')}
            isExpanded={isGithubExpanded}
            onToggle={() => setIsGithubExpanded(!isGithubExpanded)}
            summary={githubSummary}
            id="github-signal-section"
            t={t}
          />
          
          <div
            id="github-signal-section"
            className={`grid transition-all duration-500 ease-in-out ${isGithubExpanded ? 'grid-rows-[1fr] opacity-100 mt-10' : 'grid-rows-[0fr] opacity-0'}`}
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
