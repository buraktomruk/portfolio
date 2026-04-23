import { test } from 'node:test';
import assert from 'node:assert';
import {
  filterAndSortGithubRepos,
  parseGithubPinnedRepos,
  resolveGithubPinnedRepos,
  resolveGithubUsername,
  resolveOptionalGithubToken,
  resolveOptionalRedisToken,
} from '../src/shared/githubStats.js';

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
  assert.strictEqual(resolveGithubUsername('your_username'), 'buraktomruk');
  assert.strictEqual(resolveGithubUsername('not valid'), 'buraktomruk');
  assert.strictEqual(resolveOptionalGithubToken('your-token'), undefined);
  assert.strictEqual(resolveOptionalGithubToken('Bearer ghp_abcdefghijklmnopqrstuvwxyz123456'), 'ghp_abcdefghijklmnopqrstuvwxyz123456');
  assert.strictEqual(resolveOptionalRedisToken('placeholder'), undefined);
  assert.strictEqual(resolveOptionalRedisToken('upstash-real-token'), 'upstash-real-token');
});
