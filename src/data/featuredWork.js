// Each entry models an independent product build presented as an engineering
// case study. Translatable copy (summary, impact areas, status label) lives
// under `projects.caseStudies.<id>` in the i18n files; structural fields stay
// here. `demoUrl` and `repoUrl` must be either a known safe absolute URL or
// explicitly `null` when no safe URL is available — never a placeholder.
export const featuredWorkItems = [
  {
    id: "ritualgymtracker",
    title: "Ritual Gym Tracker",
    statusKey: "releaseHardening",
    accent: "amber",
    demoUrl: "https://ritualgymtracker.netlify.app/",
    repoUrl: null,
  },
  {
    id: "bookmarkanalyzer",
    title: "BookmarkAI",
    statusKey: "productionReadiness",
    accent: "violet",
    demoUrl: "https://bookmarkanalyzer.netlify.app/",
    repoUrl: null,
  },
  {
    id: "subtrackerrr",
    title: "SubTracker",
    statusKey: "mvpDeployed",
    accent: "cyan",
    demoUrl: "https://subtrackerrr.netlify.app/",
    repoUrl: null,
  },
  {
    id: "fintrackerrr",
    title: "FinanceTracker",
    statusKey: "activeIteration",
    accent: "emerald",
    demoUrl: "https://fintrackerrr.netlify.app/",
    repoUrl: null,
  },
];
