const lessonService = require('../../../service/lesson-service');
const { Lesson, TuteeLesson } = require('../../../models');
const appError = require('../../../utils/errors/appError');
const { LESSON_STATUS } = require('../../../models/lesson');

// Mock the models
jest.mock('../../../models', () => ({
    Lesson: {
        create: jest.fn(),
        findByPk: jest.fn(),
        cancelLesson: jest.fn(),
        editLesson: jest.fn(),
        getAmountOfApprovedLessons: jest.fn(),
        getLessonsOfTutor: jest.fn(),
        uploadLessonReport: jest.fn(),
        searchAvailableLessons: jest.fn(),
        getLessonsOfTutee: jest.fn(),
        enrollToLesson: jest.fn(),
        withdrawFromLesson: jest.fn(),
        getVerdictPendingLessons: jest.fn(),
        updateLessonVerdict: jest.fn()
    },
    TuteeLesson: {
        findOne: jest.fn(),
        hasEnrolledTutees: jest.fn(),
        addReview: jest.fn()
    }
}));

describe('Lesson Service', () => {
    beforeEach(() => {
        // Clear all mocks before each test
        jest.clearAllMocks();
    });

    describe('createLesson', () => {
        const mockLessonData = {
            subjectName: 'Math',
            grade: '10',
            level: 'Advanced',
            description: 'Test lesson',
            tutorUserId: 'tutor123',
            tutorFullName: 'Test Tutor',
            tutorEmail: 'tutor@test.com',
            appointedDateTime: new Date(),
            format: 'online',
            locationOrLink: 'zoom.us/test'
        };

        it('should create a lesson successfully', async () => {
            const mockCreatedLesson = { id: 1, ...mockLessonData };
            Lesson.create.mockResolvedValue(mockCreatedLesson);

            const result = await lessonService.createLesson(mockLessonData);

            expect(Lesson.create).toHaveBeenCalledWith(mockLessonData);
            expect(result).toEqual(mockCreatedLesson);
        });

        it('should throw appError when creation fails', async () => {
            const error = new Error('Database error');
            Lesson.create.mockRejectedValue(error);

            await expect(lessonService.createLesson(mockLessonData))
                .rejects
                .toThrow('Failed to create lesson');
        });
    });

    describe('cancelLesson', () => {
        const mockLessonId = 1;
        const mockTutorId = 'tutor123';
        const mockLesson = {
            id: mockLessonId,
            tutorUserId: mockTutorId,
            status: LESSON_STATUS.CREATED,
            appointedDateTime: new Date(Date.now() + 24 * 60 * 60 * 1000) // tomorrow
        };

        it('should cancel a lesson successfully', async () => {
            Lesson.findByPk.mockResolvedValue(mockLesson);
            const mockCanceledLesson = { ...mockLesson, status: LESSON_STATUS.CANCELLED };
            Lesson.cancelLesson.mockResolvedValue(mockCanceledLesson);

            const result = await lessonService.cancelLesson(mockLessonId, mockTutorId);

            expect(Lesson.findByPk).toHaveBeenCalledWith(mockLessonId);
            expect(Lesson.cancelLesson).toHaveBeenCalledWith(mockLesson);
            expect(result).toEqual(mockCanceledLesson);
        });

        it('should throw error when lesson not found', async () => {
            Lesson.findByPk.mockResolvedValue(null);

            await expect(lessonService.cancelLesson(mockLessonId, mockTutorId))
                .rejects
                .toThrow('Lesson not found');
        });

        it('should throw error when unauthorized tutor', async () => {
            const unauthorizedTutorId = 'unauthorized123';
            Lesson.findByPk.mockResolvedValue(mockLesson);

            await expect(lessonService.cancelLesson(mockLessonId, unauthorizedTutorId))
                .rejects
                .toThrow('Unauthorized: Only the assigned tutor can cancel the lesson');
        });

        it('should throw error when canceling too close to appointment', async () => {
            const lessonSoon = {
                ...mockLesson,
                appointedDateTime: new Date(Date.now() + 2 * 60 * 60 * 1000) // 2 hours from now
            };
            Lesson.findByPk.mockResolvedValue(lessonSoon);

            await expect(lessonService.cancelLesson(mockLessonId, mockTutorId))
                .rejects
                .toThrow('Cancellation not allowed within 3 hours of the lesson');
        });

        it('should handle lesson already cancelled', async () => {
            const mockLesson = {
                id: 1,
                tutorUserId: 'tutor123',
                status: LESSON_STATUS.CANCELLED,
                appointedDateTime: new Date()
            };

            Lesson.findByPk.mockResolvedValue(mockLesson);

            await expect(lessonService.cancelLesson(1, 'tutor123'))
                .rejects.toThrow('Lesson cannot be canceled in this stage');
        });
    });

    describe('getLessonsOfTutor', () => {
        const mockTutorId = 'tutor123';
        const mockCategory = 'upcoming';

        it('should get tutor lessons successfully', async () => {
            const mockLessons = [
                { id: 1, tutorUserId: mockTutorId },
                { id: 2, tutorUserId: mockTutorId }
            ];
            Lesson.getLessonsOfTutor.mockResolvedValue(mockLessons);

            const result = await lessonService.getLessonsOfTutor(mockTutorId, mockCategory);

            expect(Lesson.getLessonsOfTutor).toHaveBeenCalledWith(mockTutorId, mockCategory);
            expect(result).toEqual(mockLessons);
        });

        it('should throw error when fetching fails', async () => {
            Lesson.getLessonsOfTutor.mockRejectedValue(new Error('Database error'));

            await expect(lessonService.getLessonsOfTutor(mockTutorId, mockCategory))
                .rejects
                .toThrow('Fetching lessons failed');
        });
    });

    describe('uploadLessonReport', () => {
        const mockData = {
            lessonId: 1,
            lessonSummary: 'Great lesson',
            tuteesPresence: [{ tuteeId: 1, present: true }],
            tutorUserId: 'tutor123'
        };

        const mockLesson = {
            id: 1,
            tutorUserId: 'tutor123',
            status: LESSON_STATUS.CREATED,
            appointedDateTime: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
        };

        it('should upload report successfully', async () => {
            Lesson.findByPk.mockResolvedValue(mockLesson);
            TuteeLesson.hasEnrolledTutees.mockResolvedValue(true);
            const mockUpdatedLesson = { ...mockLesson, summary: mockData.lessonSummary };
            Lesson.uploadLessonReport.mockResolvedValue(mockUpdatedLesson);

            const result = await lessonService.uploadLessonReport(
                mockData.lessonId,
                mockData.lessonSummary,
                mockData.tuteesPresence,
                mockData.tutorUserId
            );

            expect(result).toEqual(mockUpdatedLesson);
        });

        it('should throw error when lesson not found', async () => {
            Lesson.findByPk.mockResolvedValue(null);

            await expect(lessonService.uploadLessonReport(mockData.lessonId, mockData.lessonSummary, mockData.tuteesPresence, mockData.tutorUserId))
                .rejects.toThrow('Lesson not found');
        });

        it('should throw error when no enrolled tutees', async () => {
            Lesson.findByPk.mockResolvedValue(mockLesson);
            TuteeLesson.hasEnrolledTutees.mockResolvedValue(false);

            await expect(lessonService.uploadLessonReport(
                mockData.lessonId,
                mockData.lessonSummary,
                mockData.tuteesPresence,
                mockData.tutorUserId
            )).rejects.toThrow('Report upload failed: lesson has no participants.');
        });


        it('should handle invalid lesson status in uploadLessonReport', async () => {
            const mockLesson = {
                id: 1,
                tutorUserId: 'tutor123',
                status: LESSON_STATUS.CANCELLED,
                appointedDateTime: new Date()
            };

            Lesson.findByPk.mockResolvedValue(mockLesson);

            await expect(lessonService.uploadLessonReport(1, 'summary', [], 'tutor123'))
                .rejects.toThrow('Cannot upload lesson report in this stage');
        });

        it('should handle lesson in future for uploadLessonReport', async () => {
            const mockLesson = {
                id: 1,
                tutorUserId: 'tutor123',
                status: LESSON_STATUS.CREATED,
                appointedDateTime: new Date(Date.now() + 24 * 60 * 60 * 1000) // tomorrow
            };

            Lesson.findByPk.mockResolvedValue(mockLesson);

            await expect(lessonService.uploadLessonReport(1, 'summary', [], 'tutor123'))
                .rejects.toThrow('Cannot upload lesson report before lesson has ended');
        });

        it('should handle unauthorized tutor in uploadLessonReport', async () => {
            const mockLesson = {
                id: 1,
                tutorUserId: 'different-tutor',
                status: LESSON_STATUS.CREATED,
                appointedDateTime: new Date(Date.now() - 2 * 60 * 60 * 1000)
            };

            Lesson.findByPk.mockResolvedValue(mockLesson);

            await expect(lessonService.uploadLessonReport(1, 'summary', [], 'tutor123'))
                .rejects.toThrow('Unauthorized: Only assigned user can upload report');
        });

        it('should handle no enrolled tutees in uploadLessonReport', async () => {
            const mockLesson = {
                id: 1,
                tutorUserId: 'tutor123',
                status: LESSON_STATUS.CREATED,
                appointedDateTime: new Date(Date.now() - 2 * 60 * 60 * 1000)
            };

            Lesson.findByPk.mockResolvedValue(mockLesson);
            TuteeLesson.hasEnrolledTutees.mockResolvedValue(false);

            await expect(lessonService.uploadLessonReport(1, 'summary', [], 'tutor123'))
                .rejects.toThrow('Report upload failed: lesson has no participants.');
        });
    });

    describe('editLesson', () => {
        const mockLessonId = 1;
        const mockTutorId = 'tutor123';
        const mockData = {
            description: 'Updated description',
            format: 'online',
            locationOrLink: 'zoom.us/updated'
        };

        it('should edit lesson successfully', async () => {
            const mockLesson = {
                id: mockLessonId,
                tutorUserId: mockTutorId,
                status: LESSON_STATUS.CREATED
            };
            Lesson.findByPk.mockResolvedValue(mockLesson);
            const mockUpdatedLesson = { ...mockLesson, ...mockData };
            Lesson.editLesson.mockResolvedValue(mockUpdatedLesson);

            const result = await lessonService.editLesson(
                mockLessonId,
                mockTutorId,
                mockData.description,
                mockData.format,
                mockData.locationOrLink
            );

            expect(result).toEqual(mockUpdatedLesson);
            expect(Lesson.editLesson).toHaveBeenCalledWith(
                mockLesson,
                mockData.description,
                mockData.format,
                mockData.locationOrLink
            );
        });

        it('should throw error when lesson not found', async () => {
            Lesson.findByPk.mockResolvedValue(null);

            await expect(lessonService.editLesson(
                mockLessonId,
                mockTutorId,
                mockData.description,
                mockData.format,
                mockData.locationOrLink
            )).rejects.toThrow('Lesson not found');
        });

        it('should throw error when unauthorized tutor', async () => {
            const mockLesson = {
                id: mockLessonId,
                tutorUserId: 'different-tutor',
                status: LESSON_STATUS.CREATED
            };
            Lesson.findByPk.mockResolvedValue(mockLesson);

            await expect(lessonService.editLesson(
                mockLessonId,
                mockTutorId,
                mockData.description,
                mockData.format,
                mockData.locationOrLink
            )).rejects.toThrow('Unauthorized: Only assigned tutor can edit lesson');
        });

        it('should handle invalid lesson status in editLesson', async () => {
            const mockLesson = {
                id: 1,
                tutorUserId: 'tutor123',
                status: LESSON_STATUS.CANCELLED
            };

            Lesson.findByPk.mockResolvedValue(mockLesson);

            await expect(lessonService.editLesson(1, 'tutor123', 'description', 'format', 'locationOrLink'))
                .rejects.toThrow('Lesson cannot be edited in this stage');
        });
    });

    describe('searchAvailableLessons', () => {
        const mockSearchParams = {
            subject: 'Math',
            grade: '10',
            level: 'Advanced',
            tuteeUserId: 'tutee123'
        };

        it('should search lessons successfully', async () => {
            const mockLessons = [
                { id: 1, subjectName: 'Math' },
                { id: 2, subjectName: 'Math' }
            ];
            Lesson.searchAvailableLessons.mockResolvedValue(mockLessons);

            const result = await lessonService.searchAvailableLessons(
                mockSearchParams.subject,
                mockSearchParams.grade,
                mockSearchParams.level,
                mockSearchParams.tuteeUserId
            );

            expect(result).toEqual(mockLessons);
            expect(Lesson.searchAvailableLessons).toHaveBeenCalledWith(
                mockSearchParams.subject,
                mockSearchParams.grade,
                mockSearchParams.level,
                mockSearchParams.tuteeUserId
            );
        });

        it('should handle search errors gracefully', async () => {
            Lesson.searchAvailableLessons.mockRejectedValue(new Error('Search failed'));

            await expect(lessonService.searchAvailableLessons(
                mockSearchParams.subject,
                mockSearchParams.grade,
                mockSearchParams.level,
                mockSearchParams.tuteeUserId
            )).rejects.toThrow('Lesson search failed');
        });
    });

    describe('enrollToLesson', () => {
        const mockEnrollData = {
            lessonId: 1,
            tuteeUserId: 'tutee123',
            tuteeFullName: 'Test Tutee',
            tuteeEmail: 'tutee@test.com'
        };

        const mockLesson = {
            id: 1,
            status: LESSON_STATUS.CREATED,
            appointedDateTime: new Date(Date.now() + 24 * 60 * 60 * 1000) // tomorrow
        };

        it('should enroll successfully', async () => {
            Lesson.findByPk.mockResolvedValue(mockLesson);
            const mockEnrollment = { ...mockLesson, tuteeId: mockEnrollData.tuteeUserId };
            Lesson.enrollToLesson.mockResolvedValue(mockEnrollment);

            const result = await lessonService.enrollToLesson(
                mockEnrollData.lessonId,
                mockEnrollData.tuteeUserId,
                mockEnrollData.tuteeFullName,
                mockEnrollData.tuteeEmail
            );

            expect(result).toEqual(mockEnrollment);
        });

        it('should throw error when lesson not found', async () => {
            Lesson.findByPk.mockResolvedValue(null);

            await expect(lessonService.enrollToLesson(
                mockEnrollData.lessonId,
                mockEnrollData.tuteeUserId,
                mockEnrollData.tuteeFullName,
                mockEnrollData.tuteeEmail
            )).rejects.toThrow('Lesson not found');
        });

        it('should throw error when enrolling in past lesson', async () => {
            const pastLesson = {
                ...mockLesson,
                appointedDateTime: new Date(Date.now() - 24 * 60 * 60 * 1000) // yesterday
            };
            Lesson.findByPk.mockResolvedValue(pastLesson);

            await expect(lessonService.enrollToLesson(
                mockEnrollData.lessonId,
                mockEnrollData.tuteeUserId,
                mockEnrollData.tuteeFullName,
                mockEnrollData.tuteeEmail
            )).rejects.toThrow('Cannot enroll for past lesson');
        });
    });

    describe('withdrawFromLesson', () => {
        const mockLessonId = 1;
        const mockTuteeId = 'tutee123';
        const mockLesson = {
            id: mockLessonId,
            status: LESSON_STATUS.CREATED,
            appointedDateTime: new Date(Date.now() + 24 * 60 * 60 * 1000) // tomorrow
        };

        it('should withdraw successfully', async () => {
            Lesson.findByPk.mockResolvedValue(mockLesson);
            TuteeLesson.findOne.mockResolvedValue({ lessonId: mockLessonId, tuteeUserId: mockTuteeId });
            const mockWithdrawalResult = { success: true };
            Lesson.withdrawFromLesson.mockResolvedValue(mockWithdrawalResult);

            const result = await lessonService.withdrawFromLesson(mockLessonId, mockTuteeId);

            expect(result).toEqual(mockWithdrawalResult);
        });

        it('should throw error when lesson not found', async () => {
            Lesson.findByPk.mockResolvedValue(null);

            await expect(lessonService.withdrawFromLesson(mockLessonId, mockTuteeId))
                .rejects.toThrow('Lesson not found');
        });

        it('should throw error when withdrawal too close to lesson', async () => {
            const soonLesson = {
                ...mockLesson,
                appointedDateTime: new Date(Date.now() + 2 * 60 * 60 * 1000) // 2 hours from now
            };
            Lesson.findByPk.mockResolvedValue(soonLesson);
            TuteeLesson.findOne.mockResolvedValue({ lessonId: mockLessonId, tuteeUserId: mockTuteeId });

            await expect(lessonService.withdrawFromLesson(mockLessonId, mockTuteeId))
                .rejects.toThrow('Withdrawal not allowed within 3 hours of the lesson');
        });

        it('should handle tutee not enrolled in withdrawFromLesson', async () => {
            const mockLesson = {
                id: 1,
                status: LESSON_STATUS.CREATED,
                appointedDateTime: new Date(Date.now() + 24 * 60 * 60 * 1000)
            };

            Lesson.findByPk.mockResolvedValue(mockLesson);
            TuteeLesson.findOne.mockResolvedValue(null);

            await expect(lessonService.withdrawFromLesson(1, 'tutee123'))
                .rejects.toThrow('Enrollment not found');
        });

        it('should handle invalid status in withdrawFromLesson', async () => {
            const mockLesson = {
                id: 1,
                status: LESSON_STATUS.CANCELLED,
                appointedDateTime: new Date()
            };
            const mockTuteeLesson = {
                lessonId: 1,
                tuteeUserId: 'tutee123'
            };

            Lesson.findByPk.mockResolvedValue(mockLesson);
            TuteeLesson.findOne.mockResolvedValue(mockTuteeLesson);

            await expect(lessonService.withdrawFromLesson(1, 'tutee123'))
                .rejects.toThrow('Lesson cannot be withdrawn in this stage');
        });
    });

    describe('getVerdictPendingLessons', () => {
        it('should get verdict pending lessons successfully', async () => {
            const mockLessons = [
                { id: 1, status: 'pending_verdict' },
                { id: 2, status: 'pending_verdict' }
            ];
            Lesson.getVerdictPendingLessons.mockResolvedValue(mockLessons);

            const result = await lessonService.getVerdictPendingLessons();

            expect(result).toEqual(mockLessons);
        });

        it('should handle errors when fetching verdict pending lessons', async () => {
            Lesson.getVerdictPendingLessons.mockRejectedValue(new Error('Fetch failed'));

            await expect(lessonService.getVerdictPendingLessons())
                .rejects.toThrow('Fetching verdict pending lessons failed');
        });
    });

    describe('updateLessonVerdict', () => {
        const mockLessonId = 1;
        const mockIsApproved = true;

        it('should update verdict successfully', async () => {
            const mockUpdatedLesson = { id: mockLessonId, status: 'approved' };
            Lesson.updateLessonVerdict.mockResolvedValue(mockUpdatedLesson);

            const result = await lessonService.updateLessonVerdict(mockLessonId, mockIsApproved);

            expect(result).toEqual(mockUpdatedLesson);
            expect(Lesson.updateLessonVerdict).toHaveBeenCalledWith(mockLessonId, mockIsApproved);
        });

        it('should handle errors when updating verdict', async () => {
            Lesson.updateLessonVerdict.mockRejectedValue(new Error('Update failed'));

            await expect(lessonService.updateLessonVerdict(mockLessonId, mockIsApproved))
                .rejects.toThrow('Updating verdict failed');
        });

    });

    describe('getLessonsOfTutee', () => {
        const mockTuteeId = 'tutee123';
        const mockCategory = 'upcoming';

        it('should get tutee lessons successfully', async () => {
            const mockLessons = [
                { id: 1, tuteeUserId: mockTuteeId },
                { id: 2, tuteeUserId: mockTuteeId }
            ];
            Lesson.getLessonsOfTutee.mockResolvedValue(mockLessons);

            const result = await lessonService.getLessonsOfTutee(mockTuteeId, mockCategory);

            expect(result).toEqual(mockLessons);
            expect(Lesson.getLessonsOfTutee).toHaveBeenCalledWith(mockTuteeId, mockCategory);
        });

        it('should handle appError specifically', async () => {
            const appErr = new appError('Custom error', 400, 'TEST_ERROR', 'test');
            Lesson.getLessonsOfTutee.mockRejectedValue(appErr);

            await expect(lessonService.getLessonsOfTutee(mockTuteeId, mockCategory))
                .rejects.toThrow(appErr);
        });

        it('should handle generic errors', async () => {
            Lesson.getLessonsOfTutee.mockRejectedValue(new Error('Database error'));

            await expect(lessonService.getLessonsOfTutee(mockTuteeId, mockCategory))
                .rejects.toThrow('Fetching lessons failed');
        });
    });

    describe('addReview', () => {
        const mockReviewData = {
            lessonId: 1,
            tuteeUserId: 'tutee123',
            clarity: 5,
            understanding: 4,
            focus: 5,
            helpful: 4
        };

        const mockLesson = {
            id: 1,
            status: LESSON_STATUS.CREATED,
            appointedDateTime: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
        };

        const mockTuteeLesson = {
            lessonId: 1,
            tuteeUserId: 'tutee123'
        };

        it('should handle invalid lesson status', async () => {
            const invalidLesson = { ...mockLesson, status: LESSON_STATUS.CANCELLED };
            Lesson.findByPk.mockResolvedValue(invalidLesson);

            await expect(lessonService.addReview(
                mockReviewData.lessonId,
                mockReviewData.tuteeUserId,
                mockReviewData.clarity,
                mockReviewData.understanding,
                mockReviewData.focus,
                mockReviewData.helpful
            )).rejects.toThrow('Cannot review lesson in this stage');
        });

        it('should handle review time window constraints', async () => {
            const recentLesson = {
                ...mockLesson,
                appointedDateTime: new Date(Date.now() - 30 * 60 * 1000),
                status: LESSON_STATUS.CREATED
            };
            Lesson.findByPk.mockResolvedValue(recentLesson);
            TuteeLesson.findOne.mockResolvedValue(mockTuteeLesson);

            await expect(lessonService.addReview(
                mockReviewData.lessonId,
                mockReviewData.tuteeUserId,
                mockReviewData.clarity,
                mockReviewData.understanding,
                mockReviewData.focus,
                mockReviewData.helpful
            )).rejects.toThrow('Review period expired');
        });

        it('should handle expired review period', async () => {
            const oldLesson = {
                ...mockLesson,
                appointedDateTime: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), // 8 days ago
                status: LESSON_STATUS.CREATED
            };
            Lesson.findByPk.mockResolvedValue(oldLesson);
            TuteeLesson.findOne.mockResolvedValue(mockTuteeLesson);

            await expect(lessonService.addReview(
                mockReviewData.lessonId,
                mockReviewData.tuteeUserId,
                mockReviewData.clarity,
                mockReviewData.understanding,
                mockReviewData.focus,
                mockReviewData.helpful
            )).rejects.toThrow('Review period expired');
        });

        it('should handle tutee not enrolled in addReview', async () => {
            const mockLesson = {
                id: 1,
                status: LESSON_STATUS.CREATED,
                appointedDateTime: new Date(Date.now() - 2 * 60 * 60 * 1000)
            };
            Lesson.findByPk.mockResolvedValue(mockLesson);
            TuteeLesson.findOne.mockResolvedValue(null);

            await expect(lessonService.addReview(1, 'tutee123', 5, 4, 5, 4))
                .rejects.toThrow('Enrollment in this lesson not found');
        });

        it('should handle lesson not found', async () => {
            Lesson.findByPk.mockResolvedValue(null);

            await expect(lessonService.addReview(1, 'tutee123', 5, 4, 5, 4))
                .rejects.toThrow('Lesson not found');
        });


    });

    describe('getAmountOfApprovedLessons', () => {
        const mockTutorId = 'tutor123';

        it('should get amount successfully', async () => {
            const mockAmount = 5;
            Lesson.getAmountOfApprovedLessons.mockResolvedValue(mockAmount);

            const result = await lessonService.getAmountOfApprovedLessons(mockTutorId);

            expect(result).toBe(mockAmount);
            expect(Lesson.getAmountOfApprovedLessons).toHaveBeenCalledWith(mockTutorId);
        });

        it('should handle errors properly', async () => {
            Lesson.getAmountOfApprovedLessons.mockRejectedValue(new Error('Database error'));

            await expect(lessonService.getAmountOfApprovedLessons(mockTutorId))
                .rejects.toThrow('Fetching approved lessons amount failed');
        });
    });

    describe('Error handling edge cases', () => {
        it('should handle null values in createLesson', async () => {
            const invalidData = {
                tutorUserId: 'tutor123'
                // Omitting required fields should cause validation error
            };

            Lesson.create.mockRejectedValue(new Error('Validation error'));

            await expect(lessonService.createLesson(invalidData))
                .rejects.toThrow('Failed to create lesson');
        });


        it('should handle database connection errors', async () => {
            Lesson.findByPk.mockRejectedValue(new Error('Connection failed'));

            await expect(lessonService.cancelLesson(1, 'tutor123'))
                .rejects.toThrow('Failed to cancel lesson');
        });
    });
});
