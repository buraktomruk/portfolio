export const GITHUB_STATS_ENDPOINT = "/.netlify/functions/github-stats";
export const GITHUB_STATS_SOURCE = "github";
export const GITHUB_STATS_TIMEOUT_MS = 4500;
export const DEFAULT_GITHUB_USERNAME = "buraktomruk";
export const GITHUB_STATS_RATE_LIMIT_WINDOW_SECONDS = 60;
export const GITHUB_STATS_RATE_LIMIT_MAX_REQUESTS = 20;
export const GITHUB_STATS_FRESH_TTL_SECONDS = 300;
export const GITHUB_STATS_BACKUP_TTL_SECONDS = 86400;

const PLACEHOLDER_GITHUB_USERNAMES = new Set([
  "",
  "your_username",
  "your-github-username",
  "github_username",
  "changeme",
]);

export function hasValidHttpUrl(value) {
  if (typeof value !== "string" || value.trim() === "") {
    return false;
  }

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function hasValidSentryDsn(value) {
  if (!hasValidHttpUrl(value)) {
    return false;
  }

  try {
    const url = new URL(value);
    const pathSegments = url.pathname.split("/").filter(Boolean);
    const projectId = pathSegments[pathSegments.length - 1];

    return url.username !== "" && /^\d+$/.test(projectId ?? "");
  } catch {
    return false;
  }
}

export function resolveGithubUsername(value) {
  const normalized = String(value ?? "").trim();

  if (PLACEHOLDER_GITHUB_USERNAMES.has(normalized.toLowerCase())) {
    return DEFAULT_GITHUB_USERNAME;
  }

  return normalized;
}

export function getGithubProfileUrl(username = DEFAULT_GITHUB_USERNAME) {
  return `https://github.com/${resolveGithubUsername(username)}`;
}

export function getGithubStatsCacheKey(type, username = DEFAULT_GITHUB_USERNAME) {
  const normalizedUsername = resolveGithubUsername(username).replace(/[^a-zA-Z0-9_-]/g, "_");
  return `github_stats:${normalizedUsername}:${type}`;
}

function toSafeNonNegativeNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

export function normalizeGithubUser(ghData, username = DEFAULT_GITHUB_USERNAME) {
  return {
    followers: toSafeNonNegativeNumber(ghData?.followers),
    publicRepos: toSafeNonNegativeNumber(ghData?.public_repos),
    profileUrl: hasValidHttpUrl(ghData?.html_url)
      ? ghData.html_url
      : getGithubProfileUrl(username),
  };
}

export function createGithubStatsEnvelope(data, { cached, stale = false }) {
  return {
    source: GITHUB_STATS_SOURCE,
    cached: Boolean(cached),
    stale: Boolean(stale),
    data,
  };
}

export function isGithubStatsEnvelope(value) {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value;
  const data = candidate.data;

  return (
    candidate.source === GITHUB_STATS_SOURCE &&
    typeof candidate.cached === "boolean" &&
    typeof candidate.stale === "boolean" &&
    data &&
    typeof data === "object" &&
    typeof data.followers === "number" &&
    typeof data.publicRepos === "number" &&
    hasValidHttpUrl(data.profileUrl)
  );
}

export function createAbortError(message) {
  const error = new Error(message);
  error.name = "AbortError";
  return error;
}
