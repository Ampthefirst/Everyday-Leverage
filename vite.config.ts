/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import type { Plugin } from 'vite';
import { readdirSync } from 'node:fs';

/** Writes precache.json (every built asset) so the service worker can cache the whole app on install. */
function precacheManifest(): Plugin {
  return {
    name: 'el-precache-manifest',
    apply: 'build',
    generateBundle(_opts, bundle) {
      const files = Object.keys(bundle)
        .filter((f) => !f.endsWith('.map') && f !== 'index.html')
        .map((f) => `/${f}`);
      // Studio renders of the nine designs (public/renders) are part of the offline app too.
      for (const f of readdirSync('public/renders')) if (f.endsWith('.webp')) files.push(`/renders/${f}`);
      for (const f of readdirSync('public/renders/turn')) if (f.endsWith('.webp')) files.push(`/renders/turn/${f}`);
      this.emitFile({ type: 'asset', fileName: 'precache.json', source: JSON.stringify(files) });
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), precacheManifest()],
  worker: { format: 'es' },
  optimizeDeps: { exclude: ['manifold-3d'] },
  build: {
    chunkSizeWarningLimit: 1500,
  },
  test: {
    include: ['tests/unit/**/*.test.ts', 'tests/unit/**/*.test.tsx'],
    environment: 'node',
    testTimeout: 30000,
  },
});
