import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Activity, ArrowUpRight, Check, ChevronDown, Circle, FolderGit2, Github, Star } from 'lucide-react';
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

  const statusLabel = t(`projects.statusLabels.${item.statusKey}`, { defaultValue: '' });
  const typeLabel = t(`projects.caseStudies.${item.id}.type`, { defaultValue: '' });
  const summary = t(`projects.caseStudies.${item.id}.summary`, { defaultValue: '' });
  const focusItems = t(`projects.caseStudies.${item.id}.focus`, {
    returnObjects: true,
    defaultValue: [],
  });
  const focusList = Array.isArray(focusItems) ? focusItems : [];
  const tags = Array.isArray(item.tags) ? item.tags : [];
  const visibleTags = tags.slice(0, 5);
  const showImage = Boolean(item.previewImage) && !hasError;
  const initial = item.title?.charAt(0)?.toUpperCase() || '•';

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-slate-900/40 transition-all duration-300 hover:border-white/20 hover:bg-slate-900/60">
      <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br opacity-50 ${accentStyles.card}`} />

      <div className="relative z-10 flex flex-1 flex-col p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            {statusLabel && (
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ring-1 ${accentStyles.badge}`}>
                {statusLabel}
              </span>
            )}
            <h3 className="mt-3 truncate text-xl font-bold tracking-tight text-white sm:text-2xl">
              {item.title}
            </h3>
            {typeLabel && (
              <p className={`mt-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${accentStyles.accentText}`}>
                {typeLabel}
              </p>
            )}
          </div>
          <div
            aria-hidden="true"
            className={`flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-white/5 ${showImage ? 'p-2' : ''}`}
          >
            {showImage ? (
              <img
                src={item.previewImage}
                alt=""
                className="h-full w-full object-contain"
                loading="lazy"
                onError={() => setHasError(true)}
              />
            ) : (
              <span className={`text-base font-bold ${accentStyles.accentText}`}>{initial}</span>
            )}
          </div>
        </div>

        {summary && (
          <p className="mt-4 text-[13.5px] leading-relaxed text-slate-300">
            {summary}
          </p>
        )}

        {focusList.length > 0 && (
          <div className="mt-4">
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-500">
              {t('projects.engineeringFocus')}
            </p>
            <ul className="mt-2 space-y-1.5">
              {focusList.slice(0, 4).map((point) => (
                <li key={point} className="flex items-start gap-2 text-[13px] leading-snug text-slate-400">
                  <Check className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${accentStyles.accentText}`} aria-hidden="true" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {visibleTags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {visibleTags.map((label) => (
              <span
                key={label}
                className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-medium text-slate-400 ring-1 ring-white/10"
              >
                {label}
              </span>
            ))}
          </div>
        )}

        <div className="mt-5 flex flex-wrap gap-2 pt-1">
          {item.demoUrl && (
            <a
              href={item.demoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex h-9 items-center gap-1.5 rounded-lg px-3.5 text-xs font-bold leading-none transition-colors ${accentStyles.button}`}
            >
              <span>{t('projects.livePreview')}</span>
              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
          )}
          {item.repoUrl && (
            <a
              href={item.repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3.5 text-xs font-bold leading-none text-slate-200 transition-colors hover:border-white/25 hover:bg-white/10"
            >
              <Github className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{t('projects.viewRepository')}</span>
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
          {isExpanded ? hideLabel : showLabel}
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
    <article className="group relative rounded-xl border border-white/5 bg-white/[0.02] p-4 transition-all hover:border-white/10 hover:bg-white/[0.04]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <FolderGit2 className="h-3.5 w-3.5 shrink-0 text-slate-500" />
            <h4 className="truncate text-sm font-bold text-white">
              {project.name}
            </h4>
          </div>
          {project.description ? (
            <p className="mt-2 line-clamp-2 text-xs leading-snug text-slate-500">
              {project.description}
            </p>
          ) : (
            <p className="mt-2 text-xs italic text-slate-600">
              Selected public repository.
            </p>
          )}
        </div>
        <a
          href={project.url}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 text-slate-600 hover:text-white"
        >
          <ArrowUpRight className="h-3.5 w-3.5" />
        </a>
      </div>
      
      <div className="mt-4 flex items-center gap-3 text-[9px] font-bold uppercase tracking-wider text-slate-600">
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
      <div className="rounded-2xl border border-white/5 bg-white/[0.01] p-5 sm:p-7">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
          {/* Stats Strip */}
          <div className="flex-1 border-white/5 lg:border-r lg:pr-10">
            <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.2em] text-slate-600">
              <Activity className="h-3 w-3" />
              {t('projects.githubSummaryTitle')}
            </div>
            
            <div className="mt-5 grid grid-cols-3 gap-4">
              <div>
                <p className="text-[8px] font-bold uppercase tracking-widest text-slate-600">
                  {t('projects.githubMetricEvents')}
                </p>
                <p className="mt-1 text-xl font-bold text-white">
                  {isLoading ? '...' : (activity?.totals?.eventsLast30Days || 0)}
                </p>
              </div>
              <div>
                <p className="text-[8px] font-bold uppercase tracking-widest text-slate-600">
                  {t('projects.githubMetricActiveDays')}
                </p>
                <p className="mt-1 text-xl font-bold text-white">
                  {isLoading ? '...' : (activity?.totals?.activeDaysLast30Days || 0)}
                </p>
              </div>
              <div>
                <p className="text-[8px] font-bold uppercase tracking-widest text-slate-600">
                  {t('projects.githubMetricTopRepo')}
                </p>
                <p className="mt-1 truncate text-xs font-bold text-slate-300">
                  {isLoading ? '...' : (activity?.totals?.topRepoName || '—')}
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-center gap-4">
              <a
                href={profileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-500 transition-colors hover:text-cyan-400"
              >
                {t('projects.githubOpenProfile')}
                <ArrowUpRight className="h-3 w-3" />
              </a>
              {stats?.totalContributionsThisYear && (
                <span className="text-[10px] font-medium text-slate-600">
                  {stats.totalContributionsThisYear} commits in {new Date().getFullYear()}
                </span>
              )}
            </div>
          </div>

          {/* Mini Timeline */}
          <div className="flex-[1.2]">
            <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-600">
              {t('projects.githubRecentActivity')}
            </div>
            <div className="mt-5 space-y-3">
              {isLoading ? (
                [...Array(3)].map((_, i) => (
                  <div key={i} className="h-8 w-full animate-pulse rounded-lg bg-white/5" />
                ))
              ) : groupedEntries.length === 0 ? (
                <p className="text-xs text-slate-600">{t('projects.githubTimelineEmpty')}</p>
              ) : (
                groupedEntries.map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between gap-3 py-1 border-b border-white/[0.03] last:border-0">
                    <span className="truncate text-xs text-slate-400">
                      {entry.summary}
                    </span>
                    <span className="shrink-0 text-[9px] font-bold text-slate-600">
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
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-600">
              {t('projects.repoTitle')}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {isRepoLoading ? (
              [...Array(3)].map((_, i) => (
                <div key={i} className="h-28 animate-pulse rounded-xl bg-white/[0.02]" />
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
    <section id="projects" className="relative border-t border-white/5 bg-[#030712] py-16 text-white sm:py-24">
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="max-w-3xl">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            {t('projects.title')}
          </h2>
          <p className="mt-4 text-base leading-relaxed text-slate-400">
            {t('projects.subtitle')}
          </p>
        </div>

        {/* Subsection 1: Live Products */}
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
