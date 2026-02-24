import { defineConfig } from 'vite';

export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/launches/' : '/',
  root: '.',
  publicDir: 'public',
  build: {
    outDir: 'dist',
  },
}));
