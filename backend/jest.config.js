/** Unit-test configuration. Run with: npm.cmd test */
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: 'test/.*\\.spec\\.ts$',
  testPathIgnorePatterns: ['/node_modules/', '<rootDir>/.corrupt_node_modules/'],
  modulePathIgnorePatterns: ['<rootDir>/.corrupt_node_modules/'],
  transform: {
    '^.+\\.(t|j)s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.json' }],
  },
  collectCoverageFrom: ['src/**/*.(t|j)s', '!src/**/*.module.ts', '!src/**/*.dto.ts'],
  coverageDirectory: 'coverage',
  testEnvironment: 'node',
  clearMocks: true,
};
