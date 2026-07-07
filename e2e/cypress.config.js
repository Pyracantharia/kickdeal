import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    setupNodeEvents(on, config) {},
  },
  viewportWidth: 1280,
  viewportHeight: 1200,
});
