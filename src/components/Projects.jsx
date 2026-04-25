import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Activity, ArrowUpRight, ChevronDown, Circle, Clock3, FolderGit2, GitCommit, Sparkles, Star } from 'lucide-react';
import GithubOverviewPanel from './GithubOverviewPanel';
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
    card: 'from-emerald-500/20 via-emerald-400/5 to-transparent',
    badge: 'bg-emerald-500/15 text-emerald-200 ring-emerald-400/30',
    button: 'bg-emerald-500 text-emerald-950 hover:bg-emerald-400',
    glow: 'shadow-emerald-500/20',
    accentText: 'text-emerald-300',
  },
  violet: {
    card: 'from-violet-500/20 via-violet-400/5 to-transparent',
    badge: 'bg-violet-500/15 text-violet-200 ring-violet-400/30',
    button: 'bg-violet-500 text-violet-950 hover:bg-violet-400',
    glow: 'shadow-violet-500/20',
    accentText: 'text-violet-300',
  },
  cyan: {
    card: 'from-cyan-500/20 via-cyan-400/5 to-transparent',
    badge: 'bg-cyan-500/15 text-cyan-200 ring-cyan-400/30',
    button: 'bg-cyan-500 text-cyan-950 hover:bg-cyan-400',
    glow: 'shadow-cyan-500/20',
    accentText: 'text-cyan-300',
  },
  amber: {
    card: 'from-amber-500/20 via-amber-400/5 to-transparent',
    badge: 'bg-amber-500/15 text-amber-200 ring-amber-400/30',
    button: 'bg-amber-500 text-amber-950 hover:bg-amber-400',
    glow: 'shadow-amber-500/20',
    accentText: 'text-amber-300',
  },
};

function getAccentStyles(accent) {
  return ACCENT_STYLES[accent] ?? ACCENT_STYLES.emerald;
}

function getHostname(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

function formatRepoDate(dateString, locale) {
  if (!dateString) {
    return '';
  }

  const value = new Date(dateString);
  if (Number.isNaN(value.getTime())) {
    return '';
  }

  return new Intl.DateTimeFormat(locale, {
    month: 'short',
    year: 'numeric',
  }).format(value);
}

function PreviewFrame({ item }) {
  const [hasPreviewError, setHasPreviewError] = useState(false);
  const hostname = item.demoUrl ? getHostname(item.demoUrl) : '';
  const accentStyles = getAccentStyles(item.accent);
  const shouldUseFallback = !item.previewImage || hasPreviewError;

  return (
    <div className="relative overflow-hidden rounded-[1.25rem] border border-white/10 bg-slate-950 shadow-2xl sm:rounded-[1.5rem]">
      <div className={`absolute inset-0 bg-gradient-to-br ${accentStyles.card}`} />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.16),_transparent_40%),linear-gradient(135deg,rgba(15,23,42,0.12),rgba(2,6,23,0.75))]" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
      <div className="relative flex aspect-[4/3] flex-col justify-between p-5 sm:aspect-[16/10] sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <div className={`rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] ring-1 ${accentStyles.badge}`}>
            {item.status}
          </div>
          <div className="max-w-[60%] truncate rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-slate-300">
            {hostname || item.title}
          </div>
        </div>

        <div className="relative flex flex-1 items-center justify-center px-5 py-8 sm:px-8 sm:py-10">
          <div className="absolute inset-0 mx-auto my-auto h-40 w-40 rounded-full bg-white/10 blur-3xl sm:h-52 sm:w-52" />
          <div className="absolute inset-x-6 bottom-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
          <div className="relative z-10 flex h-24 w-24 items-center justify-center rounded-[1.75rem] border border-white/10 bg-white/10 p-5 shadow-2xl shadow-black/30 backdrop-blur-sm sm:h-28 sm:w-28 sm:p-6">
            {shouldUseFallback ? (
              <div className="flex h-full w-full items-center justify-center rounded-[1.1rem] bg-white/5 text-3xl font-semibold text-white sm:text-4xl">
                {item.title.charAt(0)}
              </div>
            ) : (
              <img
                src={item.previewImage}
                alt={`${item.title} logo`}
                className="h-full w-full object-contain"
                loading="lazy"
                onError={() => setHasPreviewError(true)}
              />
            )}
          </div>
        </div>

        <div className="flex items-end justify-between gap-3">
          <div>
            <p className={`text-[10px] font-semibold uppercase tracking-[0.24em] ${accentStyles.accentText}`}>
              {item.title}
            </p>
            <p className="mt-2 text-xs leading-6 text-slate-300 sm:text-sm">
              {item.tagline}
            </p>
          </div>
          <ArrowUpRight className="h-4 w-4 shrink-0 text-white/60" />
        </div>
      </div>
    </div>
  );
}

function ShowcaseCard({ item, t }) {
  const accentStyles = getAccentStyles(item.accent);

  return (
    <article className={`group relative overflow-hidden rounded-[1.5rem] border border-white/10 bg-slate-900/90 p-4 text-white shadow-2xl ring-1 ring-white/5 transition duration-300 hover:-translate-y-1 hover:border-white/20 hover:shadow-2xl sm:rounded-[2rem] sm:p-5 ${accentStyles.glow}`}>
      <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${accentStyles.card}`} />
      <div className="relative z-10 flex h-full flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] ring-1 ${accentStyles.badge}`}>
              {item.status}
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-300">
              {t('projects.liveProduct')}
            </span>
          </div>
          <Sparkles className="h-5 w-5 text-white/60" />
        </div>

        <div className="mt-5">
          <PreviewFrame item={item} />
        </div>

        <div className="mt-5 flex flex-1 flex-col sm:mt-6">
          <h3 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            {item.title}
          </h3>
          <p className="mt-3 text-sm leading-7 text-slate-300 sm:mt-4">
            {item.description}
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            {item.stack.map((label) => (
              <span
                key={label}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200"
              >
                {label}
              </span>
            ))}
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3 pt-1 sm:mt-6">
            <a
              href={item.demoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${accentStyles.button}`}
            >
              {t('projects.liveDemo')}
              <ArrowUpRight className="h-4 w-4" />
            </a>
            {item.repoUrl && (
              <a
                href={item.repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-100 transition-colors hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                {t('projects.sourceCode')}
                <ArrowUpRight className="h-4 w-4" />
              </a>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

function RepoCard({ project, t, locale }) {
  const languageColorClass = project.language
    ? (LANGUAGE_COLORS[project.language] || 'text-slate-400')
    : 'text-slate-500';
  const description = project.description || t('projects.noDescription');

  return (
    <article className="group relative overflow-hidden rounded-[1.85rem] border border-white/10 bg-slate-900/85 p-6 text-white shadow-[0_24px_80px_rgba(2,6,23,0.3)] ring-1 ring-white/5 transition duration-300 hover:-translate-y-1 hover:border-white/20 sm:p-7">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.1),_transparent_38%),linear-gradient(160deg,rgba(15,23,42,0.18),rgba(2,6,23,0.08))]" />
      <div className="relative z-10 flex h-full flex-col">
        <div className="flex items-start justify-between gap-5">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3.5">
              <FolderGit2 className="h-5 w-5 text-cyan-300" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <h3 className="break-words text-xl font-semibold tracking-tight text-white">
                  {project.name}
                </h3>
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-300">
                  {project.isPinned ? t('projects.repoPinned') : t('projects.repoFeatured')}
                </span>
              </div>
              <p
                className="mt-2 truncate text-[11px] uppercase tracking-[0.22em] text-slate-500"
                title={project.fullName}
              >
                {project.fullName}
              </p>
            </div>
          </div>

          {project.homepage && (
            <a
              href={project.homepage}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-slate-200 transition-colors hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              aria-label={t('projects.repoHomepageAria', { name: project.name })}
            >
              <ArrowUpRight className="h-4 w-4" />
            </a>
          )}
        </div>

        <p
          className="mt-6 flex-1 text-sm leading-7 text-slate-300 sm:text-[15px]"
          style={{
            display: '-webkit-box',
            WebkitBoxOrient: 'vertical',
            WebkitLineClamp: 3,
            overflow: 'hidden',
          }}
        >
          {description}
        </p>

        <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-white/10 pt-5 text-sm text-slate-400">
          <span className="inline-flex items-center gap-1.5">
            <Circle className={`h-3 w-3 fill-current ${languageColorClass}`} />
            {project.language || t('projects.repoLanguageFallback')}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Star className="h-3.5 w-3.5 text-amber-300" />
            {project.stargazersCount}
          </span>
          {project.updatedAt && (
            <span className="inline-flex items-center gap-1.5">
              <Clock3 className="h-3.5 w-3.5 text-cyan-300" />
              {t('projects.repoUpdated', { date: formatRepoDate(project.updatedAt, locale) })}
            </span>
          )}
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <a
            href={project.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            aria-label={t('projects.viewRepoAria', { name: project.name })}
          >
            {t('projects.viewRepo')}
            <ArrowUpRight className="h-4 w-4" />
          </a>
          {project.homepage && (
            <a
              href={project.homepage}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-950 transition-colors hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              {t('projects.repoHomepage')}
              <ArrowUpRight className="h-4 w-4" />
            </a>
          )}
        </div>
      </div>
    </article>
  );
}

function RepoCardSkeleton() {
  return (
    <div className="h-80 animate-pulse rounded-[1.85rem] border border-white/10 bg-slate-900/70" />
  );
}

function GithubTeaserBar({ t, statsState, activityState, isExpanded, onToggle }) {
  const stats = statsState.response?.data ?? null;
  const activity = activityState.response?.data ?? null;
  const isLoading = statsState.status === 'loading' || activityState.status === 'loading';

  const contributions = stats?.totalContributionsThisYear ?? null;
  const activeDays = activity?.totals?.activeDaysLast30Days ?? null;
  const topRepo = activity?.totals?.topRepoName ?? null;

  return (
    <button
      type="button"
      id="github-teaser-toggle"
      aria-expanded={isExpanded}
      aria-controls="github-expandable-section"
      onClick={onToggle}
      className="group mt-10 w-full rounded-[1.75rem] border border-white/10 bg-slate-900/80 px-5 py-4 text-left shadow-[0_16px_64px_rgba(2,6,23,0.3)] ring-1 ring-white/5 transition-all duration-300 hover:border-white/20 hover:bg-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400 sm:px-6 sm:py-5"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-cyan-300">
            <Activity className="h-3 w-3" />
            {t('projects.githubSummaryKicker')}
          </span>

          <div className="flex flex-wrap items-center gap-2">
            {isLoading ? (
              <span className="h-5 w-32 animate-pulse rounded-full bg-white/10" />
            ) : (
              <>
                {contributions !== null && contributions > 0 && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-slate-300">
                    <GitCommit className="h-3 w-3 text-cyan-300" />
                    {t('projects.githubTeaserContributions', { count: contributions })}
                  </span>
                )}
                {activeDays !== null && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-slate-300">
                    <Clock3 className="h-3 w-3 text-cyan-300" />
                    {t('projects.githubTeaserActiveDays', { count: activeDays })}
                  </span>
                )}
                {topRepo && (
                  <span className="inline-flex max-w-[200px] items-center gap-1.5 truncate rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-slate-300">
                    <FolderGit2 className="h-3 w-3 shrink-0 text-cyan-300" />
                    <span className="truncate">{topRepo}</span>
                  </span>
                )}
              </>
            )}
          </div>
        </div>

        <span className="flex shrink-0 items-center gap-2 text-sm font-medium text-cyan-300 transition-colors group-hover:text-cyan-200">
          {isExpanded ? t('projects.githubTeaserCollapse') : t('projects.githubTeaserExpand')}
          <ChevronDown
            className={`h-4 w-4 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
          />
        </span>
      </div>

      {!isExpanded && (
        <p className="mt-3 text-[13px] leading-6 text-slate-400">
          {t('projects.githubTeaserHint')}
        </p>
      )}
    </button>
  );
}

export default function Projects() {
  const { t, i18n } = useTranslation();
  const [isGithubExpanded, setIsGithubExpanded] = useState(false);
  const [isProductsExpanded, setIsProductsExpanded] = useState(true);
  const expandableRef = useRef(null);
  const productsRef = useRef(null);

  const statsState = useGithubResource(GITHUB_STATS_ENDPOINT, isGithubStatsEnvelope);
  const activityState = useGithubResource(GITHUB_ACTIVITY_ENDPOINT, isGithubActivityEnvelope);
  const projectsState = useGithubResource(GITHUB_PROJECTS_ENDPOINT, isGithubProjectsEnvelope);

  const profileUrl = statsState.response?.data?.profileUrl || getGithubProfileUrl();
  const repoItems = projectsState.response?.data ?? [];
  const showRepoGrid = repoItems.length > 0;
  const isRepoLoading = projectsState.status === 'loading' && repoItems.length === 0;

  const handleToggle = () => {
    setIsGithubExpanded((prev) => {
      const next = !prev;
      if (!next && expandableRef.current) {
        expandableRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
      return next;
    });
  };

  const handleProductsToggle = () => {
    setIsProductsExpanded((prev) => {
      const next = !prev;
      if (!next && productsRef.current) {
        productsRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
      return next;
    });
  };

  return (
    <section
      id="projects"
      className="relative scroll-mt-24 overflow-hidden border-t border-slate-200 bg-[#030712] py-20 text-white transition-colors duration-300 dark:border-slate-800"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.16),_transparent_28%),radial-gradient(circle_at_85%_8%,_rgba(251,191,36,0.14),_transparent_22%),linear-gradient(180deg,rgba(2,6,23,1),rgba(3,7,18,0.98))]" />

      <div className="container relative z-10 mx-auto px-4 sm:px-6">
        <div className="max-w-4xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-300 shadow-sm sm:text-[11px] sm:tracking-[0.28em]">
            <Sparkles className="h-3.5 w-3.5 text-cyan-300" />
            {t('projects.kicker')}
          </span>
          <h2 className="mt-5 max-w-3xl text-3xl font-semibold tracking-tight text-white sm:text-4xl md:text-5xl">
            {t('projects.title')}
          </h2>
          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-300 sm:mt-5 sm:text-lg sm:leading-8">
            {t('projects.subtitle')}
          </p>
        </div>

        <div className="mt-12" ref={productsRef}>
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-3xl">
              <h3 className="text-2xl font-semibold text-white">
                {t('projects.showcaseTitle')}
              </h3>
              <p className="mt-2 text-sm leading-7 text-slate-400">
                {t('projects.showcaseDescription')}
              </p>
            </div>
            <button
              type="button"
              id="products-teaser-toggle"
              aria-expanded={isProductsExpanded}
              aria-controls="products-expandable-section"
              onClick={handleProductsToggle}
              className="inline-flex shrink-0 items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400"
            >
              <ChevronDown
                className={`h-4 w-4 transition-transform duration-300 ${isProductsExpanded ? 'rotate-180' : ''}`}
              />
              {isProductsExpanded ? t('projects.showcaseCollapse') : t('projects.showcaseExpand')}
            </button>
          </div>

          <div
            id="products-expandable-section"
            role="region"
            aria-labelledby="products-teaser-toggle"
            style={{
              display: 'grid',
              gridTemplateRows: isProductsExpanded ? '1fr' : '0fr',
              transition: 'grid-template-rows 420ms cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            <div style={{ overflow: 'hidden' }}>
              <div className="grid gap-6 lg:grid-cols-2 pb-2">
                {featuredWorkItems.map((item) => (
                  <ShowcaseCard
                    key={item.id}
                    item={item}
                    t={t}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* GitHub teaser toggle bar */}
        <div ref={expandableRef}>
          <GithubTeaserBar
            t={t}
            statsState={statsState}
            activityState={activityState}
            isExpanded={isGithubExpanded}
            onToggle={handleToggle}
          />
        </div>

        {/* Collapsible GitHub detail section */}
        <div
          id="github-expandable-section"
          role="region"
          aria-labelledby="github-teaser-toggle"
          style={{
            display: 'grid',
            gridTemplateRows: isGithubExpanded ? '1fr' : '0fr',
            transition: 'grid-template-rows 420ms cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          <div style={{ overflow: 'hidden' }}>
            <div className="pt-2">
              <div className="mt-8">
                <GithubOverviewPanel
                  t={t}
                  locale={i18n.language}
                  profileUrl={profileUrl}
                  statsState={statsState}
                  activityState={activityState}
                  projectsState={projectsState}
                />
              </div>

              <div className="mt-12" id="github-repositories">
                <div className="mb-7 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-2xl font-semibold text-white">
                        {t('projects.repoTitle')}
                      </h3>
                      {projectsState.response?.stale && (
                        <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-200">
                          {t('projects.githubSnapshotCached')}
                        </span>
                      )}
                    </div>
                    <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-400">
                      {t('projects.repoDescription')}
                    </p>
                  </div>
                  <a
                    href={profileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-medium text-cyan-300 transition-colors hover:text-cyan-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                  >
                    {t('projects.githubOpenProfile')}
                    <ArrowUpRight className="h-4 w-4" />
                  </a>
                </div>

                {isRepoLoading ? (
                  <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                    {[...Array(4)].map((_, index) => (
                      <RepoCardSkeleton key={index} />
                    ))}
                  </div>
                ) : showRepoGrid ? (
                  <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                    {repoItems.map((project) => (
                      <RepoCard
                        key={project.id}
                        project={project}
                        t={t}
                        locale={i18n.language}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="rounded-[1.75rem] border border-white/10 bg-slate-900/70 p-6 shadow-[0_24px_80px_rgba(2,6,23,0.28)]">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div className="max-w-2xl">
                        <h4 className="text-lg font-semibold text-white">
                          {t('projects.repoFallbackTitle')}
                        </h4>
                        <p className="mt-2 text-sm leading-7 text-slate-400">
                          {t('projects.repoFallbackBody')}
                        </p>
                      </div>
                      <a
                        href={profileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-950 transition-colors hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                      >
                        {t('projects.githubOpenProfile')}
                        <ArrowUpRight className="h-4 w-4" />
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {/* Collapse footer */}
              <div className="mt-10 flex justify-center">
                <button
                  type="button"
                  onClick={handleToggle}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-5 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400"
                >
                  <ChevronDown className="h-4 w-4 rotate-180" />
                  {t('projects.githubTeaserCollapse')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
