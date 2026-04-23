import { useEffect, useState } from 'react';
import * as Sentry from '@sentry/react';
import { createAbortError, GITHUB_STATS_TIMEOUT_MS } from '../shared/githubStats.js';

const INITIAL_STATE = {
  status: 'loading',
  response: null,
};

export function useGithubResource(endpoint, validateResponse) {
  const [requestNonce, setRequestNonce] = useState(0);
  const [state, setState] = useState(INITIAL_STATE);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    const timeoutId = window.setTimeout(
      () => controller.abort(createAbortError(`GitHub resource request timed out for ${endpoint}.`)),
      GITHUB_STATS_TIMEOUT_MS,
    );

    async function fetchResource() {
      try {
        setState((currentState) => ({
          ...currentState,
          status: currentState.response ? 'refreshing' : 'loading',
        }));

        const response = await fetch(endpoint, {
          headers: {
            Accept: 'application/json',
          },
          signal: controller.signal,
        });

        const payload = await response.json().catch(() => null);

        if (!response.ok) {
          if (!cancelled) {
            setState({
              status: 'unavailable',
              response: null,
            });
          }
          return;
        }

        if (!validateResponse(payload)) {
          throw new Error(`Invalid GitHub response shape received from ${endpoint}.`);
        }

        if (!cancelled) {
          setState({
            status: 'ready',
            response: payload,
          });
        }
      } catch (error) {
        if (error?.name !== 'AbortError') {
          Sentry.captureException(error instanceof Error ? error : new Error(String(error)));
        }

        if (!cancelled) {
          setState({
            status: 'unavailable',
            response: null,
          });
        }
      } finally {
        window.clearTimeout(timeoutId);
      }
    }

    fetchResource();

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [endpoint, requestNonce, validateResponse]);

  return {
    ...state,
    refresh: () => setRequestNonce((value) => value + 1),
  };
}
