module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.ts'],
  globalSetup: '<rootDir>/tests/global-setup.ts',
  setupFiles: ['<rootDir>/tests/setup.ts'],
};
