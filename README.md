# Burak Tomruk - Portfolio Website

A modern, responsive portfolio website built with React, Vite, and Tailwind CSS. Features dark mode, internationalization (i18n), and an AI-powered chat widget.

## Features

- **Responsive Design**: Fully responsive layout that works on all devices
- **Dark Mode**: Toggle between light and dark themes with persistent preferences
- **Internationalization**: Support for English and German languages
- **AI Chat Widget**: Interactive AI assistant powered by Google Gemini API
- **GitHub Portfolio Layer**: Netlify serverless functions backed by GitHub API, Upstash cache/rate limiting, and graceful frontend fallbacks
- **Modern Stack**: Built with React 18, Vite, and Tailwind CSS
- **Performance Optimized**: Fast loading times and smooth animations
- **SEO Friendly**: Optimized for search engines with proper meta tags

## Tech Stack

- **Frontend**: React 18.2.0
- **Build Tool**: Vite 4.4.5
- **Styling**: Tailwind CSS 3.3.3
- **Icons**: Lucide React
- **Internationalization**: react-i18next, i18next-browser-languagedetector
- **AI Integration**: Google Gemini API
- **Runtime Services**: Netlify Functions, Upstash Redis, Sentry

## Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (v16 or higher)
- npm or yarn

## Installation

1. Clone the repository:
```bash
git clone https://github.com/buraktomruk/burak-tomruk-portfolio.git
cd burak-tomruk-portfolio
```

2. Install dependencies:
```bash
npm install
```

3. Copy `.env.example` to `.env` and fill in the values you need:
```env
VITE_GEMINI_API_KEY=your_api_key_here
VITE_SENTRY_DSN=
GITHUB_USERNAME=buraktomruk
GITHUB_TOKEN=
GITHUB_PINNED_REPOS=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
SENTRY_DSN=
```

## Development

For the full local stack, including Netlify serverless functions:
```bash
npm run dev:netlify
```

This runs the Vite frontend and proxies `/.netlify/functions/*` through Netlify Dev.
The script runs in offline mode and uses only your local `.env`, so it does not require a logged-in global Netlify session for routine development.

If you only need the frontend without Netlify functions:
```bash
npm run dev
```

The frontend-only application will be available at `http://localhost:5173`

## Build

Create a production build:
```bash
npm run build
```

Run lint checks:
```bash
npm run lint
```

Run tests:
```bash
npm test
```

Preview the production build:
```bash
npm run preview
```

## Project Structure

```
burak-tomruk-portfolio/
├── public/              # Static assets
│   ├── favicon.svg
│   ├── manifest.json
│   ├── robots.txt
│   ├── service-worker.js
│   └── sitemap.xml
├── src/
│   ├── components/      # React components
│   │   ├── About.jsx
│   │   ├── AIChatWidget.jsx
│   │   ├── BackToTopButton.jsx
│   │   ├── Education.jsx
│   │   ├── Footer.jsx
│   │   ├── Hero.jsx
│   │   ├── Navbar.jsx
│   │   └── Skills.jsx
│   ├── data/           # Data files
│   │   └── resumeData.js
│   ├── i18n/           # Internationalization
│   │   ├── i18n.js
│   │   └── locales/
│   │       ├── en/
│   │       └── de/
│   ├── utils/          # Utility functions
│   │   └── geminiApi.js
│   ├── App.jsx
│   ├── index.css
│   └── main.jsx
├── .env.example
├── .gitignore
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.js
└── vite.config.js
```

## Environment Variables

Create a `.env` file based on `.env.example`:

```env
VITE_GEMINI_API_KEY=your_gemini_api_key_here
VITE_SENTRY_DSN=
GITHUB_USERNAME=buraktomruk
GITHUB_TOKEN=
GITHUB_PINNED_REPOS=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
SENTRY_DSN=
```

Get your Gemini API key from: https://makersuite.google.com/app/apikey

Notes:
- `GITHUB_USERNAME` falls back to `buraktomruk` if omitted or left as a placeholder value.
- `GITHUB_TOKEN` is optional but recommended in production to improve GitHub API rate limits and enable authenticated contribution totals.
- `GITHUB_PINNED_REPOS` is optional and accepts comma-separated repo names, such as `portfolio,react-initializer`.
- `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are optional locally. Without them, the widget still works, but caching and rate limiting are intentionally disabled instead of failing silently.
- `VITE_SENTRY_DSN` and `SENTRY_DSN` are optional. Invalid DSNs are ignored.

## Deployment

This project can be deployed to various platforms:

- **Live sites**: https://buraktomruk.com and https://buraktomruk.dev

### Netlify
1. Connect your GitHub repository to Netlify
2. Set the build command to `npm run build`
3. Set the publish directory to `dist`
4. Add your environment variables in Netlify's dashboard
5. For the GitHub Portfolio Layer, set optional `GITHUB_TOKEN`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `GITHUB_PINNED_REPOS`, and `SENTRY_DSN`

### Vercel
1. Import your GitHub repository to Vercel
2. Vercel will automatically detect Vite settings
3. Add your environment variables in Vercel's dashboard

## Features in Detail

### Dark Mode
- System preference detection
- Manual toggle with persistent storage
- Smooth transitions between themes

### Internationalization
- Automatic language detection based on browser settings
- Manual language switching (EN/DE)
- All UI text translated

### AI Chat Widget
- Context-aware responses about the portfolio owner
- Supports both English and Turkish
- Real-time streaming responses

### GitHub Portfolio Layer
- Uses `/.netlify/functions/github-stats`, `/.netlify/functions/github-activity`, and `/.netlify/functions/github-projects`
- Fetches profile stats, recent public engineering activity, and a curated repository selection
- Supports `GITHUB_PINNED_REPOS` as a comma-separated list of preferred repositories, with sensible defaults when omitted
- Applies Upstash Redis cache-aside logic with a fresh cache and a stale fallback cache
- Applies Upstash-based per-IP rate limiting when Redis is configured
- Keeps the last valid frontend snapshot visible if a refresh fails, with a manual retry control

## License

This project is open source and available under the MIT License.

## Contact

Burak Tomruk
- Email: burak.tomruk95@gmail.com
- LinkedIn: [linkedin.com/in/burak-tomruk-845848138](https://www.linkedin.com/in/burak-tomruk-845848138/)
- GitHub: [github.com/buraktomruk](https://github.com/buraktomruk)

---

Built with ❤️ by Burak Tomruk
