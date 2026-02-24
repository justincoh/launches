import { defineConfig } from 'vite';

export default defineConfig({
  base: '/launches/',
  root: '.',
  publicDir: 'public',
  build: {
    outDir: 'dist',
  },
});
