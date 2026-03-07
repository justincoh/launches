import { resolve } from 'path';
import { defineConfig } from 'vite';

// Redirect /vehicle?... to /vehicle/?... so MPA mode finds vehicle/index.html
function mpaRedirect() {
  const pages = ['/vehicle', '/agency'];
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

export default defineConfig({
  root: '.',
  publicDir: 'public',
  appType: 'mpa',
  plugins: [mpaRedirect()],
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
      },
    },
  },
});
