import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";
import * as Sentry from "@sentry/node";
import {
  createAbortError,
  createGithubStatsEnvelope,
  getGithubStatsCacheKey,
  GITHUB_STATS_BACKUP_TTL_SECONDS,
  GITHUB_STATS_FRESH_TTL_SECONDS,
  GITHUB_STATS_RATE_LIMIT_MAX_REQUESTS,
  GITHUB_STATS_RATE_LIMIT_WINDOW_SECONDS,
  GITHUB_STATS_TIMEOUT_MS,
  hasValidHttpUrl,
  hasValidSentryDsn,
  normalizeGithubUser,
  resolveGithubUsername,
} from "../../src/shared/githubStats.js";

const backendSentryDsn = hasValidSentryDsn(process.env.SENTRY_DSN)
  ? process.env.SENTRY_DSN
  : undefined;

if (!backendSentryDsn) {
  delete process.env.SENTRY_DSN;
}

Sentry.init({
  dsn: backendSentryDsn,
  tracesSampleRate: 0.1,
  enabled: Boolean(backendSentryDsn),
});

const redisUrl = hasValidHttpUrl(process.env.UPSTASH_REDIS_REST_URL)
  ? process.env.UPSTASH_REDIS_REST_URL
  : undefined;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN?.trim() || undefined;
const redisEnabled = Boolean(redisUrl && redisToken);

const redis = redisEnabled
  ? new Redis({
      url: redisUrl,
      token: redisToken,
    })
  : null;

const ratelimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(
        GITHUB_STATS_RATE_LIMIT_MAX_REQUESTS,
        `${GITHUB_STATS_RATE_LIMIT_WINDOW_SECONDS} s`,
      ),
      analytics: true,
      prefix: "rl_portfolio",
    })
  : null;

if (!redisEnabled) {
  console.warn(
    "GitHub stats: Upstash Redis config missing or invalid; cache and rate limiting are disabled.",
  );
}

const BASE_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
};

function jsonResponse(statusCode, body, headers = BASE_HEADERS) {
  return {
    statusCode,
    headers,
    body: JSON.stringify(body),
  };
}

function getHeaderValue(headers, name) {
  if (!headers || typeof headers !== "object") {
    return undefined;
  }

  const targetHeader = Object.keys(headers).find(
    (headerName) => headerName.toLowerCase() === name.toLowerCase(),
  );

  return targetHeader ? headers[targetHeader] : undefined;
}

function getClientIp(event) {
  const netlifyIp = getHeaderValue(event.headers, "x-nf-client-connection-ip");
  if (typeof netlifyIp === "string" && netlifyIp.trim() !== "") {
    return netlifyIp.trim();
  }

  const forwardedFor = getHeaderValue(event.headers, "x-forwarded-for");
  if (typeof forwardedFor === "string" && forwardedFor.trim() !== "") {
    return forwardedFor.split(",")[0].trim();
  }

  return "127.0.0.1";
}

async function fetchWithTimeout(url, options = {}, timeoutMs = GITHUB_STATS_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(createAbortError("GitHub API request timed out.")), timeoutMs);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

export const handler = async (event) => {
  let shouldFlushSentry = false;

  const username = resolveGithubUsername(process.env.GITHUB_USERNAME);
  const ip = getClientIp(event);
  const freshCacheKey = getGithubStatsCacheKey("fresh", username);
  const backupCacheKey = getGithubStatsCacheKey("backup", username);

  const captureServerError = (error) => {
    if (!backendSentryDsn) {
      return;
    }

    shouldFlushSentry = true;
    Sentry.captureException(error);
  };

  const respond = async (response) => {
    if (shouldFlushSentry) {
      await Sentry.flush(2000).catch(() => undefined);
    }

    return response;
  };

  if (ratelimit) {
    try {
      const { success } = await ratelimit.limit(`ip_${ip}`);
      if (!success) {
        return respond(
          jsonResponse(
            429,
            { error: "Rate limit exceeded. Try again in a minute." },
            {
              ...BASE_HEADERS,
              "Retry-After": String(GITHUB_STATS_RATE_LIMIT_WINDOW_SECONDS),
            },
          ),
        );
      }
    } catch (rlError) {
      captureServerError(rlError);
    }
  }

  if (redis) {
    try {
      const freshData = await redis.get(freshCacheKey);
      if (freshData) {
        return respond(jsonResponse(200, createGithubStatsEnvelope(freshData, { cached: true })));
      }
    } catch (cacheError) {
      captureServerError(cacheError);
    }
  }

  try {
    const headers = { "User-Agent": "portfolio-serverless/1.0" };
    if (process.env.GITHUB_TOKEN) {
      headers["Authorization"] = `Bearer ${process.env.GITHUB_TOKEN}`;
    }

    const res = await fetchWithTimeout(
      `https://api.github.com/users/${username}`,
      { headers },
      GITHUB_STATS_TIMEOUT_MS,
    );

    if (!res.ok) {
      throw new Error(`GitHub API returned ${res.status}`);
    }

    const ghData = await res.json();
    const normalizedData = normalizeGithubUser(ghData, username);

    if (redis) {
      try {
        await Promise.all([
          redis.set(freshCacheKey, normalizedData, { ex: GITHUB_STATS_FRESH_TTL_SECONDS }),
          redis.set(backupCacheKey, normalizedData, { ex: GITHUB_STATS_BACKUP_TTL_SECONDS }),
        ]);
      } catch (writeError) {
        captureServerError(writeError);
      }
    }

    return respond(jsonResponse(200, createGithubStatsEnvelope(normalizedData, { cached: false })));
  } catch (fetchError) {
    captureServerError(fetchError);

    if (redis) {
      try {
        const staleData = await redis.get(backupCacheKey);
        if (staleData) {
          return respond(
            jsonResponse(200, createGithubStatsEnvelope(staleData, { cached: true, stale: true })),
          );
        }
      } catch (backupError) {
        captureServerError(backupError);
      }
    }

    return respond(jsonResponse(500, { error: "GitHub activity temporarily unavailable." }));
  }
};
