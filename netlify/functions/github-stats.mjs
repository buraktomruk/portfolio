import { fetchGithubGraphql } from "./_github.mjs";
import { normalizeGithubUser } from "../../src/shared/githubStats.js";
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
    kind: "stats",
    cacheKeyPrefix: "stats",
    rateLimitPrefix: "rl_portfolio_stats",
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
    const year = new Date().getUTCFullYear();
    const startOfYear = `${year}-01-01T00:00:00Z`;
    const endOfNow = new Date().toISOString();
    const [githubUser, githubContributionData] = await Promise.all([
      fetchGithubJson(
        `https://api.github.com/users/${context.username}`,
        context.token,
      ),
      context.token
        ? fetchGithubGraphql(
            `
              query($login: String!, $from: DateTime!, $to: DateTime!) {
                user(login: $login) {
                  contributionsCollection(from: $from, to: $to) {
                    contributionCalendar {
                      totalContributions
                    }
                  }
                }
              }
            `,
            {
              login: context.username,
              from: startOfYear,
              to: endOfNow,
            },
            context.token,
          )
        : Promise.resolve(null),
    ]);

    const totalContributionsThisYear = Number(
      githubContributionData?.data?.user?.contributionsCollection?.contributionCalendar?.totalContributions ?? 0,
    );

    return respondWithGithubData(
      context,
      normalizeGithubUser(
        {
          ...githubUser,
          totalContributionsThisYear,
        },
        context.username,
      ),
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
