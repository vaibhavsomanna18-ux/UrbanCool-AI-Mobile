import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'ai.urbancool.app',
  appName: 'UrbanCool AI',
  webDir: 'www',
  server: {
    url: 'https://urbancool-ai.hatchable.site',
    cleartext: false
  },
  android: {
    backgroundColor: '#050b0d'
  }
};

export default config;
