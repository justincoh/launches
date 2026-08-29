import { resolve } from 'path';
import { defineConfig } from 'vite';

// Redirect /vehicle?... to /vehicle/?... so MPA mode finds vehicle/index.html
function mpaRedirect() {
  const pages = ['/vehicle', '/agency', '/site', '/country'];
  return {
    name: 'mpa-redirect',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = new URL(req.url, 'http://localhost');
        for (const page of pages) {
          if (url.pathname === page) {
            res.writeHead(301, { Location: page + '/' + url.search });
            res.end();
            return;
          }
        }
        next();
      });
    },
  };
}

// Inject Plausible analytics into every page's <head> so the snippet lives in
// one place instead of being duplicated across the five HTML entry points.
// Build-only: local dev pageviews would otherwise land in the real dashboard.
function analytics() {
  const stub =
    'window.plausible=window.plausible||function(){(plausible.q=plausible.q||[]).push(arguments)},' +
    'plausible.init=plausible.init||function(i){plausible.o=i||{}};\nplausible.init()';
  return {
    name: 'analytics',
    apply: 'build',
    transformIndexHtml() {
      return [
        {
          tag: 'script',
          attrs: { async: true, src: 'https://plausible.io/js/pa-N6RNrcZMvQSBaG3Wynj05.js' },
          injectTo: 'head',
        },
        { tag: 'script', children: stub, injectTo: 'head' },
      ];
    },
  };
}

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.js'],
  },
  root: '.',
  publicDir: 'public',
  appType: 'mpa',
  plugins: [mpaRedirect(), analytics()],
  server: {
    port: 5174,
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        vehicle: resolve(__dirname, 'vehicle/index.html'),
        agency: resolve(__dirname, 'agency/index.html'),
        site: resolve(__dirname, 'site/index.html'),
        country: resolve(__dirname, 'country/index.html'),
      },
    },
  },
});
