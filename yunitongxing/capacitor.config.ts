import type { CapacitorConfig } from '@capacitor/cli';

const isDev = process.env.NODE_ENV === 'development'

const config: CapacitorConfig = {
  appId: 'com.yunitongxing.app',
  appName: '与你童行',
  webDir: 'dist',

  // Dev: hot-reload from Vite dev server; Prod: load from bundled assets
  server: isDev ? {
    url: 'http://192.168.1.1:5173',
    cleartext: true,
  } : undefined,

  // Android-specific
  android: {
    allowMixedContent: true,
  },
};

export default config;
