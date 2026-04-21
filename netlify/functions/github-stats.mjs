import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";
import * as Sentry from "@sentry/node";

// ─── Sentry ────────────────────────────────────────────────────────────────
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.1,
});

// ─── Upstash Redis ─────────────────────────────────────────────────────────
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

// ─── Rate Limiter: 20 requests per IP per minute (sliding window) ───────────
const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, "1 m"),
  analytics: true,
  prefix: "rl_portfolio",
});

// ─── Cache Keys & TTLs ─────────────────────────────────────────────────────
const FRESH_KEY   = "github_stats_fresh";   // 5-min freshness window
const BACKUP_KEY  = "github_stats_backup";  // 24-hour stale fallback
const FRESH_TTL   = 300;    // seconds
const BACKUP_TTL  = 86400;  // seconds

// ─── CORS / default headers ────────────────────────────────────────────────
const BASE_HEADERS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
};

/** Normalize raw GitHub user JSON into only the fields we expose */
function normalize(ghData) {
  return {
    followers:   ghData.followers,
    publicRepos: ghData.public_repos,
    profileUrl:  ghData.html_url,
  };
}

/** Build a GithubStatsResponse envelope */
function envelope(data, { cached, stale = false }) {
  return { source: "github", cached, stale, data };
}

export const handler = async (event) => {
  // ── Rate Limiting ──────────────────────────────────────────────────────
  const ip = event.headers["x-nf-client-connection-ip"] || "127.0.0.1";

  try {
    const { success } = await ratelimit.limit(`ip_${ip}`);
    if (!success) {
      return {
        statusCode: 429,
        headers: BASE_HEADERS,
        body: JSON.stringify({ error: "Rate limit exceeded. Try again in a minute." }),
      };
    }
  } catch (rlError) {
    // If Redis is down we don't want to block every user – log and continue.
    Sentry.captureException(rlError);
  }

  // ── Fresh Cache Check ──────────────────────────────────────────────────
  try {
    const freshData = await redis.get(FRESH_KEY);
    if (freshData) {
      return {
        statusCode: 200,
        headers: BASE_HEADERS,
        body: JSON.stringify(envelope(freshData, { cached: true })),
      };
    }
  } catch (cacheError) {
    Sentry.captureException(cacheError);
  }

  // ── GitHub API Fetch ───────────────────────────────────────────────────
  try {
    const username = process.env.GITHUB_USERNAME || "buraktomruk";
    const headers  = { "User-Agent": "portfolio-serverless/1.0" };
    if (process.env.GITHUB_TOKEN) {
      headers["Authorization"] = `Bearer ${process.env.GITHUB_TOKEN}`;
    }

    const res = await fetch(`https://api.github.com/users/${username}`, { headers });

    if (!res.ok) {
      throw new Error(`GitHub API returned ${res.status}`);
    }

    const ghData       = await res.json();
    const normalizedData = normalize(ghData);

    // Write both caches in parallel – don't block the response on a write failure
    Promise.all([
      redis.set(FRESH_KEY,  normalizedData, { ex: FRESH_TTL }),
      redis.set(BACKUP_KEY, normalizedData, { ex: BACKUP_TTL }),
    ]).catch((writeError) => Sentry.captureException(writeError));

    return {
      statusCode: 200,
      headers: BASE_HEADERS,
      body: JSON.stringify(envelope(normalizedData, { cached: false })),
    };
  } catch (fetchError) {
    Sentry.captureException(fetchError);

    // ── Stale Backup Fallback ────────────────────────────────────────────
    try {
      const staleData = await redis.get(BACKUP_KEY);
      if (staleData) {
        return {
          statusCode: 200,
          headers: BASE_HEADERS,
          body: JSON.stringify(envelope(staleData, { cached: true, stale: true })),
        };
      }
    } catch (backupError) {
      Sentry.captureException(backupError);
    }

    // Only hit this path when GitHub AND the 24-hour backup cache are both dead
    return {
      statusCode: 500,
      headers: BASE_HEADERS,
      body: JSON.stringify({ error: "GitHub activity temporarily unavailable." }),
    };
  }
};
