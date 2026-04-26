import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import './i18n/i18n';
import { I18nextProvider } from 'react-i18next';
import i18n from 'i18next';
import * as Sentry from '@sentry/react';
import { hasValidSentryDsn } from './shared/githubStats.js';

const frontendSentryDsn = hasValidSentryDsn(import.meta.env.VITE_SENTRY_DSN)
  ? import.meta.env.VITE_SENTRY_DSN
  : undefined;

Sentry.init({
  dsn: frontendSentryDsn,
  tracesSampleRate: 0.1,
  enabled: Boolean(frontendSentryDsn),
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <I18nextProvider i18n={i18n}>
      <App />
    </I18nextProvider>
  </React.StrictMode>,
)
