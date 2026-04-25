import React from 'react';
import { Activity, ArrowUpRight, Clock3, FolderGit2, MapPin, RefreshCw } from 'lucide-react';
import {
  GITHUB_ACTIVITY_RECENT_DAYS,
  GITHUB_ACTIVITY_WINDOW_DAYS,
} from '../shared/githubStats.js';

function formatRelativeDate(dateString, locale) {
  if (!dateString) {
    return '';
  }

  const value = new Date(dateString);
  if (Number.isNaN(value.getTime())) {
    return '';
  }

  const minutes = Math.round((value.getTime() - Date.now()) / 60000);
  const formatter = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

  if (Math.abs(minutes) < 60) {
    return formatter.format(minutes, 'minute');
  }

  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) {
    return formatter.format(hours, 'hour');
  }

  const days = Math.round(hours / 24);
  if (Math.abs(days) < 30) {
    return formatter.format(days, 'day');
  }

  const months = Math.round(days / 30);
  return formatter.format(months, 'month');
}

function formatShortDate(dateString, locale) {
  if (!dateString) {
    return '';
  }

  const value = new Date(dateString);
  if (Number.isNaN(value.getTime())) {
    return '';
  }

  return new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
  }).format(value);
}

function buildEmptyCadence() {
  const cadence = [];
  const today = new Date();

  for (let index = GITHUB_ACTIVITY_WINDOW_DAYS - 1; index >= 0; index -= 1) {
    const day = new Date(today);
    day.setDate(day.getDate() - index);
    cadence.push({
      date: day.toISOString().slice(0, 10),
      count: 0,
      level: 0,
    });
  }

  return cadence;
}

function getCadenceColumnClass(level) {
  switch (level) {
    case 4:
      return 'h-14 bg-cyan-300 shadow-[0_0_24px_rgba(103,232,249,0.22)]';
    case 3:
      return 'h-11 bg-cyan-400/85';
    case 2:
      return 'h-8 bg-cyan-500/70';
    case 1:
      return 'h-5 bg-cyan-700/65';
    default:
      return 'h-3 bg-white/[0.08]';
  }
}

function ActivitySkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(4)].map((_, index) => (
        <div
          key={index}
          className="h-[78px] animate-pulse rounded-[1.15rem] bg-white/[0.04]"
        />
      ))}
    </div>
  );
}

function SummaryRow({ icon: Icon, label, value, emphasize = false }) {
  return (
    <div className="flex items-center justify-between gap-4 border-t border-white/8 py-3 first:border-t-0 first:pt-0">
      <dt className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-slate-500">
        <Icon className="h-3.5 w-3.5 text-cyan-300" />
        <span>{label}</span>
      </dt>
      <dd className={`text-right text-sm ${emphasize ? 'font-semibold text-white' : 'text-slate-300'}`}>
        {value}
      </dd>
    </div>
  );
}

function getSnapshotLabelKey(states) {
  if (states.some((state) => state.status === 'loading' || state.status === 'refreshing')) {
    return 'projects.githubSnapshotRefreshing';
  }

  if (states.some((state) => state.status === 'stale' || state.response?.stale || state.response?.cached)) {
    return 'projects.githubSnapshotCached';
  }

  if (states.some((state) => state.status === 'unavailable')) {
    return 'projects.githubSnapshotUnavailable';
  }

  return 'projects.githubSnapshotLive';
}

function ActivityCadenceStrip({ cadence, locale, t }) {
  const resolvedCadence = cadence?.length ? cadence : buildEmptyCadence();
  const startDate = resolvedCadence[0]?.date;
  const endDate = resolvedCadence[resolvedCadence.length - 1]?.date;

  return (
    <div className="rounded-[1.4rem] border border-white/8 bg-white/[0.03] p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
            {t('projects.githubCadenceTitle')}
          </p>
          <p className="mt-2 max-w-xl text-sm leading-7 text-slate-300">
            {t('projects.githubCadenceDescription')}
          </p>
        </div>
        <span className="rounded-full border border-white/8 bg-white/[0.04] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-300">
          {t('projects.githubCadenceWindow', { days: GITHUB_ACTIVITY_RECENT_DAYS })}
        </span>
      </div>

      <div className="mt-6">
        <div className="flex h-14 items-end gap-1.5">
          {resolvedCadence.map((entry) => (
            <span
              key={entry.date}
              title={`${entry.date}: ${entry.count}`}
              className={`w-full min-w-0 rounded-full transition-colors ${getCadenceColumnClass(entry.level)}`}
            />
          ))}
        </div>
        <div className="mt-3 flex items-center justify-between text-[11px] uppercase tracking-[0.18em] text-slate-500">
          <span>{formatShortDate(startDate, locale)}</span>
          <span>{formatShortDate(endDate, locale)}</span>
        </div>
      </div>
    </div>
  );
}

export default function GithubOverviewPanel({
  t,
  locale,
  profileUrl,
  statsState,
  activityState,
  projectsState,
}) {
  const stats = statsState.response?.data ?? null;
  const activity = activityState.response?.data ?? {
    entries: [],
    cadence: buildEmptyCadence(),
    totals: {
      eventsLast30Days: 0,
      activeDaysLast30Days: 0,
      lastActiveAt: null,
      topRepoName: null,
      topRepoEventsLast30Days: 0,
    },
  };

  const resourceStates = [statsState, activityState, projectsState];
  const snapshotLabelKey = getSnapshotLabelKey(resourceStates);
  const isRefreshing = resourceStates.some((state) => state.status === 'loading' || state.status === 'refreshing');
  const hasUnavailableResource = resourceStates.some((state) => state.status === 'unavailable');
  const hasSoftFailure = resourceStates.some((state) => state.status === 'stale');
  const isActivityLoading = activityState.status === 'loading' && activity.entries.length === 0;
  const topRepoValue = activity.totals.topRepoName
    ? t('projects.githubProfileSummary', {
        repoName: activity.totals.topRepoName,
        count: activity.totals.topRepoEventsLast30Days,
      })
    : t('projects.githubCadenceQuiet');

  const refreshGithubData = () => {
    statsState.refresh();
    activityState.refresh();
    projectsState.refresh();
  };

  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/88 p-6 text-white shadow-[0_30px_120px_rgba(2,6,23,0.5)] ring-1 ring-white/5 sm:p-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.15),_transparent_32%),radial-gradient(circle_at_85%_12%,_rgba(251,191,36,0.1),_transparent_26%),linear-gradient(160deg,rgba(15,23,42,0.96),rgba(2,6,23,0.96))]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

      <div className="relative z-10">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-300">
              <Activity className="h-3.5 w-3.5 text-cyan-300" />
              {t('projects.githubSummaryKicker')}
            </span>
            <h3 className="mt-4 text-2xl font-semibold tracking-tight text-white sm:text-[2rem]">
              {t('projects.githubSummaryTitle')}
            </h3>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
              {stats?.bio || t('projects.githubSummaryDescription')}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-300">
              {t(snapshotLabelKey)}
            </span>
            <button
              type="button"
              onClick={refreshGithubData}
              disabled={isRefreshing}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3 py-2 text-sm font-medium text-slate-100 transition-colors hover:bg-white/10 disabled:cursor-wait disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              {t('projects.githubRefresh')}
            </button>
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

        {(hasUnavailableResource || hasSoftFailure) && (
          <div className="mt-5 rounded-[1.2rem] border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-sm leading-6 text-amber-100">
            {hasSoftFailure
              ? t('projects.githubSnapshotUsingPrevious')
              : t('projects.githubSnapshotUnavailableBody')}
          </div>
        )}

        <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(300px,0.8fr)]">
          <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.035] p-5 sm:p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
                  {t('projects.githubActivityTitle')}
                </p>
                <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-300">
                  {t('projects.githubActivityDescription')}
                </p>
              </div>
              <span className="text-xs uppercase tracking-[0.18em] text-slate-500">
                {activity.totals.lastActiveAt
                  ? formatRelativeDate(activity.totals.lastActiveAt, locale)
                  : t('projects.githubCadenceQuiet')}
              </span>
            </div>

            <div className="mt-6">
              <ActivityCadenceStrip
                cadence={activity.cadence}
                locale={locale}
                t={t}
              />
            </div>

            <div className="mt-6 grid gap-4 border-b border-white/8 pb-6 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500">
                  {t('projects.githubCadenceEvents')}
                </p>
                <p className="mt-2 text-2xl font-semibold tracking-tight text-white">
                  {activity.totals.eventsLast30Days}
                </p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500">
                  {t('projects.githubCadenceActiveDays')}
                </p>
                <p className="mt-2 text-2xl font-semibold tracking-tight text-white">
                  {activity.totals.activeDaysLast30Days}
                </p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500">
                  {t('projects.githubCadenceTopRepo')}
                </p>
                <p
                  className="mt-2 break-words text-base font-semibold text-white"
                  title={activity.totals.topRepoName || undefined}
                >
                  {activity.totals.topRepoName || t('projects.githubCadenceQuiet')}
                </p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500">
                  {t('projects.githubCadenceLastActive')}
                </p>
                <p className="mt-2 text-base font-semibold text-white">
                  {activity.totals.lastActiveAt
                    ? formatRelativeDate(activity.totals.lastActiveAt, locale)
                    : t('projects.githubCadenceQuiet')}
                </p>
              </div>
            </div>

            <div className="mt-6">
              {isActivityLoading ? (
                <ActivitySkeleton />
              ) : activity.entries.length === 0 ? (
                <p className="text-sm leading-7 text-slate-400">
                  {t('projects.githubTimelineEmpty')}
                </p>
              ) : (
                <ol className="space-y-5">
                  {activity.entries.map((item) => (
                    <li
                      key={item.id}
                      className="relative border-l border-white/10 pl-5"
                    >
                      <span className="absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full bg-cyan-300 shadow-[0_0_14px_rgba(103,232,249,0.35)]" />
                      <a
                        href={item.targetUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                      >
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <p className="break-words text-base font-medium text-white">{item.summary}</p>
                            <p className="mt-1 break-words text-sm text-slate-400">{item.repoName}</p>
                          </div>
                          <span className="shrink-0 text-xs uppercase tracking-[0.18em] text-slate-500">
                            {formatRelativeDate(item.createdAt, locale)}
                          </span>
                        </div>
                      </a>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </div>

          <aside className="rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-5 sm:p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
              {t('projects.githubProfileLabel')}
            </p>

            <div className="mt-4 rounded-[1.35rem] border border-white/8 bg-white/[0.04] p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                {t('projects.githubMetricYearTotal')}
              </p>
              <p className="mt-2 text-3xl font-semibold tracking-tight text-white">
                {stats
                  ? (stats.totalContributionsThisYear !== null ? stats.totalContributionsThisYear : '—')
                  : '...'}
              </p>
              <p className="mt-3 text-sm text-slate-300">
                {stats?.name || t('projects.githubProfileFallbackTitle')}
              </p>
              <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">
                {stats ? `@${stats.login}` : t('projects.githubProfileFallbackBody')}
              </p>
            </div>

            <p className="mt-4 text-sm leading-7 text-slate-300">
              {topRepoValue}
            </p>

            <dl className="mt-6">
              <SummaryRow
                icon={FolderGit2}
                label={t('projects.githubMetricRepos')}
                value={stats ? stats.publicRepos : '...'}
                emphasize
              />
              <SummaryRow
                icon={Activity}
                label={t('projects.githubMetricRecentEvents')}
                value={activity.totals.eventsLast30Days}
              />
              <SummaryRow
                icon={Clock3}
                label={t('projects.githubCadenceLastActive')}
                value={activity.totals.lastActiveAt
                  ? formatRelativeDate(activity.totals.lastActiveAt, locale)
                  : t('projects.githubCadenceQuiet')}
              />
              <SummaryRow
                icon={Activity}
                label={t('projects.githubCadenceTopRepo')}
                value={activity.totals.topRepoName || t('projects.githubCadenceQuiet')}
              />
              <SummaryRow
                icon={MapPin}
                label={t('projects.githubLocationLabel')}
                value={stats?.location || t('projects.githubProfileFallbackBody')}
              />
            </dl>

            <a
              href={profileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-950 transition-colors hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              {t('projects.githubOpenProfile')}
              <ArrowUpRight className="h-4 w-4" />
            </a>

            <p className="mt-4 text-xs uppercase tracking-[0.18em] text-slate-500">
              {t(snapshotLabelKey)}
            </p>
          </aside>
        </div>
      </div>
    </section>
  );
}
