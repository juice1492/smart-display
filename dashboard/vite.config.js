import { defineConfig } from 'vite';

// The wall tablet runs Android System WebView 106 (Chrome 106).
// JS target is es2020 ∩ chrome106.
// CSS targets chrome61 on purpose: this WebView rejects 4- and 8-digit hex colours
// (#0000, #ffffffbf) even though Chrome 106 should accept them, and a newer CSS
// target lets the minifier rewrite transparent/rgba() into that form.
export default defineConfig({
  base: '/frame/',
  build: {
    target: ['es2020', 'chrome106'],
    cssTarget: 'chrome61',
  },
  server: { host: true },
});
