// Each entry models an independent product build. Translatable copy (summary,
// highlights, status label, readiness note) lives under
// `projects.caseStudies.<id>` in the i18n files; structural fields stay here.
// `statusKey` and `ctaKey` are per project on purpose — these builds are at
// genuinely different maturities and must not share one label.
// `demoUrl` and `repoUrl` must be either a known safe absolute URL or
// explicitly `null` when no safe URL is available — never a placeholder.
export const featuredWorkItems = [
  {
    id: "magnetmiles",
    title: "MagnetMiles",
    statusKey: "publicWebMvp",
    ctaKey: "projects.ctaLiveApp",
    accent: "amber",
    logoSrc: "/project-previews/magnetmiles-logo.svg",
    logoTileClass: "bg-[radial-gradient(circle_at_top,_rgba(251,191,36,0.24),_transparent_58%),linear-gradient(145deg,rgba(28,25,23,0.98),rgba(12,10,9,0.92))]",
    logoClass: "h-12 w-12 rounded-[1rem]",
    demoUrl: "https://travelfridge.netlify.app/",
    repoUrl: null,
  },
  {
    id: "coefpulse",
    title: "CoefPulse",
    statusKey: "productionMvp",
    ctaKey: "projects.ctaLiveApp",
    accent: "indigo",
    logoSrc: "/project-previews/coefpulse-logo.png",
    logoTileClass: "bg-[radial-gradient(circle_at_top,_rgba(129,140,248,0.28),_transparent_58%),linear-gradient(145deg,rgba(15,23,42,0.98),rgba(2,6,23,0.9))]",
    logoClass: "h-12 w-12 rounded-[1rem]",
    demoUrl: "https://coefpulse.netlify.app/",
    repoUrl: null,
  },
  {
    id: "subtrackerrr",
    title: "SubTracker",
    statusKey: "publicBeta",
    ctaKey: "projects.ctaBeta",
    accent: "cyan",
    logoSrc: "/project-previews/subtrackerrr-logo.png",
    logoTileClass: "bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.24),_transparent_58%),linear-gradient(145deg,rgba(15,23,42,0.98),rgba(2,6,23,0.92))]",
    logoClass: "h-12 w-12 rounded-[1rem] object-cover",
    demoUrl: "https://subtrackerrr.netlify.app/",
    repoUrl: null,
  },
  {
    id: "fitvalue",
    title: "FitValue",
    statusKey: "inProduction",
    ctaKey: "projects.ctaLiveApp",
    accent: "emerald",
    logoSrc: "/project-previews/fitvalue-logo.svg",
    logoTileClass: "bg-[radial-gradient(circle_at_top,_rgba(52,211,153,0.2),_transparent_58%),linear-gradient(145deg,rgba(15,23,42,0.98),rgba(2,6,23,0.92))]",
    logoClass: "h-12 w-12 rounded-[1rem]",
    demoUrl: "https://ritualgymtracker.netlify.app/",
    repoUrl: null,
  },
];

// Builds that are real and reachable but too early to occupy a featured slot.
// Rendered as a compact row under the featured grid.
export const secondaryWorkItems = [
  {
    id: "outthere",
    title: "OutThere",
    statusKey: "preBeta",
    ctaKey: "projects.ctaPreview",
    accent: "violet",
    logoSrc: "/project-previews/outthere-logo.png",
    logoClass: "h-7 w-7 rounded-md object-contain",
    demoUrl: "https://outthereee.netlify.app/",
    repoUrl: null,
  },
];
