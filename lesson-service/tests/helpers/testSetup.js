// tests/helpers/testSetup.js
const { mockDeep } = require('jest-mock-extended');

// Mock the models
jest.mock('../../models', () => ({
    Lesson: mockDeep(),
    TuteeLesson: mockDeep(),
    sequelize: mockDeep(),
    Sequelize: mockDeep()
}));

// Reset all mocks before each test
beforeEach(() => {
    jest.clearAllMocks();
});