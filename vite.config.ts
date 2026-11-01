import { defineConfig, build as viteBuild } from 'vite';
import { resolve } from 'path';
import fs from 'fs';

// Custom plugin to build content.js as a standalone IIFE (no imports) and copy manifest
function bundleContentScriptPlugin() {
  return {
    name: 'bundle-content-script',
    async writeBundle() {
      // Build standalone content.js IIFE script
      await viteBuild({
        configFile: false,
        build: {
          outDir: 'dist',
          emptyOutDir: false,
          target: 'es2022',
          modulePreload: false,
          lib: {
            entry: resolve(__dirname, 'src/content/index.ts'),
            name: 'ContentScript',
            formats: ['iife'],
            fileName: () => 'content.js',
          },
        },
      });

      // Copy manifest.json to dist
      const srcManifest = resolve(__dirname, 'manifest.json');
      const distManifest = resolve(__dirname, 'dist/manifest.json');
      if (fs.existsSync(srcManifest)) {
        fs.copyFileSync(srcManifest, distManifest);
      }
    },
  };
}

export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'es2022',
    modulePreload: false,
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'src/popup/popup.html'),
        background: resolve(__dirname, 'src/background/index.ts'),
      },
      output: {
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === 'background') return 'background.js';
          return 'assets/[name]-[hash].js';
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
  },
  plugins: [bundleContentScriptPlugin()],
});
