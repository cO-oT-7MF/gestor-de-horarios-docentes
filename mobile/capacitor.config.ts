export interface CapacitorConfig {
  appId: string;
  appName: string;
  webDir: string;
  server?: {
    androidScheme?: string;
    cleartext?: boolean;
  };
}

const config: CapacitorConfig = {
  appId: 'com.costudio.gestorhorarios',
  appName: 'Gestor de Horarios Académicos',
  webDir: '../dist',
  server: {
    androidScheme: 'https',
    cleartext: false,
  },
};

export default config;
