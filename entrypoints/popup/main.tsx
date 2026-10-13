import React from 'react';
import ReactDOM from 'react-dom/client';
import { I18nProvider } from '@/src/i18n';
import { initTheme, ThemeProvider } from '@/src/theme';
import App from './App.tsx';
import './style.css';

// Apply the cached theme synchronously — before React renders a single pixel.
// This eliminates the flash-of-wrong-theme on every page open.
initTheme();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <I18nProvider>
        <App />
      </I18nProvider>
    </ThemeProvider>
  </React.StrictMode>,
);
