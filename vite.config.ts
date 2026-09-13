import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    // The preview launcher assigns a free port through PORT; without it, Vite's
    // usual default. Honouring the variable is what lets a stale process on
    // 5173 stop blocking a fresh start.
    port: Number(process.env.PORT) || 5173,
  },
  build: {
    target: 'es2020',
    // three.js is deliberately a large chunk: it is dynamically imported by the
    // hero and never blocks the document. Warning at 500 kB here would be noise
    // about a decision already made.
    chunkSizeWarningLimit: 800,
    // Split the WebGL payload away from the document shell so the page is
    // readable long before the journey scene finishes downloading.
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/three')) return 'three';
          if (id.includes('node_modules/@react-three')) return 'r3f';
          if (id.includes('node_modules/gsap')) return 'gsap';
          if (id.includes('node_modules/react')) return 'react';
        },
      },
    },
  },
});
