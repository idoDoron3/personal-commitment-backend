// lesson-service/jest.controllers.config.js
module.exports = {
    testEnvironment: 'node',
    testMatch: ['**/*.test.js'],
    collectCoverageFrom: [
        'controllers/**/*.js',
        'validators/**/*.js',
        'service/**/*.js',
        'models/**/*.js'
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
        // './service/**/*.js': {
        //     branches: 80,
        //     functions: 80,
        //     lines: 80,
        //     statements: 80
        // },
        './models/lesson.js': {
            branches: 75,
            functions: 75,
            lines: 75,
            statements: 75
        },
        './models/tuteeLesson.js': {
            branches: 75,
            functions: 75,
            lines: 75,
            statements: 75
        },

    },
    verbose: true,
    collectCoverage: true,
    coverageProvider: 'v8'
};