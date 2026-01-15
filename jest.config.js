module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",

  // Where to find tests
  roots: ["<rootDir>/src"],
  testMatch: ["**/tests/**/*.test.ts"],

  // Module resolution
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },

  // Setup files
  setupFilesAfterEnv: ["<rootDir>/src/tests/setup.ts"],

  // Coverage configuration
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/tests/**", // Exclude test files
    "!src/**/*.d.ts", // Exclude type definitions
    "!src/index.ts", // Exclude entry point
    "!src/server.ts", // Exclude bootstrap server
    "!src/workers.ts", // Exclude workers bootstrap
    "!src/config/bullboard.ts", // Exclude Bull Board setup
    "!src/types/**", // Exclude type-only files
  ],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "html"],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },

  // Performance
  maxWorkers: "50%",

  // Clear mocks between tests
  clearMocks: true,
  restoreMocks: true,
  resetMocks: true,

  // Verbose output
  verbose: true,
};
