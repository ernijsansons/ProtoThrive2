module.exports = {
  testEnvironment: 'jsdom',
  transform: {
    '^.+\.(ts|tsx|js|jsx)$': ['babel-jest', { presets: ['next/babel', '@babel/preset-typescript', '@babel/preset-react'] }],
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  testMatch: [
    '<rootDir>/src/__tests__/**/*.test.{js,jsx,ts,tsx}',
    '<rootDir>/src/components/**/*.test.{js,jsx,ts,tsx}',
    '<rootDir>/tests/integration/**/*.test.{js,jsx,ts,tsx}',
  ],
};