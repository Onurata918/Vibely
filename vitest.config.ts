import path from 'node:path';
import { defineConfig } from 'vitest/config';

// Saf TypeScript kural motorlari icin test kosucusu: oyun kutuphaneleri
// (`src/lib/**`) ve 101 Okey motoru (`src/engine/**`).
// React Native/Expo bilesenlerini test etmez, o yuzden jest-expo gibi agir
// bir RN mock katmani gerekmiyor.
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    include: ['src/lib/**/*.test.ts', 'src/engine/**/*.test.ts'],
  },
});
