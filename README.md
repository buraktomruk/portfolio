# Burak Tomruk - Portfolio Website

A modern, responsive portfolio website built with React, Vite, and Tailwind CSS. Features dark mode, internationalization (i18n), and an AI-powered chat widget.

## Features

- **Responsive Design**: Fully responsive layout that works on all devices
- **Dark Mode**: Toggle between light and dark themes with persistent preferences
- **Internationalization**: Support for English and German languages
- **AI Chat Widget**: Interactive AI assistant powered by Google Gemini API
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

3. Create a `.env` file in the root directory and add your Gemini API key:
```env
VITE_GEMINI_API_KEY=your_api_key_here
```

## Development

Run the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Build

Create a production build:
```bash
npm run build
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
```

Get your Gemini API key from: https://makersuite.google.com/app/apikey

## Deployment

This project can be deployed to various platforms:

- **Live sites**: https://buraktomruk.com and https://buraktomruk.dev

### Netlify
1. Connect your GitHub repository to Netlify
2. Set the build command to `npm run build`
3. Set the publish directory to `dist`
4. Add your environment variables in Netlify's dashboard

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

## License

This project is open source and available under the MIT License.

## Contact

Burak Tomruk
- Email: burak.tomruk95@gmail.com
- LinkedIn: [linkedin.com/in/burak-tomruk-845848138](https://www.linkedin.com/in/burak-tomruk-845848138/)
- GitHub: [github.com/buraktomruk](https://github.com/buraktomruk)

---

Built with ❤️ by Burak Tomruk
