import React, { useState, useEffect } from 'react';
import * as Sentry from '@sentry/react';
import { useTranslation } from 'react-i18next';
import {
  createAbortError,
  getGithubProfileUrl,
  GITHUB_STATS_ENDPOINT,
  GITHUB_STATS_TIMEOUT_MS,
  isGithubStatsEnvelope,
} from '../shared/githubStats.js';

export default function GithubStats() {
  const { t } = useTranslation();
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [requestNonce, setRequestNonce] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    const timeoutId = window.setTimeout(
      () => controller.abort(createAbortError('GitHub stats request timed out.')),
      GITHUB_STATS_TIMEOUT_MS,
    );

    async function fetchStats() {
      try {
        setError(false);

        const res = await fetch(GITHUB_STATS_ENDPOINT, {
          headers: {
            Accept: 'application/json',
          },
          signal: controller.signal,
        });

        if (res.status === 429) throw new Error('Rate limit exceeded.');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const json = await res.json();
        if (!isGithubStatsEnvelope(json)) {
          throw new Error('Invalid GitHub stats response shape.');
        }

        if (!cancelled) setResponse(json);
      } catch (err) {
        Sentry.captureException(err instanceof Error ? err : new Error(String(err)));
        if (!cancelled) {
          setResponse(null);
          setError(true);
        }
      } finally {
        window.clearTimeout(timeoutId);
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchStats();
    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [requestNonce]);

  const retryFetch = () => {
    setLoading(true);
    setResponse(null);
    setError(false);
    setRequestNonce((value) => value + 1);
  };

  if (loading) {
    return (
      <div
        role="status"
        aria-live="polite"
        aria-busy="true"
        className="animate-pulse rounded-xl bg-slate-200 dark:bg-slate-700 h-20 w-full"
      />
    );
  }

  if (error || !response) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-5 py-4 text-center"
      >
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {t('githubStats.unavailable')}
        </p>
        <div className="mt-3 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={retryFetch}
            className="rounded-full border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            {t('githubStats.retry')}
          </button>
          <a
            href={getGithubProfileUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-medium text-indigo-600 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 dark:text-indigo-400"
          >
            {t('githubStats.viewProfile')}
          </a>
        </div>
      </div>
    );
  }

  const { data, stale } = response;

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-5 py-4 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <svg
          viewBox="0 0 24 24"
          className="w-6 h-6 text-slate-700 dark:text-slate-300 flex-shrink-0"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844a9.59 9.59 0 012.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
        </svg>

        <div>
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            {t('githubStats.title')}
            {stale && (
              <span className="text-[10px] font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 px-2 py-0.5 rounded-full">
                {t('githubStats.offline')}
              </span>
            )}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {t('githubStats.summary', {
              publicRepos: data.publicRepos,
              followers: data.followers,
            })}
          </p>
        </div>
      </div>

      <a
        href={data.profileUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={t('githubStats.viewProfileAria')}
        className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline whitespace-nowrap focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
      >
        {t('githubStats.viewProfile')} →
      </a>
    </div>
  );
}
