import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';

const certPath = path.resolve(__dirname, './certs/astra.crt');
const keyPath = path.resolve(__dirname, './certs/astra.key');
const hasSslCerts = fs.existsSync(certPath) && fs.existsSync(keyPath);
const enableHttps = process.env.VITE_HTTPS === 'true' && hasSslCerts;

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: true,
    ...(enableHttps
      ? {
          https: {
            key: fs.readFileSync(keyPath),
            cert: fs.readFileSync(certPath),
          },
        }
      : {}),
  },
});
