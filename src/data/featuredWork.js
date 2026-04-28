// Each entry models an independent product build presented as an engineering
// case study. Translatable copy (summary, focus bullets, status label) lives
// under `projects.caseStudies.<id>` in the i18n files; structural fields stay
// here. Only include `demoUrl` / `repoUrl` when a known safe URL exists.
export const featuredWorkItems = [
  {
    id: "ritualgymtracker",
    title: "Ritual Gym Tracker",
    statusKey: "releaseHardening",
    accent: "amber",
    previewImage: "/project-previews/ritualgymtracker-icon.png",
    demoUrl: "https://ritualgymtracker.netlify.app/",
    repoUrl: null,
    tags: [
      "React Native",
      "Expo",
      "Offline-first",
      "Sync hardening",
      "Timezone-safe analytics",
      "Release readiness",
    ],
  },
  {
    id: "bookmarkanalyzer",
    title: "BookmarkAI",
    statusKey: "productionReadiness",
    accent: "violet",
    previewImage: "/project-previews/bookmarkanalyzer-logo.svg",
    demoUrl: "https://bookmarkanalyzer.netlify.app/",
    repoUrl: null,
    tags: [
      "React",
      "Local-first",
      "AI-assisted enrichment",
      "SSRF hardening",
      "Security headers",
      "Reader sanitization",
    ],
  },
  {
    id: "subtrackerrr",
    title: "SubTracker",
    statusKey: "mvpDeployed",
    accent: "cyan",
    previewImage: "/project-previews/subtrackerrr-logo.png",
    demoUrl: "https://subtrackerrr.netlify.app/",
    repoUrl: null,
    tags: [
      "React",
      "Firebase",
      "Financial correctness",
      "Currency conversion",
      "Session security",
      "Firestore persistence",
    ],
  },
  {
    id: "fintrackerrr",
    title: "FinanceTracker",
    statusKey: "activeIteration",
    accent: "emerald",
    previewImage: "/project-previews/fintrackerrr-logo.svg",
    demoUrl: "https://fintrackerrr.netlify.app/",
    repoUrl: null,
    tags: [
      "React",
      "Portfolio analytics",
      "Data normalization",
      "UI performance",
      "Dividend calendar",
      "Asset insights",
    ],
  },
];
