// lesson-service/jest.config.js
module.exports = {
    testEnvironment: 'node',
    testMatch: ['**/*.test.js'],
    collectCoverageFrom: [
        'controllers/**/*.js',
        'services/**/*.js',
        'validators/**/*.js',
        'routes/**/*.js'
    ],
    coverageDirectory: 'coverage',
    setupFilesAfterEnv: ['<rootDir>/tests/helpers/testSetup.js'],
    clearMocks: true,
    resetMocks: true,
    restoreMocks: true
};