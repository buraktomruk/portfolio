export const GITHUB_STATS_ENDPOINT = "/.netlify/functions/github-stats";
export const GITHUB_STATS_SOURCE = "github";
export const GITHUB_STATS_TIMEOUT_MS = 12000;
export const DEFAULT_GITHUB_USERNAME = "buraktomruk";
export const GITHUB_STATS_RATE_LIMIT_WINDOW_SECONDS = 60;
export const GITHUB_STATS_RATE_LIMIT_MAX_REQUESTS = 20;
export const GITHUB_STATS_FRESH_TTL_SECONDS = 300;
export const GITHUB_STATS_BACKUP_TTL_SECONDS = 86400;

export const GITHUB_PROJECTS_ENDPOINT = "/.netlify/functions/github-projects";
export const GITHUB_PROJECTS_MAX_DISPLAY = 4;
export const GITHUB_ACTIVITY_ENDPOINT = "/.netlify/functions/github-activity";
export const GITHUB_ACTIVITY_MAX_DISPLAY = 4;
export const GITHUB_ACTIVITY_WINDOW_DAYS = 28;
export const GITHUB_ACTIVITY_RECENT_DAYS = 30;
export const DEFAULT_GITHUB_PINNED_REPOS = [
  "portfolio",
  "react-initializer",
  "rgb-lidar-based-scene-flow",
];

const PLACEHOLDER_GITHUB_USERNAMES = new Set([
  "",
  "your_username",
  "your-github-username",
  "github_username",
  "github-user",
  "changeme",
]);

const PLACEHOLDER_SECRET_VALUES = new Set([
  "",
  "changeme",
  "your_token",
  "your-token",
  "github_token",
  "token_here",
  "replace-me",
  "placeholder",
  "upstash_token",
  "your_upstash_token",
  "ghp_yourtokenhere",
  "github_pat_yourtokenhere",
]);

function normalizeOptionalString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function toSafeNonNegativeNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function toSafeString(value) {
  const normalized = normalizeOptionalString(value);
  return normalized === "" ? null : normalized;
}

function toSafeTimestamp(value) {
  const normalized = normalizeOptionalString(value);
  if (!normalized) {
    return null;
  }

  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toISOString();
}

function isPlaceholderSecretValue(value) {
  return PLACEHOLDER_SECRET_VALUES.has(normalizeOptionalString(value).toLowerCase());
}

function normalizePinnedRepoValue(value) {
  const normalized = normalizeOptionalString(value);
  if (!normalized) {
    return null;
  }

  const withoutOwner = normalized.includes("/") ? normalized.split("/").pop() : normalized;
  const repoName = normalizeOptionalString(withoutOwner);
  return repoName ? repoName.toLowerCase() : null;
}

function getRepoTimestamp(repo) {
  return toSafeTimestamp(repo?.pushed_at) ?? toSafeTimestamp(repo?.updated_at);
}

function getRepoScore(repo) {
  const stars = Math.min(toSafeNonNegativeNumber(repo?.stargazers_count), 200);
  const forks = Math.min(toSafeNonNegativeNumber(repo?.forks_count), 100);
  const hasDescription = Boolean(toSafeString(repo?.description));
  const hasHomepage = hasValidHttpUrl(repo?.homepage);
  const hasLanguage = Boolean(toSafeString(repo?.language));
  const pushedAt = getRepoTimestamp(repo);
  const recencyWeight = pushedAt ? Math.max(0, 365 - Math.floor((Date.now() - new Date(pushedAt).getTime()) / 86400000)) : 0;

  return (
    stars * 5 +
    forks * 2 +
    recencyWeight +
    (hasDescription ? 30 : 0) +
    (hasHomepage ? 14 : 0) +
    (hasLanguage ? 4 : 0)
  );
}

function isDisplayableGithubRepo(repo) {
  const name = toSafeString(repo?.name);
  return Boolean(
    name &&
      !repo?.fork &&
      !repo?.archived &&
      !repo?.private &&
      (hasValidHttpUrl(repo?.html_url) || toSafeString(repo?.full_name)),
  );
}

function resolveGithubRepoFullName(repo, fallbackUsername = DEFAULT_GITHUB_USERNAME) {
  const explicitFullName = toSafeString(repo?.full_name);
  if (explicitFullName) {
    return explicitFullName;
  }

  const repoName = toSafeString(repo?.name);
  if (!repoName) {
    return null;
  }

  const ownerLogin = toSafeString(repo?.owner?.login) ?? resolveGithubUsername(fallbackUsername);
  return `${ownerLogin}/${repoName}`;
}

function isBaseGithubEnvelope(value, kind) {
  return Boolean(
    value &&
      typeof value === "object" &&
      value.source === GITHUB_STATS_SOURCE &&
      value.kind === kind &&
      typeof value.cached === "boolean" &&
      typeof value.stale === "boolean" &&
      typeof value.generatedAt === "string",
  );
}

function getActivityTargetUrl(event, repoUrl) {
  const pullRequestUrl = event?.payload?.pull_request?.html_url;
  if (hasValidHttpUrl(pullRequestUrl)) {
    return pullRequestUrl;
  }

  const reviewUrl = event?.payload?.review?.html_url;
  if (hasValidHttpUrl(reviewUrl)) {
    return reviewUrl;
  }

  const issueUrl = event?.payload?.issue?.html_url;
  if (hasValidHttpUrl(issueUrl)) {
    return issueUrl;
  }

  const commentUrl = event?.payload?.comment?.html_url;
  if (hasValidHttpUrl(commentUrl)) {
    return commentUrl;
  }

  const releaseUrl = event?.payload?.release?.html_url;
  if (hasValidHttpUrl(releaseUrl)) {
    return releaseUrl;
  }

  return repoUrl;
}

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
  const normalized = normalizeOptionalString(value);
  const isValidUsername = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i.test(normalized);

  if (!normalized || PLACEHOLDER_GITHUB_USERNAMES.has(normalized.toLowerCase()) || !isValidUsername) {
    return DEFAULT_GITHUB_USERNAME;
  }

  return normalized;
}

export function resolveOptionalGithubToken(value) {
  const normalized = normalizeOptionalString(value).replace(/^Bearer\s+/i, "");

  if (!normalized || isPlaceholderSecretValue(normalized) || /\s/.test(normalized)) {
    return undefined;
  }

  if (/^(github_pat|gh[pousr])_[A-Za-z0-9_]+$/.test(normalized)) {
    return normalized;
  }

  return normalized;
}

export function resolveOptionalRedisToken(value) {
  const normalized = normalizeOptionalString(value);
  if (!normalized || isPlaceholderSecretValue(normalized)) {
    return undefined;
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

export function normalizeGithubUser(ghData, username = DEFAULT_GITHUB_USERNAME) {
  const login = toSafeString(ghData?.login) ?? resolveGithubUsername(username);
  const profileUrl = hasValidHttpUrl(ghData?.html_url)
    ? ghData.html_url
    : getGithubProfileUrl(login);

  return {
    login,
    name: toSafeString(ghData?.name) ?? login,
    bio: toSafeString(ghData?.bio),
    avatarUrl: hasValidHttpUrl(ghData?.avatar_url) ? ghData.avatar_url : null,
    location: toSafeString(ghData?.location),
    followers: toSafeNonNegativeNumber(ghData?.followers),
    following: toSafeNonNegativeNumber(ghData?.following),
    publicRepos: toSafeNonNegativeNumber(ghData?.public_repos),
    publicGists: toSafeNonNegativeNumber(ghData?.public_gists),
    totalContributionsThisYear: ghData?.totalContributionsThisYear != null
      ? toSafeNonNegativeNumber(ghData.totalContributionsThisYear)
      : null,
    profileUrl,
  };
}

export function createGithubStatsEnvelope(kind, data, { cached, stale = false } = {}) {
  return {
    source: GITHUB_STATS_SOURCE,
    kind,
    cached: Boolean(cached),
    stale: Boolean(stale),
    generatedAt: new Date().toISOString(),
    data,
  };
}

export function createGithubErrorEnvelope(kind, { code, message, profileUrl, upstreamStatus } = {}) {
  return {
    source: GITHUB_STATS_SOURCE,
    kind,
    cached: false,
    stale: false,
    generatedAt: new Date().toISOString(),
    error: {
      code: code ?? "github_unavailable",
      message: message ?? "GitHub data is temporarily unavailable.",
      profileUrl: hasValidHttpUrl(profileUrl) ? profileUrl : getGithubProfileUrl(),
      upstreamStatus: Number.isInteger(upstreamStatus) ? upstreamStatus : null,
    },
  };
}

export function isGithubStatsEnvelope(value) {
  const data = value?.data;

  return Boolean(
    isBaseGithubEnvelope(value, "stats") &&
      data &&
      typeof data === "object" &&
      typeof data.login === "string" &&
      typeof data.name === "string" &&
      (data.bio === null || typeof data.bio === "string") &&
      (data.avatarUrl === null || hasValidHttpUrl(data.avatarUrl)) &&
      (data.location === null || typeof data.location === "string") &&
      typeof data.followers === "number" &&
      typeof data.following === "number" &&
      typeof data.publicRepos === "number" &&
      typeof data.publicGists === "number" &&
      (data.totalContributionsThisYear === null || typeof data.totalContributionsThisYear === "number") &&
      hasValidHttpUrl(data.profileUrl),
  );
}

export function createAbortError(message) {
  const error = new Error(message);
  error.name = "AbortError";
  return error;
}

export function parseGithubPinnedRepos(envValue) {
  if (typeof envValue !== "string" || !envValue.trim()) {
    return [];
  }

  return [...new Set(
    envValue
      .split(",")
      .map((value) => normalizePinnedRepoValue(value))
      .filter(Boolean),
  )];
}

export function resolveGithubPinnedRepos(envValue) {
  const configuredRepos = parseGithubPinnedRepos(envValue);
  return configuredRepos.length > 0 ? configuredRepos : DEFAULT_GITHUB_PINNED_REPOS;
}

export function normalizeGithubRepo(repo, pinnedRepos = []) {
  const name = toSafeString(repo?.name);
  const fullName = resolveGithubRepoFullName(repo);

  if (!name || !fullName) {
    return null;
  }

  const pinnedLookup = new Set(Array.isArray(pinnedRepos) ? pinnedRepos : []);
  const repoUrl = hasValidHttpUrl(repo?.html_url) ? repo.html_url : getGithubRepoUrl(fullName);

  return {
    id: toSafeNonNegativeNumber(repo?.id),
    name,
    fullName,
    description: toSafeString(repo?.description),
    url: repoUrl,
    homepage: hasValidHttpUrl(repo?.homepage) ? repo.homepage : null,
    language: toSafeString(repo?.language),
    stargazersCount: toSafeNonNegativeNumber(repo?.stargazers_count),
    updatedAt: toSafeTimestamp(repo?.updated_at),
    pushedAt: toSafeTimestamp(repo?.pushed_at),
    isPinned: pinnedLookup.has(name.toLowerCase()),
  };
}

export function filterAndSortGithubRepos(repos, pinnedRepos = []) {
  if (!Array.isArray(repos)) {
    return [];
  }

  const normalizedPinnedRepos = [...new Set(
    (Array.isArray(pinnedRepos) ? pinnedRepos : [])
      .map((value) => normalizePinnedRepoValue(value))
      .filter(Boolean),
  )];

  const validRepos = repos.filter(isDisplayableGithubRepo);
  const usedRepoNames = new Set();

  const pinnedSelection = normalizedPinnedRepos
    .map((pinnedName) => validRepos.find((repo) => normalizePinnedRepoValue(repo?.name) === pinnedName))
    .filter((repo) => {
      const repoName = normalizePinnedRepoValue(repo?.name);
      if (!repoName || usedRepoNames.has(repoName)) {
        return false;
      }

      usedRepoNames.add(repoName);
      return true;
    });

  const curatedSelection = validRepos
    .filter((repo) => !usedRepoNames.has(normalizePinnedRepoValue(repo?.name)))
    .sort((repoA, repoB) => {
      const scoreDelta = getRepoScore(repoB) - getRepoScore(repoA);
      if (scoreDelta !== 0) {
        return scoreDelta;
      }

      const timestampA = getRepoTimestamp(repoA);
      const timestampB = getRepoTimestamp(repoB);
      return new Date(timestampB ?? 0).getTime() - new Date(timestampA ?? 0).getTime();
    });

  return [...pinnedSelection, ...curatedSelection]
    .slice(0, GITHUB_PROJECTS_MAX_DISPLAY)
    .map((repo) => normalizeGithubRepo(repo, normalizedPinnedRepos))
    .filter(Boolean);
}

export function isGithubProjectsEnvelope(value) {
  return Boolean(
    isBaseGithubEnvelope(value, "projects") &&
      Array.isArray(value.data) &&
      value.data.every((item) => (
        item &&
        typeof item === "object" &&
        typeof item.id === "number" &&
        typeof item.name === "string" &&
        typeof item.fullName === "string" &&
        (item.description === null || typeof item.description === "string") &&
        hasValidHttpUrl(item.url) &&
        (item.homepage === null || hasValidHttpUrl(item.homepage)) &&
        (item.language === null || typeof item.language === "string") &&
        typeof item.stargazersCount === "number" &&
        (item.updatedAt === null || typeof item.updatedAt === "string") &&
        (item.pushedAt === null || typeof item.pushedAt === "string") &&
        typeof item.isPinned === "boolean"
      )),
  );
}

export function normalizeGithubEvent(event) {
  const repoName = toSafeString(event?.repo?.name);
  const createdAt = toSafeTimestamp(event?.created_at);

  if (!repoName || !createdAt) {
    return null;
  }

  const type = toSafeString(event?.type) ?? "ActivityEvent";
  const repoUrl = getGithubRepoUrl(repoName);

  return {
    id: String(event.id ?? `${type}:${repoName}:${createdAt}`),
    type,
    repoName,
    repoUrl,
    targetUrl: getActivityTargetUrl(event, repoUrl),
    createdAt,
    summary: buildGithubActivitySummary(event),
  };
}

export function filterAndNormalizeGithubEvents(events) {
  return normalizeGithubContributionEvents(events).slice(0, GITHUB_ACTIVITY_MAX_DISPLAY);
}

export function summarizeGithubActivity(events) {
  const normalizedEvents = normalizeGithubContributionEvents(events);
  const recentEvents = normalizedEvents.filter((event) => isEventInsideRecentWindow(event?.createdAt));

  const activeDays = new Set(recentEvents.map((event) => getUtcDayKey(event.createdAt)));
  const topRepo = getTopGithubActivityRepo(recentEvents);

  return {
    entries: normalizedEvents.slice(0, GITHUB_ACTIVITY_MAX_DISPLAY),
    cadence: buildGithubActivityCadence(recentEvents),
    totals: {
      eventsLast30Days: recentEvents.length,
      activeDaysLast30Days: activeDays.size,
      lastActiveAt: normalizedEvents[0]?.createdAt ?? null,
      topRepoName: topRepo?.repoName ?? null,
      topRepoEventsLast30Days: topRepo?.count ?? 0,
    },
  };
}

export function isGithubActivityEnvelope(value) {
  return Boolean(
    isBaseGithubEnvelope(value, "activity") &&
      value.data &&
      typeof value.data === "object" &&
      Array.isArray(value.data.entries) &&
      Array.isArray(value.data.cadence) &&
      value.data.entries.every((item) => (
        item &&
        typeof item === "object" &&
        typeof item.id === "string" &&
        typeof item.type === "string" &&
        typeof item.repoName === "string" &&
        hasValidHttpUrl(item.repoUrl) &&
        hasValidHttpUrl(item.targetUrl) &&
        typeof item.createdAt === "string" &&
        typeof item.summary === "string"
      )) &&
      value.data.cadence.every((item) => (
        item &&
        typeof item === "object" &&
        typeof item.date === "string" &&
        typeof item.count === "number" &&
        typeof item.level === "number"
      )) &&
      value.data.totals &&
      typeof value.data.totals === "object" &&
      typeof value.data.totals.eventsLast30Days === "number" &&
      typeof value.data.totals.activeDaysLast30Days === "number" &&
      (value.data.totals.lastActiveAt === null || typeof value.data.totals.lastActiveAt === "string") &&
      (value.data.totals.topRepoName === null || typeof value.data.totals.topRepoName === "string") &&
      typeof value.data.totals.topRepoEventsLast30Days === "number",
  );
}

export function getGithubRepoUrl(repoName) {
  return `https://github.com/${repoName}`;
}

export function buildGithubActivitySummary(event) {
  const type = typeof event?.type === "string" ? event.type : "ActivityEvent";
  const repoName = typeof event?.repo?.name === "string" ? event.repo.name : "this repository";

  switch (type) {
    case "PushEvent":
      return formatPushSummary(event, repoName);
    case "PullRequestEvent":
      return formatPullRequestSummary(event, repoName);
    case "PullRequestReviewEvent":
      return formatReviewSummary(event, repoName);
    case "IssuesEvent":
      return formatIssueSummary(event, repoName);
    case "IssueCommentEvent":
      return `Commented on a discussion in ${repoName}`;
    case "ReleaseEvent":
      return `Published a release in ${repoName}`;
    default:
      return `Contributed publicly in ${repoName}`;
  }
}

function normalizeGithubContributionEvents(events) {
  if (!Array.isArray(events)) {
    return [];
  }

  const contributionTypes = new Set([
    "PushEvent",
    "PullRequestEvent",
    "PullRequestReviewEvent",
    "IssuesEvent",
    "IssueCommentEvent",
    "ReleaseEvent",
  ]);

  return events
    .filter((event) => event?.public !== false)
    .filter((event) => contributionTypes.has(event?.type))
    .map(normalizeGithubEvent)
    .filter(Boolean)
    .sort((eventA, eventB) => new Date(eventB.createdAt).getTime() - new Date(eventA.createdAt).getTime());
}

function buildGithubActivityCadence(events) {
  const countsByDay = new Map();

  for (const event of events) {
    const dayKey = getUtcDayKey(event?.createdAt);
    if (!dayKey) {
      continue;
    }

    countsByDay.set(dayKey, (countsByDay.get(dayKey) ?? 0) + 1);
  }

  const today = startOfUtcDay(new Date());
  const dates = [];

  for (let index = GITHUB_ACTIVITY_WINDOW_DAYS - 1; index >= 0; index -= 1) {
    const day = new Date(today);
    day.setUTCDate(day.getUTCDate() - index);
    const dateKey = getUtcDayKey(day);
    dates.push({
      date: dateKey,
      count: countsByDay.get(dateKey) ?? 0,
      level: 0,
    });
  }

  const maxCount = Math.max(...dates.map((entry) => entry.count), 0);

  return dates.map((entry) => ({
    ...entry,
    level: getCadenceLevel(entry.count, maxCount),
  }));
}

function getTopGithubActivityRepo(events) {
  const countsByRepo = new Map();

  for (const event of events) {
    const repoName = toSafeString(event?.repoName);
    if (!repoName) {
      continue;
    }

    countsByRepo.set(repoName, (countsByRepo.get(repoName) ?? 0) + 1);
  }

  let topRepo = null;
  for (const [repoName, count] of countsByRepo.entries()) {
    if (!topRepo || count > topRepo.count) {
      topRepo = { repoName, count };
    }
  }

  return topRepo;
}

function getCadenceLevel(count, maxCount) {
  if (count <= 0 || maxCount <= 0) {
    return 0;
  }

  const ratio = count / maxCount;
  if (ratio >= 0.75) {
    return 4;
  }
  if (ratio >= 0.5) {
    return 3;
  }
  if (ratio >= 0.25) {
    return 2;
  }
  return 1;
}

function isEventInsideRecentWindow(createdAt) {
  if (!createdAt) {
    return false;
  }

  const timestamp = new Date(createdAt).getTime();
  if (Number.isNaN(timestamp)) {
    return false;
  }

  const cutoff = Date.now() - (GITHUB_ACTIVITY_RECENT_DAYS * 86400000);
  return timestamp >= cutoff;
}

function startOfUtcDay(value) {
  return new Date(Date.UTC(
    value.getUTCFullYear(),
    value.getUTCMonth(),
    value.getUTCDate(),
  ));
}

function getUtcDayKey(value) {
  if (!value) {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return startOfUtcDay(date).toISOString().slice(0, 10);
}

function formatPushSummary(event, repoName) {
  const commitCount = Array.isArray(event?.payload?.commits) ? event.payload.commits.length : 0;
  if (commitCount > 1) {
    return `Pushed ${commitCount} commits to ${repoName}`;
  }
  if (commitCount === 1) {
    return `Pushed a commit to ${repoName}`;
  }
  return `Pushed updates to ${repoName}`;
}

function formatPullRequestSummary(event, repoName) {
  const action = typeof event?.payload?.action === "string" ? event.payload.action : "";
  const mergedAt = event?.payload?.pull_request?.merged_at;

  if (mergedAt) {
    return `Merged a pull request in ${repoName}`;
  }

  switch (action) {
    case "opened":
      return `Opened a pull request in ${repoName}`;
    case "closed":
      return `Closed a pull request in ${repoName}`;
    case "reopened":
      return `Reopened a pull request in ${repoName}`;
    case "synchronize":
      return `Updated a pull request in ${repoName}`;
    default:
      return `Worked on a pull request in ${repoName}`;
  }
}

function formatReviewSummary(event, repoName) {
  const state = String(event?.payload?.review?.state ?? "").toLowerCase();
  switch (state) {
    case "approved":
      return `Approved a pull request in ${repoName}`;
    case "changes_requested":
      return `Requested changes in ${repoName}`;
    case "commented":
      return `Reviewed a pull request in ${repoName}`;
    default:
      return `Reviewed a pull request in ${repoName}`;
  }
}

function formatIssueSummary(event, repoName) {
  const action = typeof event?.payload?.action === "string" ? event.payload.action : "";
  switch (action) {
    case "opened":
      return `Opened an issue in ${repoName}`;
    case "closed":
      return `Closed an issue in ${repoName}`;
    case "reopened":
      return `Reopened an issue in ${repoName}`;
    default:
      return `Updated an issue in ${repoName}`;
  }
}
