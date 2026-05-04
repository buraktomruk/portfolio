// Each entry models an independent product build presented as an engineering
// case study. Translatable copy (summary, impact areas, status label) lives
// under `projects.caseStudies.<id>` in the i18n files; structural fields stay
// here. `demoUrl` and `repoUrl` must be either a known safe absolute URL or
// explicitly `null` when no safe URL is available — never a placeholder.
export const featuredWorkItems = [
  {
    id: "ritualgymtracker",
    title: "Ritual Gym Tracker",
    statusKey: "publicPreview",
    accent: "indigo",
    logoSrc: "/project-previews/ritualgymtracker-logo.png",
    logoTileClass: "bg-[radial-gradient(circle_at_top,_rgba(129,140,248,0.28),_transparent_58%),linear-gradient(145deg,rgba(15,23,42,0.98),rgba(2,6,23,0.9))]",
    logoClass: "h-12 w-12 rounded-[1rem]",
    demoUrl: "https://ritualgymtracker.netlify.app/",
    repoUrl: null,
  },
  {
    id: "bookmarkanalyzer",
    title: "BookmarkAI",
    statusKey: "exploratoryBuild",
    accent: "violet",
    logoSrc: "/project-previews/bookmarkanalyzer-logo.svg",
    logoTileClass: "bg-[radial-gradient(circle_at_top,_rgba(129,140,248,0.22),_transparent_58%),linear-gradient(145deg,rgba(17,24,39,0.98),rgba(2,6,23,0.92))]",
    logoClass: "h-12 w-12 rounded-[1rem]",
    demoUrl: "https://bookmarkanalyzer.netlify.app/",
    repoUrl: null,
  },
  {
    id: "subtrackerrr",
    title: "SubTracker",
    statusKey: "previewBuild",
    accent: "cyan",
    logoSrc: "/project-previews/subtrackerrr-logo.png",
    logoTileClass: "bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.24),_transparent_58%),linear-gradient(145deg,rgba(15,23,42,0.98),rgba(2,6,23,0.92))]",
    logoClass: "h-12 w-12 rounded-[1rem] object-cover",
    demoUrl: "https://subtrackerrr.netlify.app/",
    repoUrl: null,
  },
  {
    id: "fintrackerrr",
    title: "FinanceTracker",
    statusKey: "inProgress",
    accent: "emerald",
    logoSrc: "/project-previews/fintrackerrr-logo.svg",
    logoTileClass: "bg-[radial-gradient(circle_at_top,_rgba(52,211,153,0.2),_transparent_58%),linear-gradient(145deg,rgba(15,23,42,0.98),rgba(2,6,23,0.92))]",
    logoClass: "h-12 w-12 rounded-[1rem]",
    demoUrl: "https://fintrackerrr.netlify.app/",
    repoUrl: null,
  },
];
