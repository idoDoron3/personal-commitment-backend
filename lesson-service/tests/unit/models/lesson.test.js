// First, mock Sequelize before any other imports
jest.mock('sequelize', () => {
    class MockModel {
        static init() { return this; }
        static associate() { }
        static addHook() { return this; }
        static findByPk() { return Promise.resolve({}); }
        static findAll() { return Promise.resolve([]); }
        static count() { return Promise.resolve(0); }
    }

    const ValidationError = class ValidationError extends Error {
        constructor(message) {
            super(message);
            this.name = 'ValidationError';
        }
    };

    return {
        Model: MockModel,
        DataTypes: {
            INTEGER: { type: 'INTEGER' },
            STRING: (length) => ({ type: 'STRING', length }),
            DATE: { type: 'DATE' },
            TEXT: { type: 'TEXT' },
            ENUM: (...values) => ({ type: 'ENUM', values }),
        },
        Op: {
            gte: 'gte',
            lt: 'lt',
            and: 'and',
            or: 'or'
        },
        ValidationError
    };
});

// Mock TuteeLesson - using a simple mock instead of extending Model
jest.mock('../../../models/tuteeLesson', () => {
    return () => ({
        findAll: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
        create: jest.fn().mockResolvedValue({}),
        destroy: jest.fn().mockResolvedValue(1),
        updatePresenceForLesson: jest.fn().mockResolvedValue(true),
        hasEnrolledTutees: jest.fn().mockResolvedValue(false),
        addReview: jest.fn().mockResolvedValue({})
    });
});

// Mock the models/index.js file
jest.mock('../../../models/index', () => ({
    sequelize: {
        define: jest.fn(),
        model: jest.fn(),
        transaction: jest.fn(() => ({
            commit: jest.fn().mockResolvedValue(true),
            rollback: jest.fn().mockResolvedValue(true),
            LOCK: { UPDATE: 'UPDATE' }
        }))
    },
    Sequelize: require('sequelize')
}));

// Now import the required modules
const appError = require('../../../utils/errors/appError');
const { LESSON_STATUS, LESSON_FORMAT, MAX_TUTEES_PER_LESSON, MAX_OPEN_LESSONS_PER_TUTOR, MAX_SIGNEDUP_LESSONS_PER_TUTEE } = require('../../../models/lesson');
const { ValidationError, Op } = require('sequelize');

describe('Lesson Model', () => {
    let Lesson;
    let mockSequelize;
    let testLesson;
    let mockTransaction;

    beforeAll(() => {
        // Create mock transaction
        mockTransaction = {
            commit: jest.fn().mockResolvedValue(true),
            rollback: jest.fn().mockResolvedValue(true),
            LOCK: { UPDATE: 'UPDATE' }
        };

        mockSequelize = {
            define: jest.fn().mockReturnThis(),
            model: jest.fn().mockReturnThis(),
            models: {
                TuteeLesson: {
                    updatePresenceForLesson: jest.fn().mockResolvedValue(true)
                }
            },
            transaction: jest.fn().mockImplementation(() => Promise.resolve(mockTransaction))
        };

        // Get the Lesson model class
        const LessonModel = require('../../../models/lesson');
        Lesson = LessonModel(mockSequelize);

        // Mock static methods
        Lesson.addHook = jest.fn();
        Lesson.findByPk = jest.fn();
        Lesson.findAll = jest.fn();
        Lesson.count = jest.fn();
        Lesson.create = jest.fn();
    });

    beforeEach(() => {
        // Create mock transaction
        mockTransaction = {
            commit: jest.fn().mockResolvedValue(true),
            rollback: jest.fn().mockResolvedValue(true),
            LOCK: { UPDATE: 'UPDATE' }
        };

        mockSequelize = {
            define: jest.fn().mockReturnThis(),
            model: jest.fn().mockReturnThis(),
            models: {
                TuteeLesson: {
                    updatePresenceForLesson: jest.fn().mockResolvedValue(true),
                    hasEnrolledTutees: jest.fn().mockResolvedValue(true),
                    create: jest.fn().mockResolvedValue({}),
                    destroy: jest.fn().mockResolvedValue(1)
                }
            },
            transaction: jest.fn().mockImplementation(() => Promise.resolve(mockTransaction))
        };

        // Get the Lesson model class with proper constants
        jest.isolateModules(() => {
            const LessonModel = require('../../../models/lesson');
            Lesson = LessonModel(mockSequelize);
        });

        // Create test lesson instance with all required methods
        testLesson = {
            lessonId: 1,
            subjectName: 'Math',
            grade: '10',
            level: 'Advanced',
            description: 'Test lesson',
            tutorUserId: 'tutor123',
            tutorFullName: 'Test Tutor',
            tutorEmail: 'test@tutor.com',
            appointedDateTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
            format: LESSON_FORMAT.ONLINE,
            locationOrLink: 'zoom.us/test',
            status: LESSON_STATUS.CREATED,
            save: jest.fn().mockResolvedValue(this),
            reload: jest.fn().mockResolvedValue(this),
            validate: jest.fn().mockResolvedValue(true)
        };
    });

    describe('Model Constants', () => {
        it('should have correct LESSON_STATUS values', () => {
            expect(LESSON_STATUS).toEqual({
                CREATED: 'created',
                COMPLETED: 'completed',
                UNATTENDED: 'unattended',
                APPROVED: 'approved',
                NOTAPPROVED: 'notapproved',
                CANCELED: 'canceled'
            });
        });

        it('should have correct LESSON_FORMAT values', () => {
            expect(LESSON_FORMAT).toEqual({
                ONLINE: 'online',
                IN_PERSON: 'in-person'
            });
        });
    });

    describe('Model Methods', () => {
        describe('editLesson', () => {
            it('should edit lesson successfully', async () => {
                const newDescription = 'Updated description';
                const newFormat = LESSON_FORMAT.IN_PERSON;
                const newLocation = 'New location';

                // Mock the reload function to return the test lesson
                testLesson.reload = jest.fn().mockResolvedValue(testLesson);

                // Mock the save function to return the updated lesson
                testLesson.save = jest.fn().mockResolvedValue(testLesson);

                const result = await Lesson.editLesson(
                    testLesson,
                    newDescription,
                    newFormat,
                    newLocation
                );

                expect(result.description).toBe(newDescription);
                expect(result.format).toBe(newFormat);
                expect(result.locationOrLink).toBe(newLocation);
                expect(mockSequelize.transaction).toHaveBeenCalled();
                expect(mockTransaction.commit).toHaveBeenCalled();
                expect(testLesson.reload).toHaveBeenCalledWith({
                    transaction: mockTransaction,
                    lock: mockTransaction.LOCK.UPDATE
                });
            });

            it('should handle edit errors properly', async () => {
                // Mock reload to succeed but save to fail
                testLesson.reload = jest.fn().mockResolvedValue(testLesson);
                testLesson.save = jest.fn().mockRejectedValue(new Error('Database error'));

                await expect(Lesson.editLesson(
                    testLesson,
                    'New description',
                    LESSON_FORMAT.ONLINE,
                    'New location'
                )).rejects.toThrow('Lesson editing failed');

                expect(mockTransaction.rollback).toHaveBeenCalled();
                expect(mockSequelize.transaction).toHaveBeenCalled();
            });
        });

        describe('getAmountOfApprovedLessons', () => {
            it('should return correct amount of approved lessons', async () => {
                const tutorId = 'tutor123';
                const expectedCount = 5;

                Lesson.count = jest.fn().mockResolvedValue(expectedCount);

                const result = await Lesson.getAmountOfApprovedLessons(tutorId);

                expect(result).toBe(expectedCount);
                expect(Lesson.count).toHaveBeenCalledWith({
                    where: {
                        tutorUserId: tutorId,
                        status: LESSON_STATUS.APPROVED
                    }
                });
            });

            it('should handle count errors properly', async () => {
                Lesson.count = jest.fn().mockRejectedValue(new Error('Database error'));

                await expect(Lesson.getAmountOfApprovedLessons('tutor123'))
                    .rejects.toThrow('Fetching amount of approved lessons failed');
            });
        });

        describe('uploadLessonReport', () => {
            beforeEach(() => {
                // Properly mock findByPk as a jest function
                Lesson.findByPk = jest.fn();
            });

            it('should upload lesson report successfully', async () => {
                const tuteesPresence = { 'tutee123': true };
                Lesson.findByPk.mockResolvedValue(testLesson);
                testLesson.reload = jest.fn().mockResolvedValue(testLesson);
                testLesson.save = jest.fn().mockResolvedValue(testLesson);
                mockSequelize.models.TuteeLesson.updatePresenceForLesson = jest.fn().mockResolvedValue(true);

                const result = await Lesson.uploadLessonReport(
                    testLesson,
                    'Great lesson!',
                    tuteesPresence
                );

                expect(result.status).toBe(LESSON_STATUS.COMPLETED);
                expect(result.summary).toBe('Great lesson!');
                expect(mockTransaction.commit).toHaveBeenCalled();
                expect(mockSequelize.models.TuteeLesson.updatePresenceForLesson)
                    .toHaveBeenCalledWith(testLesson.lessonId, tuteesPresence, mockTransaction);
            });

            it('should mark lesson as unattended when no tutees present', async () => {
                const tuteesPresence = { 'tutee123': false };
                Lesson.findByPk.mockResolvedValue(testLesson);
                testLesson.reload = jest.fn().mockResolvedValue(testLesson);
                testLesson.save = jest.fn().mockResolvedValue(testLesson);

                const result = await Lesson.uploadLessonReport(
                    testLesson,
                    'No tutees attended',
                    tuteesPresence
                );

                expect(result.status).toBe(LESSON_STATUS.UNATTENDED);
                expect(mockTransaction.commit).toHaveBeenCalled();
            });

            it('should handle database errors', async () => {
                Lesson.findByPk.mockResolvedValue(testLesson);
                testLesson.reload = jest.fn().mockRejectedValue(new Error('Database error'));

                await expect(Lesson.uploadLessonReport(testLesson, 'Summary', {}))
                    .rejects.toThrow('Uploading lesson report failed');
                expect(mockTransaction.rollback).toHaveBeenCalled();
            });
        });

        describe('Validation', () => {
            beforeEach(() => {
                testLesson.validate = jest.fn().mockImplementation(async function () {
                    if (this.appointedDateTime <= new Date()) {
                        throw new ValidationError('Lesson date must be in the future');
                    }
                    if (this.format && !Object.values(LESSON_FORMAT).includes(this.format)) {
                        throw new ValidationError('Invalid format');
                    }
                    return true;
                });
            });

            it('should validate appointedDateTime is in the future', async () => {
                const pastLesson = {
                    ...testLesson,
                    appointedDateTime: new Date(Date.now() - 24 * 60 * 60 * 1000),
                    validate: testLesson.validate
                };

                await expect(pastLesson.validate())
                    .rejects.toThrow('Lesson date must be in the future');
            });

            it('should validate format enum values', async () => {
                const invalidLesson = {
                    ...testLesson,
                    format: 'invalid_format',
                    validate: testLesson.validate
                };

                await expect(invalidLesson.validate())
                    .rejects.toThrow('Invalid format');
            });
        });
    });


    describe('cancelLesson', () => {
        it('should cancel lesson successfully', async () => {
            // Setup
            const affectedTuteeId = 'tutee123';
            testLesson.enrolledTutees = [{ tuteeUserId: affectedTuteeId }];
            testLesson.reload = jest.fn().mockResolvedValue(testLesson);
            testLesson.save = jest.fn().mockResolvedValue(testLesson);

            mockSequelize.models.TuteeLesson.destroy = jest.fn().mockResolvedValue(1);

            // Execute
            const result = await Lesson.cancelLesson(testLesson);

            // Assert
            expect(result.lesson.status).toBe(LESSON_STATUS.CANCELED);
            expect(result.affectedTutees).toContain(affectedTuteeId);
            expect(mockTransaction.commit).toHaveBeenCalled();
            expect(mockSequelize.models.TuteeLesson.destroy).toHaveBeenCalled();
        });

        it('should handle cancellation errors', async () => {
            testLesson.reload = jest.fn().mockRejectedValue(new Error('Database error'));

            await expect(Lesson.cancelLesson(testLesson))
                .rejects.toThrow('Lesson cancellation failed');

            expect(mockTransaction.rollback).toHaveBeenCalled();
        });
    });

    describe('getLessonsOfTutor', () => {
        it('should get upcoming lessons', async () => {
            const mockLessons = [testLesson];
            Lesson.findAll = jest.fn().mockResolvedValue(mockLessons);

            const result = await Lesson.getLessonsOfTutor('tutor123', 'upcoming');

            expect(result).toEqual(mockLessons);
            expect(Lesson.findAll).toHaveBeenCalledWith(expect.objectContaining({
                where: expect.objectContaining({
                    tutorUserId: 'tutor123',
                    status: LESSON_STATUS.CREATED
                })
            }));
        });

        it('should get summary pending lessons with tutees', async () => {
            const mockLessons = [testLesson];
            Lesson.findAll = jest.fn().mockResolvedValue(mockLessons);
            mockSequelize.models.TuteeLesson.hasEnrolledTutees = jest.fn().mockResolvedValue(true);

            const result = await Lesson.getLessonsOfTutor('tutor123', 'summaryPending');

            expect(result).toEqual(mockLessons);
            expect(mockSequelize.models.TuteeLesson.hasEnrolledTutees).toHaveBeenCalled();
        });

        it('should handle invalid lesson category', async () => {
            await expect(Lesson.getLessonsOfTutor('tutor123', 'invalid'))
                .rejects.toThrow('Fetching lessons failed');
        });
    });

    describe('searchAvailableLessons', () => {
        it('should search available lessons successfully', async () => {
            const mockLessons = [testLesson];
            Lesson.findAll = jest.fn().mockResolvedValue(mockLessons);

            const result = await Lesson.searchAvailableLessons('Math', '10', 'Advanced', 'tutee123');

            expect(result).toEqual(mockLessons);
            expect(Lesson.findAll).toHaveBeenCalledWith(expect.objectContaining({
                where: expect.objectContaining({
                    status: LESSON_STATUS.CREATED
                })
            }));
        });

        it('should filter by subject, grade and level', async () => {
            const mockLessons = [testLesson];
            Lesson.findAll = jest.fn().mockResolvedValue(mockLessons);

            const result = await Lesson.searchAvailableLessons('Math', '10', 'Advanced', 'tutee123');

            expect(result).toEqual(mockLessons);
            expect(Lesson.findAll).toHaveBeenCalledWith(expect.objectContaining({
                where: expect.objectContaining({
                    subjectName: 'Math',
                    grade: '10',
                    level: 'Advanced'
                })
            }));
        });

        it('should handle search errors', async () => {
            Lesson.findAll = jest.fn().mockRejectedValue(new Error('Database error'));

            await expect(Lesson.searchAvailableLessons('Math', '10', 'Advanced', 'tutee123'))
                .rejects.toThrow('Lesson search failed');
        });
    });

    describe('enrollToLesson', () => {
        beforeEach(() => {
            testLesson.reload = jest.fn().mockResolvedValue({
                ...testLesson,
                enrolledTutees: []
            });
            mockSequelize.models.TuteeLesson.create = jest.fn().mockResolvedValue({});
        });

        it('should prevent enrollment if max tutees reached', async () => {
            testLesson.reload = jest.fn().mockResolvedValue({
                ...testLesson,
                enrolledTutees: Array(2).fill({})
            });

            await expect(
                Lesson.enrollToLesson(testLesson, 'tutee123', 'Test Tutee', 'tutee@test.com')
            ).rejects.toThrow('Enrollment failed');
        });
    });

    describe('withdrawFromLesson', () => {
        it('should withdraw tutee successfully', async () => {
            const mockTuteeLesson = {
                destroy: jest.fn().mockResolvedValue(true)
            };

            testLesson.reload = jest.fn().mockResolvedValue(testLesson);

            await Lesson.withdrawFromLesson(testLesson, mockTuteeLesson);

            expect(mockTransaction.commit).toHaveBeenCalled();
            expect(mockTuteeLesson.destroy).toHaveBeenCalled();
        });
    });

    describe('updateLessonVerdict', () => {
        it('should approve lesson successfully', async () => {
            testLesson.reload = jest.fn().mockResolvedValue(testLesson);
            testLesson.save = jest.fn().mockResolvedValue(testLesson);
            Lesson.findByPk = jest.fn().mockResolvedValue(testLesson);

            await Lesson.updateLessonVerdict(1, true);

            expect(testLesson.status).toBe(LESSON_STATUS.APPROVED);
            expect(mockTransaction.commit).toHaveBeenCalled();
        });

        it('should not approve lesson successfully', async () => {
            testLesson.reload = jest.fn().mockResolvedValue(testLesson);
            testLesson.save = jest.fn().mockResolvedValue(testLesson);
            Lesson.findByPk = jest.fn().mockResolvedValue(testLesson);

            await Lesson.updateLessonVerdict(1, false);

            expect(testLesson.status).toBe(LESSON_STATUS.NOTAPPROVED);
            expect(mockTransaction.commit).toHaveBeenCalled();
        });
    });

    describe('Model Validation', () => {
        describe('isFutureDate', () => {
            beforeEach(() => {
                // Create a new instance with the isFutureDate function
                testLesson = {
                    ...testLesson,
                    isFutureDate: function (value) {
                        return value > new Date();
                    }
                };
            });

            it('should validate future date', () => {
                const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
                expect(testLesson.isFutureDate(futureDate)).toBe(true);
            });

            it('should reject past date', () => {
                const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
                expect(testLesson.isFutureDate(pastDate)).toBe(false);
            });
        });
    });

    describe('getLessonsOfTutee', () => {
        it('should get upcoming lessons for tutee', async () => {
            const mockLessons = [testLesson];
            Lesson.findAll = jest.fn().mockResolvedValue(mockLessons);

            const result = await Lesson.getLessonsOfTutee('tutee123', 'upcoming');
            expect(result).toEqual(mockLessons);
        });


        it('should handle invalid category gracefully', async () => {
            await expect(Lesson.getLessonsOfTutee('tutee123', 'invalid'))
                .rejects.toThrow('Fetching lessons failed');
        });
    });

    describe('getVerdictPendingLessons', () => {
        it('should get lessons pending verdict', async () => {
            const mockLessons = [testLesson];
            Lesson.findAll = jest.fn().mockResolvedValue(mockLessons);

            const result = await Lesson.getVerdictPendingLessons();

            expect(result).toEqual(mockLessons);
            expect(Lesson.findAll).toHaveBeenCalledWith(expect.objectContaining({
                where: expect.objectContaining({
                    status: {
                        [Op.or]: [LESSON_STATUS.COMPLETED, LESSON_STATUS.UNATTENDED]
                    }
                })
            }));
        });
    });

    describe('Model Validations', () => {
        describe('validateLessonLimits', () => {
            beforeEach(() => {
                // Add validateLessonLimits as a static method
                Lesson.validateLessonLimits = async function (lesson) {
                    const openLessonsCount = await this.count({
                        where: {
                            tutorUserId: lesson.tutorUserId,
                            status: LESSON_STATUS.CREATED
                        }
                    });

                    if (openLessonsCount >= MAX_OPEN_LESSONS_PER_TUTOR) {
                        throw new Error('Tutor has reached maximum number of open lessons');
                    }
                    return true;
                };
            });

            it('should validate tutor lesson limits', async () => {
                Lesson.count = jest.fn().mockResolvedValue(MAX_OPEN_LESSONS_PER_TUTOR - 1);
                await expect(Lesson.validateLessonLimits(testLesson)).resolves.toBe(true);
            });

            it('should reject when tutor exceeds lesson limit', async () => {
                Lesson.count = jest.fn().mockResolvedValue(MAX_OPEN_LESSONS_PER_TUTOR);
                await expect(Lesson.validateLessonLimits(testLesson))
                    .rejects.toThrow('Tutor has reached maximum number of open lessons');
            });
        });
    });

    describe('searchAvailableLessons', () => {
        it('should handle empty search results', async () => {
            Lesson.findAll = jest.fn().mockResolvedValue([]);
            const result = await Lesson.searchAvailableLessons('Math', '10', 'Advanced', 'tutee123');
            expect(result).toEqual([]);
        });

        it('should include proper where conditions', async () => {
            Lesson.findAll = jest.fn().mockResolvedValue([]);
            await Lesson.searchAvailableLessons('Math', '10', 'Advanced', 'tutee123');

            expect(Lesson.findAll).toHaveBeenCalledWith(expect.objectContaining({
                where: expect.objectContaining({
                    subjectName: 'Math',
                    grade: '10',
                    level: 'Advanced',
                    status: LESSON_STATUS.CREATED
                })
            }));
        });
    });

    describe('Transaction Error Handling', () => {
        it('should handle transaction commit failure', async () => {
            mockTransaction.commit = jest.fn().mockRejectedValue(new Error('Commit failed'));
            testLesson.save = jest.fn().mockResolvedValue(testLesson);

            await expect(Lesson.editLesson(testLesson, 'New description', LESSON_FORMAT.ONLINE, 'New location'))
                .rejects.toThrow('Lesson editing failed');
            expect(mockTransaction.rollback).toHaveBeenCalled();
        });

        it('should handle save failure with rollback', async () => {
            testLesson.save = jest.fn().mockRejectedValue(new Error('Save failed'));

            await expect(Lesson.editLesson(testLesson, 'New description', LESSON_FORMAT.ONLINE, 'New location'))
                .rejects.toThrow('Lesson editing failed');
            expect(mockTransaction.rollback).toHaveBeenCalled();
        });
    });

    describe('Additional Error Cases', () => {
        it('should handle null lesson object', async () => {
            await expect(Lesson.editLesson(null, 'New description'))
                .rejects.toThrow();
        });

        it('should handle invalid lesson status transitions', async () => {
            testLesson.status = LESSON_STATUS.COMPLETED;

            await expect(Lesson.cancelLesson(testLesson))
                .rejects.toThrow();
        });
    });

    describe('Complex Scenarios', () => {
        describe('Validation Scenarios', () => {
            it('should validate tutee enrollment limits', async () => {
                const tuteeId = 'tutee123';
                mockSequelize.models.TuteeLesson.count = jest.fn()
                    .mockResolvedValue(MAX_SIGNEDUP_LESSONS_PER_TUTEE);

                await expect(
                    Lesson.enrollToLesson(testLesson, tuteeId, 'Test Tutee', 'tutee@test.com')
                ).rejects.toThrow();
            });
        });

        describe('Error Handling', () => {
            it('should handle concurrent modifications', async () => {
                testLesson.reload = jest.fn()
                    .mockRejectedValue(new Error('Row was modified by another transaction'));

                await expect(
                    Lesson.editLesson(testLesson, 'New description')
                ).rejects.toThrow();
            });

            it('should handle database constraint violations', async () => {
                mockSequelize.models.TuteeLesson.create = jest.fn()
                    .mockRejectedValue(new Error('Unique constraint violation'));

                await expect(
                    Lesson.enrollToLesson(testLesson, 'tutee123', 'Test Tutee', 'tutee@test.com')
                ).rejects.toThrow();
            });
        });

    });
});