import path from 'node:path';
import { defineConfig } from 'vitest/config';

// Sadece saf TypeScript kural motoru (`src/lib/**`) icin test kosucusu.
// React Native/Expo bilesenlerini test etmez, o yuzden jest-expo gibi agir
// bir RN mock katmani gerekmiyor.
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    include: ['src/lib/**/*.test.ts'],
  },
});
