// lesson-service/jest.controllers.config.js
module.exports = {
    testEnvironment: 'node',
    testMatch: ['**/*.test.js'],
    collectCoverageFrom: [
        'controllers/**/*.js',
        'validators/**/*.js'  // Added validators
    ],
    coverageDirectory: 'coverage',
    setupFilesAfterEnv: ['<rootDir>/tests/helpers/testSetup.js'],
    clearMocks: true,
    resetMocks: true,
    restoreMocks: true,
    coverageReporters: ['text', 'lcov', 'html'],
    forceCoverageMatch: ['**/*.js'],
    coveragePathIgnorePatterns: [
        '/node_modules/',
        '/models/',
        '/service/',
        '/utils/',
        '/tests/'
    ],
    coverageThreshold: {
        // './controllers/**/*.js': {
        //     branches: 100,
        //     functions: 100,
        //     lines: 100,
        //     statements: 100
        // },
        // './validators/**/*.js': {
        //     branches: 100,
        //     functions: 100,
        //     lines: 100,
        //     statements: 100
        // }
        './services/**/*.js': {
            branches: 80,
            functions: 80,
            lines: 80,
            statements: 80
        }
    },
    verbose: true,
    collectCoverage: true,
    coverageProvider: 'v8'
};