import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    hookTimeout: 20000,
    // Integration test files share one live Postgres and each TRUNCATEs shared tables in
    // beforeEach; running files in parallel lets one file's reset stomp on another's in-flight
    // test. Run files sequentially instead — cheap given the size of this suite.
    fileParallelism: false,
    globalSetup: './test/globalSetup.js',
  },
});
