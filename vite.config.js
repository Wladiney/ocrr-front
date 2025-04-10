import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  server: {
    host: true,
    allowedHosts: [
      'lagoinhasm-ocrrr-front.qwyqnc.easypanel.host'
    ]
  }
});
