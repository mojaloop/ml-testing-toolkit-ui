import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      // Anchored regexes: with vite 8 (rolldown) the previous '**/*.{jsx,js,ts,tsx}' glob
      // was matched unanchored, so '.json' files matched '.js' and were parsed as JS.
      include: [/\.jsx?$/, /\.tsx?$/],
      jsxRuntime: 'automatic',
      babel: {
        plugins: [
          // Add any babel plugins if needed
        ],
      },
    }),
    nodePolyfills(),
  ],
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx'],
    alias: {
      '@': resolve(__dirname, 'src'),
    }
  },
  publicDir: 'public',
  base: '/',
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', '@ant-design/icons'],
    esbuildOptions: {
      loader: {
        '.js': 'jsx',
      },
      jsx: 'automatic',
    },
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
        main: resolve(__dirname, 'index.html'),
      },
      output: {
        // vite 8 (rolldown) only supports the function form of manualChunks
        // (the object form is rejected: "Expected Function but received Object").
        manualChunks(id) {
          if (/node_modules\/(react|react-dom|react-router-dom)\//.test(id)) return 'react-vendor';
          if (/node_modules\/(antd|@ant-design\/icons)\//.test(id)) return 'antd';
          if (/node_modules\/(react-ace|ace-builds)\//.test(id)) return 'editor';
          if (/node_modules\/(lodash|moment|axios)\//.test(id)) return 'utils';
        },
      },
    },
  },
}); 