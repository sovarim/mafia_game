import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import basicSsl from '@vitejs/plugin-basic-ssl';

// HTTPS is required for navigator.mediaDevices.getUserMedia on non-localhost
// origins (the camera-based QR scanner). The self-signed cert means phones
// have to accept a one-time security warning on first load.
export default defineConfig({
  plugins: [react(), basicSsl()],
  server: {
    host: true,
    https: true,
  },
});
