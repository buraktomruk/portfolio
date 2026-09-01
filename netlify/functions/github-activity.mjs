import { summarizeGithubActivity } from "../../src/shared/githubStats.js";
import {
  createGithubContext,
  fetchGithubJson,
  respondFromBackupCache,
  respondFromFreshCache,
  respondWithGithubData,
  respondWithGithubFailure,
} from "./_github.mjs";

export const handler = async (event) => {
  const context = createGithubContext(event, {
    kind: "activity",
    cacheKeyPrefix: "activity_v3",
    rateLimitPrefix: "rl_portfolio_activity",
  });

  const rateLimitResponse = await context.enforceRateLimit();
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  const freshCache = await context.getFreshCache();
  if (freshCache) {
    return respondFromFreshCache(context, freshCache);
  }

  try {
    const githubEvents = await fetchGithubJson(
      context.token
        ? `https://api.github.com/users/${context.username}/events?per_page=100`
        : `https://api.github.com/users/${context.username}/events/public?per_page=100`,
      context.token,
    );

    return respondWithGithubData(
      context,
      summarizeGithubActivity(githubEvents, {
        includePrivateAggregates: Boolean(context.token),
      }),
    );
  } catch (error) {
    context.captureServerError(error);

    const backupCache = await context.getBackupCache();
    if (backupCache) {
      return respondFromBackupCache(context, backupCache);
    }

    return respondWithGithubFailure(context, error);
  }
};
