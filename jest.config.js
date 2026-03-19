process.env.EXPO_PUBLIC_API_URL = 'http://localhost:5155';

module.exports = {
  testEnvironment: 'node',
  preset: 'react-native',
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation|react-navigation|@tanstack|expo|@expo|@microsoft/signalr|msw|@mswjs|until-async|strict-event-emitter)/)',
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
    '!src/navigation/**',
    '!src/types/**',
  ],
  testMatch: [
    '**/__tests__/**/*.test.{ts,tsx}',
    '**/?(*.)+(spec|test).{ts,tsx}',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^expo-secure-store$': '<rootDir>/src/__tests__/mocks/expo-secure-store.ts',
    '^expo-constants$': '<rootDir>/src/__tests__/mocks/expo-constants.ts',
    '^expo-camera$': '<rootDir>/src/__tests__/mocks/expo-camera.ts',
    '^@microsoft/signalr$': '<rootDir>/src/__tests__/mocks/signalr.ts',
  },
};
