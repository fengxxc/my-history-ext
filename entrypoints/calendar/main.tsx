import React from 'react';
import ReactDOM from 'react-dom/client';
import { I18nProvider } from '@/src/i18n';
import { initTheme, ThemeProvider } from '@/src/theme';
import App from './App.tsx';
import './style.css';

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
