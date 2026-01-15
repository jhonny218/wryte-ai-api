module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  
  // Where to find tests
  roots: ['<rootDir>/src'],
  testMatch: ['**/tests/**/*.test.ts'],
  
  // Module resolution
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/src/tests/setup.ts'],
  
  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/tests/**',           // Exclude test files
    '!src/**/*.d.ts',          // Exclude type definitions
    '!src/index.ts',           // Exclude entry point
    '!src/types/**',           // Exclude type-only files
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  
  // Performance
  maxWorkers: '50%',
  
  // Clear mocks between tests
  clearMocks: true,
  restoreMocks: true,
  resetMocks: true,
  
  // Verbose output
  verbose: true,
};
