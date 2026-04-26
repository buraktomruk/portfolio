import {
  filterAndSortGithubRepos,
  resolveGithubPinnedRepos,
} from "../../src/shared/githubStats.js";
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
    kind: "projects",
    cacheKeyPrefix: "projects",
    rateLimitPrefix: "rl_portfolio_projects",
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
    const githubRepos = await fetchGithubJson(
      `https://api.github.com/users/${context.username}/repos?sort=updated&per_page=50`,
      context.token,
    );
    const pinnedRepos = resolveGithubPinnedRepos(process.env.GITHUB_PINNED_REPOS);
    const curatedRepos = filterAndSortGithubRepos(githubRepos, pinnedRepos);

    return respondWithGithubData(context, curatedRepos);
  } catch (error) {
    context.captureServerError(error);

    const backupCache = await context.getBackupCache();
    if (backupCache) {
      return respondFromBackupCache(context, backupCache);
    }

    return respondWithGithubFailure(context, error);
  }
};
