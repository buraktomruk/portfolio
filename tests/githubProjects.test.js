import { test } from 'node:test';
import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import {
  createGithubStatsEnvelope,
  filterAndSortGithubRepos,
  isGithubActivityEnvelope,
  parseGithubPinnedRepos,
  resolveGithubPinnedRepos,
  resolveGithubUsername,
  resolveOptionalGithubToken,
  resolveOptionalRedisToken,
  summarizeGithubActivity,
} from '../src/shared/githubStats.js';

function githubEvent({
  id,
  repoName = 'buraktomruk/portfolio',
  type = 'PushEvent',
  createdAt = new Date().toISOString(),
  isPublic = true,
  payload = {},
}) {
  return {
    id,
    type,
    public: isPublic,
    repo: {
      name: repoName,
    },
    created_at: createdAt,
    payload,
  };
}

function daysAgo(days) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString();
}

test('parseGithubPinnedRepos parses correctly', () => {
  assert.deepStrictEqual(parseGithubPinnedRepos('repo1, repo2,repo3 '), ['repo1', 'repo2', 'repo3']);
  assert.deepStrictEqual(parseGithubPinnedRepos('buraktomruk/repo1, Repo2'), ['repo1', 'repo2']);
  assert.deepStrictEqual(parseGithubPinnedRepos(''), []);
  assert.deepStrictEqual(parseGithubPinnedRepos(null), []);
});

test('resolveGithubPinnedRepos falls back to curated defaults', () => {
  assert.deepStrictEqual(
    resolveGithubPinnedRepos(''),
    ['portfolio', 'react-initializer', 'rgb-lidar-based-scene-flow'],
  );
});

test('filterAndSortGithubRepos excludes forks and archived repos', () => {
  const repos = [
    { name: 'repo1', fork: true, archived: false },
    { name: 'repo2', fork: false, archived: true },
    { name: 'repo3', fork: false, archived: false, description: 'desc', updated_at: '2023-01-01T00:00:00Z', stargazers_count: 10, html_url: 'http://test' },
  ];
  
  const result = filterAndSortGithubRepos(repos);
  assert.strictEqual(result.length, 1);
  assert.strictEqual(result[0].name, 'repo3');
});

test('filterAndSortGithubRepos respects pinned repos', () => {
  const repos = [
    { id: 1, name: 'repo1', html_url: 'https://github.com/test/repo1', fork: false, archived: false, description: 'desc', updated_at: '2023-01-01T00:00:00Z' },
    { id: 2, name: 'repo2', html_url: 'https://github.com/test/repo2', fork: false, archived: false, description: 'desc', updated_at: '2023-02-01T00:00:00Z' },
    { id: 3, name: 'repo3', html_url: 'https://github.com/test/repo3', fork: false, archived: false, description: 'desc', updated_at: '2023-03-01T00:00:00Z' },
  ];

  const result = filterAndSortGithubRepos(repos, ['repo2']);
  assert.strictEqual(result.length, 3);
  assert.strictEqual(result[0].name, 'repo2');
  assert.strictEqual(result[0].isPinned, true);
});

test('filterAndSortGithubRepos falls back to newest non-forks with description', () => {
  const repos = [
    { id: 1, name: 'repo1', html_url: 'https://github.com/test/repo1', fork: false, archived: false, description: 'desc1', updated_at: '2023-01-01T00:00:00Z' },
    { id: 2, name: 'repo2', html_url: 'https://github.com/test/repo2', fork: false, archived: false, description: 'desc2', updated_at: '2023-03-01T00:00:00Z' },
    { id: 3, name: 'repo3', html_url: 'https://github.com/test/repo3', fork: false, archived: false, description: '', updated_at: '2023-05-01T00:00:00Z' },
  ];

  const result = filterAndSortGithubRepos(repos);
  assert.strictEqual(result.length, 3);
  assert.strictEqual(result[0].name, 'repo2');
  assert.strictEqual(result[1].name, 'repo1');
  assert.strictEqual(result[2].name, 'repo3');
});

test('invalid usernames and placeholder tokens are ignored safely', () => {
  const syntheticGithubToken = `gh${'p'}_abcdefghijklmnopqrstuvwxyz123456`;

  assert.strictEqual(resolveGithubUsername('your_username'), 'buraktomruk');
  assert.strictEqual(resolveGithubUsername('not valid'), 'buraktomruk');
  assert.strictEqual(resolveOptionalGithubToken('your-token'), undefined);
  assert.strictEqual(resolveOptionalGithubToken(`Bearer ${syntheticGithubToken}`), syntheticGithubToken);
  assert.strictEqual(resolveOptionalRedisToken('placeholder'), undefined);
  assert.strictEqual(resolveOptionalRedisToken('upstash-real-token'), 'upstash-real-token');
});

test('summarizeGithubActivity calculates the most active recent repo', () => {
  const summary = summarizeGithubActivity([
    githubEvent({ id: '1', repoName: 'buraktomruk/portfolio', createdAt: daysAgo(1) }),
    githubEvent({ id: '2', repoName: 'buraktomruk/portfolio', createdAt: daysAgo(2) }),
    githubEvent({ id: '3', repoName: 'buraktomruk/react-initializer', createdAt: daysAgo(3) }),
    githubEvent({ id: '4', repoName: 'buraktomruk/old-work', createdAt: daysAgo(40) }),
  ]);

  assert.strictEqual(summary.totals.eventsLast30Days, 3);
  assert.strictEqual(summary.totals.topRepoName, 'buraktomruk/portfolio');
  assert.strictEqual(summary.totals.topRepoEventsLast30Days, 2);
});

test('summarizeGithubActivity returns quiet totals for empty activity', () => {
  const summary = summarizeGithubActivity([]);

  assert.deepStrictEqual(summary.entries, []);
  assert.strictEqual(summary.cadence.length, 28);
  assert.strictEqual(summary.totals.eventsLast30Days, 0);
  assert.strictEqual(summary.totals.activeDaysLast30Days, 0);
  assert.strictEqual(summary.totals.lastActiveAt, null);
  assert.strictEqual(summary.totals.topRepoName, null);
  assert.strictEqual(summary.totals.topRepoEventsLast30Days, 0);
});

test('summarizeGithubActivity ignores invalid and non-contribution events safely', () => {
  const summary = summarizeGithubActivity([
    githubEvent({ id: '1', createdAt: 'not-a-date' }),
    githubEvent({ id: '2', type: 'WatchEvent', createdAt: daysAgo(1) }),
    githubEvent({ id: '3', isPublic: false, createdAt: daysAgo(1) }),
    githubEvent({ id: '4', repoName: '', createdAt: daysAgo(1) }),
    githubEvent({ id: '5', repoName: 'buraktomruk/portfolio', createdAt: daysAgo(1) }),
  ]);

  assert.strictEqual(summary.entries.length, 1);
  assert.strictEqual(summary.totals.eventsLast30Days, 1);
  assert.strictEqual(summary.totals.topRepoName, 'buraktomruk/portfolio');
});

test('isGithubActivityEnvelope accepts the current activity totals shape', () => {
  const summary = summarizeGithubActivity([
    githubEvent({ id: '1', repoName: 'buraktomruk/portfolio', createdAt: daysAgo(1) }),
  ]);
  const envelope = createGithubStatsEnvelope('activity', summary, { cached: false });

  assert.strictEqual(isGithubActivityEnvelope(envelope), true);
});

test('isGithubActivityEnvelope rejects old activity totals without top repo fields', () => {
  const envelope = createGithubStatsEnvelope('activity', {
    entries: [],
    cadence: [],
    totals: {
      eventsLast30Days: 0,
      activeDaysLast30Days: 0,
      lastActiveAt: null,
    },
  }, { cached: false });

  assert.strictEqual(isGithubActivityEnvelope(envelope), false);
});

const __dirname = dirname(fileURLToPath(import.meta.url));
function loadLocale(lang) {
  const path = resolve(__dirname, `../src/i18n/locales/${lang}/translation.json`);
  return JSON.parse(readFileSync(path, 'utf8'));
}

const REQUIRED_GITHUB_FALLBACK_KEYS = [
  'githubSignalKicker',
  'githubBadgeLive',
  'githubBadgeCached',
  'githubBadgeFallback',
  'githubBadgeLoading',
  'githubCardActivity',
  'githubCardRepos',
  'githubCardMomentum',
  'githubLiveNote',
  'githubCachedNote',
  'githubFallbackNote',
];

test('GitHub Activity fallback i18n keys exist in EN and DE', async () => {
  const { curatedFallbackHighlights } = await import('../src/data/featuredWork.js');
  for (const lang of ['en', 'de']) {
    const projects = loadLocale(lang).projects;
    for (const key of REQUIRED_GITHUB_FALLBACK_KEYS) {
      assert.ok(
        typeof projects[key] === 'string' && projects[key].trim().length > 0,
        `Missing or empty i18n key projects.${key} in ${lang}`,
      );
    }
    for (const { id, titleKey, captionKey } of curatedFallbackHighlights) {
      assert.ok(projects.githubFallback?.[id]?.title, `Missing githubFallback.${id}.title in ${lang}`);
      assert.ok(projects.githubFallback?.[id]?.caption, `Missing githubFallback.${id}.caption in ${lang}`);
      assert.strictEqual(titleKey, `projects.githubFallback.${id}.title`);
      assert.strictEqual(captionKey, `projects.githubFallback.${id}.caption`);
    }
    assert.ok(projects.githubMomentumFallback?.releaseHardening, `Missing githubMomentumFallback.releaseHardening in ${lang}`);
    assert.ok(projects.githubMomentumFallback?.dataCorrectness, `Missing githubMomentumFallback.dataCorrectness in ${lang}`);
    assert.ok(projects.githubMomentumFallback?.systemDesign, `Missing githubMomentumFallback.systemDesign in ${lang}`);
  }
});

test('GitHub Activity fallback note never overstates production readiness', async () => {
  const { curatedFallbackHighlights } = await import('../src/data/featuredWork.js');
  const forbiddenSubstrings = [
    'production-ready',
    'production ready',
    'enterprise-grade',
    'shipped saas',
    'launched product',
    'fully shipped',
  ];
  for (const lang of ['en', 'de']) {
    const projects = loadLocale(lang).projects;
    const corpus = [
      projects.githubFallbackNote,
      projects.githubLiveNote,
      projects.githubCachedNote,
      ...curatedFallbackHighlights.map(({ id }) => projects.githubFallback?.[id]?.caption),
      projects.githubMomentumFallback?.releaseHardening,
      projects.githubMomentumFallback?.dataCorrectness,
      projects.githubMomentumFallback?.systemDesign,
    ].filter(Boolean).join(' \n ').toLowerCase();
    for (const phrase of forbiddenSubstrings) {
      assert.ok(!corpus.includes(phrase), `Fallback copy in ${lang} must not include "${phrase}"`);
    }
  }
});

test('summarizeGithubActivity returns a safe envelope when activity array is missing', () => {
  const summary = summarizeGithubActivity(undefined);
  assert.ok(Array.isArray(summary.entries));
  assert.strictEqual(summary.entries.length, 0);
  assert.strictEqual(summary.totals.eventsLast30Days, 0);
});

test('every featured and secondary build has complete EN and DE case-study copy', async () => {
  const { featuredWorkItems, secondaryWorkItems } = await import('../src/data/featuredWork.js');
  const items = [...featuredWorkItems, ...secondaryWorkItems];
  assert.ok(items.length > 0);

  for (const lang of ['en', 'de']) {
    const projects = loadLocale(lang).projects;
    for (const item of items) {
      const study = projects.caseStudies?.[item.id];
      assert.ok(study, `Missing projects.caseStudies.${item.id} in ${lang}`);
      for (const field of ['typeLabel', 'summary', 'readinessNote']) {
        assert.ok(
          typeof study[field] === 'string' && study[field].trim().length > 0,
          `Missing projects.caseStudies.${item.id}.${field} in ${lang}`,
        );
      }
      assert.ok(
        Array.isArray(study.highlights) && study.highlights.length === 3,
        `projects.caseStudies.${item.id}.highlights must hold exactly 3 entries in ${lang}`,
      );
      assert.ok(
        typeof projects.statusLabels?.[item.statusKey] === 'string'
          && projects.statusLabels[item.statusKey].trim().length > 0,
        `Missing projects.statusLabels.${item.statusKey} in ${lang}`,
      );
      const ctaKey = item.ctaKey.replace(/^projects\./, '');
      assert.ok(
        typeof projects[ctaKey] === 'string' && projects[ctaKey].trim().length > 0,
        `Missing projects.${ctaKey} in ${lang}`,
      );
    }
  }
});

test('featured build demo URLs are safe absolute URLs', async () => {
  const { featuredWorkItems, secondaryWorkItems } = await import('../src/data/featuredWork.js');
  for (const item of [...featuredWorkItems, ...secondaryWorkItems]) {
    assert.ok(item.demoUrl === null || typeof item.demoUrl === 'string', `${item.id} demoUrl must be a string or null`);
    if (item.demoUrl) {
      const url = new URL(item.demoUrl);
      assert.strictEqual(url.protocol, 'https:', `${item.id} demoUrl must use https`);
      assert.ok(!/example\.|placeholder|localhost|TODO/i.test(item.demoUrl), `${item.id} demoUrl looks like a placeholder`);
    }
    assert.ok(item.repoUrl === null || /^https:\/\//.test(item.repoUrl), `${item.id} repoUrl must be https or null`);
  }
});

test('summarizeGithubActivity deduplicates noisy same-target activity', () => {
  const prUrl = 'https://github.com/buraktomruk/portfolio/pull/42';
  const events = [
    githubEvent({ id: '1', type: 'PullRequestEvent', repoName: 'buraktomruk/portfolio', createdAt: daysAgo(1), payload: { action: 'opened', pull_request: { html_url: prUrl, title: 'Test PR' } } }),
    githubEvent({ id: '2', type: 'PullRequestEvent', repoName: 'buraktomruk/portfolio', createdAt: daysAgo(1), payload: { action: 'synchronize', pull_request: { html_url: prUrl, title: 'Test PR' } } }),
    githubEvent({ id: '3', type: 'PullRequestEvent', repoName: 'buraktomruk/portfolio', createdAt: daysAgo(1), payload: { action: 'synchronize', pull_request: { html_url: prUrl, title: 'Test PR' } } }),
    githubEvent({ id: '4', type: 'PushEvent', repoName: 'buraktomruk/portfolio', createdAt: daysAgo(2), payload: { commits: [{}, {}] } }),
  ];
  const summary = summarizeGithubActivity(events);
  // 4 raw events but same PR URL should collapse to at most 2 entries (one PR + one push)
  assert.ok(summary.entries.length <= 2, `Expected deduped entries <=2, got ${summary.entries.length}`);
  const prEntries = summary.entries.filter((e) => e.targetUrl === prUrl);
  assert.strictEqual(prEntries.length, 1, 'Same PR target should dedup to single entry');
});

test('summarizeGithubActivity caps displayed entries at 4', () => {
  const events = Array.from({ length: 10 }, (_, i) => githubEvent({
    id: String(i),
    type: 'PushEvent',
    repoName: `buraktomruk/repo-${i}`,
    createdAt: daysAgo(i),
    payload: { commits: [{}] },
  }));
  const summary = summarizeGithubActivity(events);
  assert.ok(summary.entries.length <= 4, `Expected max 4 entries, got ${summary.entries.length}`);
});

test('private events never emit private repo names or URLs', () => {
  const privateRepo = 'buraktomruk/private-secret-repo';
  const privatePayload = {
    pull_request: { html_url: 'https://github.com/buraktomruk/private-secret-repo/pull/1', title: 'Secret' },
  };
  const summaryPublicOnly = summarizeGithubActivity([
    githubEvent({ id: '1', isPublic: false, repoName: privateRepo, createdAt: daysAgo(1), payload: privatePayload }),
    githubEvent({ id: '2', isPublic: true, repoName: 'buraktomruk/portfolio', createdAt: daysAgo(1), payload: {} }),
  ]);
  // entries must not contain private repo
  assert.ok(!summaryPublicOnly.entries.some((e) => e.repoName === privateRepo), 'Private repo name leaked in entries');
  assert.ok(!summaryPublicOnly.entries.some((e) => e.targetUrl.includes('private-secret')), 'Private URL leaked in entries');
  assert.strictEqual(summaryPublicOnly.totals.privateActivityCount, null, 'Private count should be null when not in authenticated mode');
  // with authenticated mode, aggregates count private but still not leak names
  const summaryAuth = summarizeGithubActivity([
    githubEvent({ id: '1', isPublic: false, repoName: privateRepo, createdAt: daysAgo(1), payload: privatePayload }),
    githubEvent({ id: '2', isPublic: true, repoName: 'buraktomruk/portfolio', createdAt: daysAgo(1), payload: {} }),
  ], { includePrivateAggregates: true });
  assert.strictEqual(summaryAuth.totals.privateActivityCount, 1);
  assert.ok(!summaryAuth.entries.some((e) => e.repoName === privateRepo), 'Private repo leaked even in auth mode');
  // verify no raw payload fields in entries
  for (const entry of summaryAuth.entries) {
    assert.ok(!('payload' in entry), 'Raw payload leaked');
    assert.ok(!('public' in entry), 'Public flag leaked');
  }
});

test('buildGithubSignalMetrics omits null contributions but preserves numeric zero', async () => {
  const { buildGithubSignalMetrics } = await import('../src/shared/githubStats.js');
  const withNull = buildGithubSignalMetrics({
    activeProductCount: 5,
    activityTotals: { eventsLast30Days: 3, activeDaysLast30Days: 2 },
    publicRepos: 7,
    totalContributionsThisYear: null,
  });
  assert.ok(!withNull.some((m) => m.key === 'contributions'), 'null contributions should be omitted');
  const withZero = buildGithubSignalMetrics({
    activeProductCount: 5,
    activityTotals: { eventsLast30Days: 3, activeDaysLast30Days: 2 },
    publicRepos: 7,
    totalContributionsThisYear: 0,
  });
  const zeroMetric = withZero.find((m) => m.key === 'contributions');
  assert.ok(zeroMetric, 'zero contributions should be preserved');
  assert.strictEqual(zeroMetric.value, 0);
});

test('activeProductCount derives from featured + secondary work items', async () => {
  const { activeProductCount, featuredWorkItems, secondaryWorkItems } = await import('../src/data/featuredWork.js');
  assert.strictEqual(activeProductCount, featuredWorkItems.length + secondaryWorkItems.length);
  assert.strictEqual(activeProductCount, 5);
});

test('filterAndSortGithubRepos never exposes private repos', () => {
  const repos = [
    { id: 1, name: 'public-repo', private: false, fork: false, archived: false, html_url: 'https://github.com/buraktomruk/public-repo', description: 'ok', stargazers_count: 5, updated_at: '2024-01-01T00:00:00Z' },
    { id: 2, name: 'private-repo', private: true, fork: false, archived: false, html_url: 'https://github.com/buraktomruk/private-repo', description: 'secret', stargazers_count: 10, updated_at: '2024-01-02T00:00:00Z' },
  ];
  const result = filterAndSortGithubRepos(repos);
  assert.ok(!result.some((r) => r.name === 'private-repo'), 'Private repo leaked');
  assert.ok(result.some((r) => r.name === 'public-repo'));
});

test('Build Momentum is always visible in Projects.jsx', () => {
  const projectsSrc = readFileSync(resolve(__dirname, '../src/components/Projects.jsx'), 'utf8');
  // Must contain momentum theme keys and be rendered unconditionally (not inside showCuratedFallback conditional)
  assert.ok(projectsSrc.includes('engineeringMomentumThemeKeys'), 'Build Momentum theme keys missing');
  assert.ok(projectsSrc.includes('githubCardMomentum'), 'Build Momentum card missing');
  assert.ok(projectsSrc.includes('githubMomentumFallback'), 'Build Momentum fallback copy missing');
  // Ensure momentum card is not gated behind activity fallback condition
  const momentumIndex = projectsSrc.indexOf('githubCardMomentum');
  const fallbackConditional = projectsSrc.indexOf('showCuratedFallback');
  assert.ok(fallbackConditional === -1 || momentumIndex < fallbackConditional || projectsSrc.slice(momentumIndex - 500, momentumIndex + 500).indexOf('showCuratedFallback') === -1, 'Build Momentum should not be conditional on fallback');
  // Cards should include Public code wording
  assert.ok(projectsSrc.includes('Public code') || readFileSync(resolve(__dirname, '../src/i18n/locales/en/translation.json'), 'utf8').includes('Public code'), 'Public code wording missing');
});

test('EN/DE translations have matching Public code and momentum copy', () => {
  const en = loadLocale('en');
  const de = loadLocale('de');
  assert.strictEqual(en.projects.githubCardRepos, 'Public code');
  assert.strictEqual(de.projects.githubCardRepos, 'Öffentlicher Code');
  assert.strictEqual(en.projects.repoTitle, 'Public Code');
  assert.strictEqual(de.projects.repoTitle, 'Öffentlicher Code');
  assert.ok(en.projects.githubLiveNote.includes('Public GitHub activity, complemented by engineering signals'));
  assert.ok(de.projects.githubLiveNote.includes('Öffentliche GitHub-Aktivität, ergänzt durch Engineering-Signale'));
});

test('strict public===true fail-closed visibility', () => {
  const sensitiveTitle = 'Sensitive PR Title Should Not Leak';
  const sensitiveUrl = 'https://github.com/buraktomruk/private-sensitive-repo/pull/999';
  const sensitiveRepo = 'buraktomruk/private-sensitive-repo';
  // A public:true event must be emitted
  const publicEvent = githubEvent({ id: 'pub1', isPublic: true, repoName: 'buraktomruk/portfolio', createdAt: daysAgo(1), payload: { pull_request: { html_url: 'https://github.com/buraktomruk/portfolio/pull/1', title: 'Public PR' } } });
  const summaryPub = summarizeGithubActivity([publicEvent]);
  assert.strictEqual(summaryPub.entries.length, 1);
  assert.strictEqual(summaryPub.entries[0].repoName, 'buraktomruk/portfolio');
  // public:false must not emit
  const privateEvent = githubEvent({ id: 'priv1', isPublic: false, repoName: sensitiveRepo, createdAt: daysAgo(1), payload: { pull_request: { html_url: sensitiveUrl, title: sensitiveTitle } } });
  const summaryPriv = summarizeGithubActivity([privateEvent]);
  assert.strictEqual(summaryPriv.entries.length, 0);
  assert.ok(!JSON.stringify(summaryPriv).includes(sensitiveRepo));
  assert.ok(!JSON.stringify(summaryPriv).includes(sensitiveTitle));
  // public missing (undefined) must not emit - fail closed
  const missingEvent = { id: 'miss1', type: 'PullRequestEvent', repo: { name: sensitiveRepo }, created_at: daysAgo(1), payload: { pull_request: { html_url: sensitiveUrl, title: sensitiveTitle } } };
  // intentionally omit public property
  const summaryMissing = summarizeGithubActivity([missingEvent]);
  assert.strictEqual(summaryMissing.entries.length, 0, 'missing public field must not emit');
  assert.ok(!JSON.stringify(summaryMissing).includes(sensitiveRepo), 'missing visibility leaked repo');
  assert.ok(!JSON.stringify(summaryMissing).includes(sensitiveTitle), 'missing visibility leaked title');
  assert.ok(!JSON.stringify(summaryMissing.entries).includes(sensitiveUrl), 'missing visibility leaked URL');
  // public:null must not emit
  const nullEvent = { id: 'null1', type: 'PullRequestEvent', public: null, repo: { name: sensitiveRepo }, created_at: daysAgo(1), payload: { pull_request: { html_url: sensitiveUrl, title: sensitiveTitle } } };
  const summaryNull = summarizeGithubActivity([nullEvent]);
  assert.strictEqual(summaryNull.entries.length, 0, 'null public must not emit');
  assert.ok(!JSON.stringify(summaryNull).includes(sensitiveTitle));
});

test('revalidate privacy with mixed synthetic authenticated data', () => {
  const sensitiveRepo = 'buraktomruk/private-leak-repo';
  const sensitiveTitle = 'Leak Title 12345';
  const sensitiveUrl = 'https://github.com/buraktomruk/private-leak-repo/pull/1';
  const events = [
    githubEvent({ id: '1', isPublic: true, repoName: 'buraktomruk/portfolio', createdAt: daysAgo(1), payload: { pull_request: { html_url: 'https://github.com/buraktomruk/portfolio/pull/1', title: 'Public PR Title' } } }),
    githubEvent({ id: '2', isPublic: false, repoName: sensitiveRepo, createdAt: daysAgo(1), payload: { pull_request: { html_url: sensitiveUrl, title: sensitiveTitle }, commits: [{ message: 'secret commit' }] } }),
    { id: '3', type: 'PullRequestEvent', repo: { name: sensitiveRepo }, created_at: daysAgo(1), payload: { pull_request: { html_url: sensitiveUrl, title: sensitiveTitle } } }, // missing public
    { id: '4', type: 'PullRequestEvent', public: null, repo: { name: sensitiveRepo }, created_at: daysAgo(1), payload: { pull_request: { html_url: sensitiveUrl, title: sensitiveTitle } } },
  ];
  const summary = summarizeGithubActivity(events, { includePrivateAggregates: true });
  // Only public:true should appear in entries
  assert.strictEqual(summary.entries.length, 1);
  assert.strictEqual(summary.entries[0].repoName, 'buraktomruk/portfolio');
  const payloadJson = JSON.stringify(summary);
  assert.ok(!payloadJson.includes(sensitiveRepo), 'private repo leaked in authenticated mixed payload');
  assert.ok(!payloadJson.includes(sensitiveTitle), 'private title leaked in authenticated mixed payload');
  assert.ok(!payloadJson.includes('secret commit'), 'commit message leaked');
  // Aggregates may reflect private count but not identities
  assert.strictEqual(summary.totals.privateActivityCount, 1);
  assert.ok(typeof summary.totals.repositoriesTouchedCount === 'number');
  // No raw payload in entries
  for (const entry of summary.entries) {
    assert.ok(!('payload' in entry));
  }
});

test('public/auth cache namespaces are separated', async () => {
  const { getGithubStatsCacheKey } = await import('../src/shared/githubStats.js');
  // Simulate what createGithubContext does: prefix + mode + fresh/backup
  const username = 'buraktomruk';
  const publicFresh = getGithubStatsCacheKey('activity_v3_public_fresh', username);
  const authFresh = getGithubStatsCacheKey('activity_v3_auth_fresh', username);
  const publicBackup = getGithubStatsCacheKey('activity_v3_public_backup', username);
  const authBackup = getGithubStatsCacheKey('activity_v3_auth_backup', username);
  assert.notStrictEqual(publicFresh, authFresh, 'public vs auth fresh keys must differ');
  assert.notStrictEqual(publicBackup, authBackup, 'public vs auth backup keys must differ');
  assert.ok(publicFresh.includes('public'), 'public key should contain mode');
  assert.ok(authFresh.includes('auth'), 'auth key should contain mode');
  // Also verify stats keys separate
  const statsPublic = getGithubStatsCacheKey('stats_public_fresh', username);
  const statsAuth = getGithubStatsCacheKey('stats_auth_fresh', username);
  assert.notStrictEqual(statsPublic, statsAuth);
});
