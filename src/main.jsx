import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import './i18n/i18n';
import { I18nextProvider } from 'react-i18next';
import i18n from 'i18next';
import * as Sentry from '@sentry/react';

// Lean Sentry setup – no Session Replay to keep free-tier quota comfortable.
// tracesSampleRate 0.1 is enough to prove observability without wasting quota.
Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  tracesSampleRate: 0.1,
  enabled: !!import.meta.env.VITE_SENTRY_DSN, // silently disabled in local dev if DSN not set
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <I18nextProvider i18n={i18n}>
      <App />
    </I18nextProvider>
  </React.StrictMode>,
)