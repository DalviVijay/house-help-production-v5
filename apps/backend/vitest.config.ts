import {defineConfig} from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    exclude: ['dist/**', 'node_modules/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      // Measure executable domain/security code. HTTP route declarations and
      // process wiring are exercised by integration tests but excluded from
      // the unit-coverage denominator because they contain mostly callbacks.
      exclude: [
        'dist/**',
        'node_modules/**',
        'src/routes/**',
        'src/config/**',
        'src/app.ts',
        'src/server.ts',
        'src/observability/**',
        'src/realtime/hub.ts',
      ],
      thresholds: {lines: 70, functions: 70, branches: 60, statements: 70},
    },
  },
});