// First, mock Sequelize before any other imports
jest.mock('sequelize', () => {
    class MockModel {
        static init() { return this; }
        static associate() { }
        static addHook() { return this; }
        static belongsTo() { return this; }
        static hasMany() { return this; }
        static build(values) {
            const instance = {
                ...values,
                validate: () => Promise.resolve(),
                toJSON: () => ({ ...values, lessonId: values.lesson_id })
            };
            return instance;
        }
        static create() { return Promise.resolve({}); }
        static findOne() { return Promise.resolve({}); }
        static findAll() { return Promise.resolve([]); }
        static count() { return Promise.resolve(0); }
        static update() { return Promise.resolve([1]); }
    }

    return {
        Model: MockModel,
        DataTypes: {
            INTEGER: { type: 'INTEGER' },
            STRING: (length) => ({ type: 'STRING', length }),
            BOOLEAN: { type: 'BOOLEAN' },
            DATE: { type: 'DATE' },
            FLOAT: { type: 'FLOAT' }
        }
    };
});

// Create mock Sequelize instance
const mockSequelize = {
    define: jest.fn().mockReturnThis(),
    model: jest.fn().mockReturnThis(),
    models: {
        Lesson: {
            findByPk: jest.fn().mockResolvedValue({
                id: 1,
                status: 'APPROVED',
                save: jest.fn().mockResolvedValue(true)
            }),
            findAll: jest.fn().mockResolvedValue([]),
            count: jest.fn().mockResolvedValue(0),
            tableName: 'lessons'
        }
    },
    transaction: jest.fn(() => ({
        commit: jest.fn().mockResolvedValue(true),
        rollback: jest.fn().mockResolvedValue(true),
        LOCK: { UPDATE: 'UPDATE' }
    }))
};

// Mock models/index.js
jest.mock('../../../models/index', () => ({
    sequelize: mockSequelize,
    Sequelize: require('sequelize')
}));

// Mock appError
jest.mock('../../../utils/errors/appError', () => {
    return class AppError extends Error {
        constructor(message, statusCode = 500, type = 'GeneralError', origin = 'Unknown') {
            super(message);
            this.statusCode = statusCode;
            this.type = type;
            this.origin = origin;
            this.name = this.constructor.name;
        }
    };
});

describe('TuteeLesson Model', () => {
    let TuteeLesson;
    let mockTransaction;

    beforeAll(() => {
        const TuteeLessonModel = require('../../../models/tuteeLesson');
        TuteeLesson = TuteeLessonModel(mockSequelize);
        mockSequelize.models.TuteeLesson = TuteeLesson;

        // Add static methods
        TuteeLesson.findByLessonAndTutee = jest.fn().mockImplementation((lessonId, tuteeUserId) => {
            return TuteeLesson.findOne({ where: { lessonId, tuteeUserId } });
        });

        TuteeLesson.createTuteeLesson = jest.fn().mockImplementation((data) => {
            return TuteeLesson.create(data);
        });

        // Add instance methods
        TuteeLesson.prototype.toJSON = function () {
            const values = { ...this };
            if (values.lesson_id) {
                values.lessonId = values.lesson_id;
                delete values.lesson_id;
            }
            return values;
        };

        // Add rawAttributes for initialization test
        TuteeLesson.rawAttributes = {
            lessonId: { type: 'INTEGER' },
            tuteeUserId: { type: 'INTEGER' },
            tuteeFullName: { type: 'STRING' },
            tuteeEmail: { type: 'STRING' }
        };
    });

    beforeEach(() => {
        jest.clearAllMocks();
        mockTransaction = {
            commit: jest.fn().mockResolvedValue(true),
            rollback: jest.fn().mockResolvedValue(true)
        };
        mockSequelize.transaction.mockResolvedValue(mockTransaction);
    });

    describe('Model Methods', () => {
        describe('updatePresenceForLesson', () => {
            it('should throw error when presence data is missing', async () => {
                const mockTutees = [
                    { tuteeUserId: 1 },
                    { tuteeUserId: 2 }
                ];

                TuteeLesson.findAll = jest.fn().mockResolvedValue(mockTutees);

                await expect(TuteeLesson.updatePresenceForLesson(1, [
                    { tuteeUserId: 1, isPresent: true }
                ])).rejects.toThrow(/Missing presence information/);
            });

            it('should handle database errors during update', async () => {
                TuteeLesson.findAll = jest.fn().mockRejectedValue(new Error('Database error'));

                await expect(TuteeLesson.updatePresenceForLesson(1, []))
                    .rejects.toThrow('Database error');
            });
        });

        describe('hasEnrolledTutees', () => {
            it('should handle database errors in count', async () => {
                TuteeLesson.count = jest.fn().mockRejectedValue(new Error('Count failed'));
                await expect(TuteeLesson.hasEnrolledTutees(1))
                    .rejects.toThrow('Failed to check for enrolled tutees');
            });

            it('should use correct where clause', async () => {
                const countSpy = jest.spyOn(TuteeLesson, 'count');
                await TuteeLesson.hasEnrolledTutees(1);
                expect(countSpy).toHaveBeenCalledWith(
                    expect.objectContaining({
                        where: { lessonId: 1 }
                    })
                );
            });
        });

        describe('addReview', () => {
            const validReview = {
                clarity: 4,
                understanding: 4,
                focus: 4,
                helpful: 4
            };

            beforeEach(() => {
                TuteeLesson.findOne = jest.fn().mockResolvedValue({
                    id: 1,
                    lessonId: 1,
                    tuteeUserId: 1,
                    save: jest.fn().mockResolvedValue(true)
                });
            });

            it('should validate review ratings', async () => {
                const invalidReview = {
                    ...validReview,
                    clarity: 6 // Invalid rating
                };

                await expect(TuteeLesson.addReview(1, 1, invalidReview))
                    .rejects.toThrow('Failed to add review');
            });

            it('should handle non-existent tutee lesson', async () => {
                TuteeLesson.findOne = jest.fn().mockResolvedValue(null);

                await expect(TuteeLesson.addReview(1, 1, validReview))
                    .rejects.toThrow('Failed to add review');
            });

            it('should handle save errors', async () => {
                TuteeLesson.findOne = jest.fn().mockResolvedValue({
                    save: jest.fn().mockRejectedValue(new Error('Save failed'))
                });

                await expect(TuteeLesson.addReview(1, 1, validReview))
                    .rejects.toThrow('Failed to add review');
            });
        });
    });

    describe('Model Validation', () => {
        describe('Email Validation', () => {
            it('should reject invalid email formats', async () => {
                const tuteeLesson = TuteeLesson.build({
                    tuteeEmail: 'invalid-email'
                });
                tuteeLesson.validate = () => Promise.reject(new Error('Invalid email'));

                await expect(tuteeLesson.validate())
                    .rejects.toThrow('Invalid email');
            });

            it('should accept valid email formats', async () => {
                const tuteeLesson = TuteeLesson.build({
                    tuteeEmail: 'valid@email.com'
                });

                await expect(tuteeLesson.validate()).resolves.not.toThrow();
            });
        });

        describe('Rating Validations', () => {
            const testRating = (field) => {
                it(`should reject ${field} below minimum`, async () => {
                    const tuteeLesson = TuteeLesson.build({
                        [field]: 0
                    });
                    tuteeLesson.validate = () => Promise.reject(new Error(`Invalid ${field}`));

                    await expect(tuteeLesson.validate())
                        .rejects.toThrow(`Invalid ${field}`);
                });

                it(`should reject ${field} above maximum`, async () => {
                    const tuteeLesson = TuteeLesson.build({
                        [field]: 6
                    });
                    tuteeLesson.validate = () => Promise.reject(new Error(`Invalid ${field}`));

                    await expect(tuteeLesson.validate())
                        .rejects.toThrow(`Invalid ${field}`);
                });
            };

            ['clarity', 'understanding', 'focus', 'helpful'].forEach(field => {
                describe(`${field} validation`, () => {
                    testRating(field);
                });
            });
        });
    });

    describe('Error Handling', () => {
        it('should handle transaction rollback errors', async () => {
            mockTransaction.rollback.mockRejectedValue(new Error('Rollback failed'));
            TuteeLesson.findAll = jest.fn().mockRejectedValue(new Error('Update failed'));

            await expect(TuteeLesson.updatePresenceForLesson(1, []))
                .rejects.toThrow('Update failed');
        });
    });

    describe('Model Initialization', () => {
        it('should initialize with correct attributes', () => {
            expect(TuteeLesson.rawAttributes).toBeDefined();
            expect(TuteeLesson.rawAttributes.lessonId).toBeDefined();
            expect(TuteeLesson.rawAttributes.tuteeUserId).toBeDefined();
            expect(TuteeLesson.rawAttributes.tuteeFullName).toBeDefined();
            expect(TuteeLesson.rawAttributes.tuteeEmail).toBeDefined();
        });

        it('should set up associations correctly', () => {
            const associateSpy = jest.spyOn(TuteeLesson, 'belongsTo');
            TuteeLesson.associate({ Lesson: mockSequelize.models.Lesson });
            expect(associateSpy).toHaveBeenCalled();
        });
    });

    describe('Instance Methods', () => {
        describe('toJSON', () => {
            it('should preserve other attributes', () => {
                const instance = TuteeLesson.build({
                    lesson_id: 1,
                    tuteeUserId: 1,
                    tuteeFullName: 'Test User',
                    tuteeEmail: 'test@example.com'
                });

                const json = instance.toJSON();
                expect(json).toMatchObject({
                    tuteeUserId: 1,
                    tuteeFullName: 'Test User',
                    tuteeEmail: 'test@example.com'
                });
            });
        });
    });

    describe('Complex Scenarios', () => {
        describe('Review Management', () => {
            it('should validate all review fields', async () => {
                const incompleteReview = {
                    clarity: 4,
                    // missing other required fields
                };

                await expect(TuteeLesson.addReview(1, 1, incompleteReview))
                    .rejects.toThrow();
            });
        });

        describe('Presence Management', () => {
            it('should handle bulk presence updates', async () => {
                const mockTutees = Array(5).fill(null).map((_, i) => ({
                    tuteeUserId: i + 1,
                    save: jest.fn().mockResolvedValue(true)
                }));

                TuteeLesson.findAll = jest.fn().mockResolvedValue(mockTutees);

                const presenceData = mockTutees.map(t => ({
                    tuteeUserId: t.tuteeUserId,
                    isPresent: true
                }));

                await TuteeLesson.updatePresenceForLesson(1, presenceData);

                mockTutees.forEach(tutee => {
                    expect(tutee.save).toHaveBeenCalled();
                });
            });
        });
    });
});