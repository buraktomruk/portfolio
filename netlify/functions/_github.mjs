import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";
import * as Sentry from "@sentry/node";
import {
  createAbortError,
  createGithubErrorEnvelope,
  createGithubStatsEnvelope,
  getGithubProfileUrl,
  getGithubStatsCacheKey,
  GITHUB_STATS_BACKUP_TTL_SECONDS,
  GITHUB_STATS_FRESH_TTL_SECONDS,
  GITHUB_STATS_RATE_LIMIT_MAX_REQUESTS,
  GITHUB_STATS_RATE_LIMIT_WINDOW_SECONDS,
  GITHUB_STATS_TIMEOUT_MS,
  hasValidHttpUrl,
  hasValidSentryDsn,
  resolveGithubUsername,
  resolveOptionalGithubToken,
  resolveOptionalRedisToken,
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
const redisToken = resolveOptionalRedisToken(process.env.UPSTASH_REDIS_REST_TOKEN);
const redisEnabled = Boolean(redisUrl && redisToken);

const redis = redisEnabled
  ? new Redis({
      url: redisUrl,
      token: redisToken,
    })
  : null;

const BASE_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store, max-age=0",
};

function jsonResponse(statusCode, body, headers = {}) {
  return {
    statusCode,
    headers: {
      ...BASE_HEADERS,
      ...headers,
    },
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

function createRatelimit(prefix) {
  if (!redis) {
    return null;
  }

  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(
      GITHUB_STATS_RATE_LIMIT_MAX_REQUESTS,
      `${GITHUB_STATS_RATE_LIMIT_WINDOW_SECONDS} s`,
    ),
    analytics: true,
    prefix,
  });
}

function getFailureDetails(error) {
  if (error?.name === "AbortError") {
    return {
      statusCode: 504,
      code: "github_timeout",
      message: "GitHub took too long to respond.",
    };
  }

  const upstreamStatus = Number.isInteger(error?.status) ? error.status : null;
  return {
    statusCode: upstreamStatus ? 502 : 503,
    code: upstreamStatus ? "github_upstream_error" : "github_unavailable",
    message: "GitHub data is temporarily unavailable.",
    upstreamStatus,
  };
}

export async function fetchGithubJson(url, token, timeoutMs = GITHUB_STATS_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort(createAbortError("GitHub API request timed out.")),
    timeoutMs,
  );

  const headers = {
    "User-Agent": "portfolio-serverless/1.0",
    Accept: "application/vnd.github+json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      headers,
      signal: controller.signal,
    });

    if (!response.ok) {
      const error = new Error(`GitHub API returned ${response.status}`);
      error.status = response.status;
      throw error;
    }

    return await response.json();
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function fetchGithubGraphql(query, variables, token, timeoutMs = GITHUB_STATS_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort(createAbortError("GitHub GraphQL request timed out.")),
    timeoutMs,
  );

  const headers = {
    "User-Agent": "portfolio-serverless/1.0",
    Accept: "application/json",
    "Content-Type": "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch("https://api.github.com/graphql", {
      method: "POST",
      headers,
      body: JSON.stringify({ query, variables }),
      signal: controller.signal,
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      const error = new Error(`GitHub GraphQL API returned ${response.status}`);
      error.status = response.status;
      error.payload = payload;
      throw error;
    }

    if (payload?.errors?.length) {
      const error = new Error(payload.errors[0]?.message || "GitHub GraphQL query failed.");
      error.status = 502;
      error.payload = payload;
      throw error;
    }

    return payload;
  } finally {
    clearTimeout(timeoutId);
  }
}

export function createGithubContext(event, { kind, cacheKeyPrefix, rateLimitPrefix }) {
  const username = resolveGithubUsername(process.env.GITHUB_USERNAME);
  const token = resolveOptionalGithubToken(process.env.GITHUB_TOKEN);
  const profileUrl = getGithubProfileUrl(username);
  const freshCacheKey = getGithubStatsCacheKey(`${cacheKeyPrefix}_fresh`, username);
  const backupCacheKey = getGithubStatsCacheKey(`${cacheKeyPrefix}_backup`, username);
  const ratelimit = createRatelimit(rateLimitPrefix);

  if (!redisEnabled) {
    console.warn(
      `GitHub ${kind}: Upstash Redis config missing or invalid; cache and rate limiting are disabled.`,
    );
  }

  let shouldFlushSentry = false;

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

  return {
    kind,
    username,
    token,
    profileUrl,
    async enforceRateLimit() {
      if (!ratelimit) {
        return null;
      }

      try {
        const { success } = await ratelimit.limit(`ip_${getClientIp(event)}`);
        if (!success) {
          return respond(
            jsonResponse(
              429,
              createGithubErrorEnvelope(kind, {
                code: "rate_limited",
                message: "Too many requests. Try again shortly.",
                profileUrl,
              }),
              {
                "Retry-After": String(GITHUB_STATS_RATE_LIMIT_WINDOW_SECONDS),
              },
            ),
          );
        }
      } catch (error) {
        captureServerError(error);
      }

      return null;
    },
    async getFreshCache() {
      if (!redis) {
        return null;
      }

      try {
        return await redis.get(freshCacheKey);
      } catch (error) {
        captureServerError(error);
        return null;
      }
    },
    async writeCache(data) {
      if (!redis) {
        return;
      }

      try {
        await Promise.all([
          redis.set(freshCacheKey, data, { ex: GITHUB_STATS_FRESH_TTL_SECONDS }),
          redis.set(backupCacheKey, data, { ex: GITHUB_STATS_BACKUP_TTL_SECONDS }),
        ]);
      } catch (error) {
        captureServerError(error);
      }
    },
    async getBackupCache() {
      if (!redis) {
        return null;
      }

      try {
        return await redis.get(backupCacheKey);
      } catch (error) {
        captureServerError(error);
        return null;
      }
    },
    captureServerError,
    respond,
  };
}

export async function respondWithGithubData(context, liveData) {
  await context.writeCache(liveData);
  return context.respond(
    jsonResponse(200, createGithubStatsEnvelope(context.kind, liveData, { cached: false })),
  );
}

export async function respondFromFreshCache(context, cachedData) {
  return context.respond(
    jsonResponse(200, createGithubStatsEnvelope(context.kind, cachedData, { cached: true })),
  );
}

export async function respondFromBackupCache(context, cachedData) {
  return context.respond(
    jsonResponse(
      200,
      createGithubStatsEnvelope(context.kind, cachedData, {
        cached: true,
        stale: true,
      }),
    ),
  );
}

export async function respondWithGithubFailure(context, error) {
  const failure = getFailureDetails(error);
  return context.respond(
    jsonResponse(
      failure.statusCode,
      createGithubErrorEnvelope(context.kind, {
        code: failure.code,
        message: failure.message,
        profileUrl: context.profileUrl,
        upstreamStatus: failure.upstreamStatus,
      }),
    ),
  );
}
