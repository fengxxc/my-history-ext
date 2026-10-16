import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'My History',
    description: 'A browser history extension',
    version: '0.0.1',
    permissions: ['history', 'storage', 'tabs', 'alarms'],
    options_ui: {
      page: 'options.html',
      open_in_tab: true,
    },
  },
});
