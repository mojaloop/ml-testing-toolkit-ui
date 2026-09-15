import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import { resolve } from 'path';
import { readFileSync } from 'fs';

// Custom plugin to handle JSON imports in src directory
function jsonPlugin() {
  return {
    name: 'json-plugin',
    enforce: 'pre',
    load(id) {
      if (id.endsWith('.json') && id.includes('/src/')) {
        const json = readFileSync(id, 'utf-8');
        return `export default ${json}`;
      }
    }
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    jsonPlugin(),
    react({
      include: '**/*.{jsx,js,ts,tsx}',
      jsxRuntime: 'automatic',
    }),
    nodePolyfills(),
  ],
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
    alias: {
      '@': resolve(import.meta.dirname, 'src'),
    }
  },
  publicDir: 'public',
  base: '/',
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', '@ant-design/icons'],
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:4040',
        changeOrigin: true,
      },
    },
    fs: {
      // Allow serving files from one level up to the project root
      allow: ['..'],
    },
  },
  build: {
    outDir: 'build',
    sourcemap: process.env.NODE_ENV !== 'production',
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
      },
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react-dom') || id.includes('react-router-dom')) {
              return 'react-vendor';
            }
            if (id.includes('react') && !id.includes('react-ace')) {
              return 'react-vendor';
            }
            if (id.includes('antd') || id.includes('@ant-design/icons')) {
              return 'antd';
            }
            if (id.includes('react-ace') || id.includes('ace-builds')) {
              return 'editor';
            }
            if (id.includes('lodash') || id.includes('moment') || id.includes('axios')) {
              return 'utils';
            }
          }
        },
      },
    },
  },
}); 