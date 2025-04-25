const lessonController = require('../../../controllers/lesson-controller');
const lessonService = require('../../../service/lesson-service');

jest.mock('../../../service/lesson-service');

describe('Lesson Controller', () => {
    let req;
    let res;
    let next;

    beforeEach(() => {
        jest.clearAllMocks();

        req = {
            userId: 'mock-tutor-id',
            userFullName: 'Mock Tutor',
            userEmail: 'tutor@test.com',
            validatedBody: {},
            path: ''
        };

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        next = jest.fn();
    });

    describe('createLesson', () => {
        it('should create a lesson successfully', async () => {
            const mockLesson = {
                id: 1,
                title: 'Test Lesson',
                description: 'Test Description'
            };
            req.validatedBody = { title: 'Test Lesson', description: 'Test Description' };
            lessonService.createLesson.mockResolvedValue(mockLesson);

            await lessonController.createLesson(req, res, next);

            expect(lessonService.createLesson).toHaveBeenCalledWith({
                ...req.validatedBody,
                tutorUserId: req.userId,
                tutorFullName: req.userFullName,
                tutorEmail: req.userEmail
            });
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: 'Lesson created successfully',
                data: { lesson: mockLesson }
            });
        });

        it('should handle errors properly', async () => {
            const error = new Error('Test error');
            lessonService.createLesson.mockRejectedValue(error);
            await lessonController.createLesson(req, res, next);
            expect(next).toHaveBeenCalledWith(error);
        });
    });

    describe('cancelLesson', () => {
        it('should cancel a lesson successfully', async () => {
            const mockCanceledLesson = { lesson: { id: 1, status: 'canceled' } };
            req.validatedBody = { lessonId: 1 };
            lessonService.cancelLesson.mockResolvedValue(mockCanceledLesson);

            await lessonController.cancelLesson(req, res, next);

            expect(lessonService.cancelLesson).toHaveBeenCalledWith(1, req.userId);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: 'Lesson canceled successfully',
                data: { lesson: mockCanceledLesson.lesson }
            });
        });

        it('should handle cancellation errors', async () => {
            const error = new Error('Cannot cancel lesson');
            lessonService.cancelLesson.mockRejectedValue(error);
            req.validatedBody = { lessonId: 1 };
            await lessonController.cancelLesson(req, res, next);
            expect(next).toHaveBeenCalledWith(error);
        });
    });

    describe('getLessonsOfTutor', () => {
        const mockLessons = [{ id: 1, title: 'Test Lesson' }];

        it('should get upcoming lessons', async () => {
            req.path = '/lessons/tutor-upcoming-lessons';
            lessonService.getLessonsOfTutor.mockResolvedValue(mockLessons);

            await lessonController.getLessonsOfTutor(req, res, next);

            expect(lessonService.getLessonsOfTutor).toHaveBeenCalledWith(req.userId, 'upcoming');
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: 'Tutor upcoming lessons retrieved successfully',
                data: { lessonsWithEnrolledTutees: mockLessons }
            });
        });

        it('should get summary pending lessons', async () => {
            req.path = '/lessons/tutor-summary-pending-lessons';
            lessonService.getLessonsOfTutor.mockResolvedValue(mockLessons);

            await lessonController.getLessonsOfTutor(req, res, next);

            expect(lessonService.getLessonsOfTutor).toHaveBeenCalledWith(req.userId, 'summaryPending');
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: 'Tutor summaryPending lessons retrieved successfully',
                data: { lessonsWithEnrolledTutees: mockLessons }
            });
        });
    });

    describe('uploadLessonReport', () => {
        it('should upload a lesson report successfully', async () => {
            const mockUpdatedLesson = { id: 1, summary: 'Test Summary', status: 'completed' };
            req.validatedBody = { lessonId: 1, lessonSummary: 'Test Summary', tuteesPresence: [{ tuteeUserId: 'tutee1', presence: true }] };
            lessonService.uploadLessonReport.mockResolvedValue(mockUpdatedLesson);

            await lessonController.uploadLessonReport(req, res, next);

            expect(lessonService.uploadLessonReport).toHaveBeenCalledWith(
                req.validatedBody.lessonId,
                req.validatedBody.lessonSummary,
                req.validatedBody.tuteesPresence,
                req.userId
            );
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: 'Lesson report uploaded successfully',
                data: { updatedLesson: mockUpdatedLesson }
            });
        });
    });

    describe('editLesson', () => {
        it('should edit lesson successfully', async () => {
            const mockLesson = { id: 1, description: 'Updated' };
            req.validatedBody = { lessonId: 1, description: 'Updated', format: 'online', locationOrLink: 'new-link' };
            lessonService.editLesson.mockResolvedValue(mockLesson);

            await lessonController.editLesson(req, res, next);

            expect(lessonService.editLesson).toHaveBeenCalledWith(
                req.validatedBody.lessonId,
                req.userId,
                req.validatedBody.description,
                req.validatedBody.format,
                req.validatedBody.locationOrLink
            );
            expect(res.status).toHaveBeenCalledWith(200);
        });
    });

    describe('getAmountOfApprovedLessons', () => {
        it('should get amount of approved lessons', async () => {
            const mockAmount = 5;
            lessonService.getAmountOfApprovedLessons.mockResolvedValue(mockAmount);

            await lessonController.getAmountOfApprovedLessons(req, res, next);

            expect(lessonService.getAmountOfApprovedLessons).toHaveBeenCalledWith(req.userId);
            expect(res.status).toHaveBeenCalledWith(200);
        });
    });

    describe('enrollToLesson', () => {
        it('should enroll to lesson successfully', async () => {
            const mockEnrollment = { id: 1, status: 'enrolled' };
            req.validatedBody = { lessonId: 1 };
            lessonService.enrollToLesson.mockResolvedValue(mockEnrollment);

            await lessonController.enrollToLesson(req, res, next);

            expect(lessonService.enrollToLesson).toHaveBeenCalledWith(
                req.validatedBody.lessonId,
                req.userId,
                req.userFullName,
                req.userEmail
            );
            expect(res.status).toHaveBeenCalledWith(200);
        });
    });

    describe('getLessonsOfTutee', () => {
        const mockLessons = [{ id: 1 }];

        it('should get tutee upcoming lessons', async () => {
            req.path = '/lessons/tutee-upcoming-lessons';
            lessonService.getLessonsOfTutee.mockResolvedValue(mockLessons);

            await lessonController.getLessonsOfTutee(req, res, next);

            expect(lessonService.getLessonsOfTutee).toHaveBeenCalledWith(req.userId, 'upcoming');
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('should get tutee review pending lessons', async () => {
            req.path = '/lessons/tutee-review-pending-lessons';
            lessonService.getLessonsOfTutee.mockResolvedValue(mockLessons);

            await lessonController.getLessonsOfTutee(req, res, next);

            expect(lessonService.getLessonsOfTutee).toHaveBeenCalledWith(req.userId, 'reviewPending');
        });
    });


    describe('searchAvailableLessons', () => {
        it('should search available lessons successfully', async () => {
            const mockLessons = [{ id: 1 }];
            lessonService.searchAvailableLessons.mockResolvedValue(mockLessons);

            await lessonController.searchAvailableLessons(req, res, next);

            expect(lessonService.searchAvailableLessons).toHaveBeenCalledWith(
                req.validatedBody.subjectName,
                req.validatedBody.grade,
                req.validatedBody.level,
                req.userId
            );
            expect(res.status).toHaveBeenCalledWith(200);
        });
    });

    describe('withdrawFromLesson', () => {
        it('should withdraw from lesson successfully', async () => {
            const mockWithdrawal = { id: 1, status: 'withdrawn' };
            req.validatedBody = { lessonId: 1 };
            lessonService.withdrawFromLesson.mockResolvedValue(mockWithdrawal);

            await lessonController.withdrawFromLesson(req, res, next);

            expect(lessonService.withdrawFromLesson).toHaveBeenCalledWith(
                req.validatedBody.lessonId,
                req.userId
            );
            expect(res.status).toHaveBeenCalledWith(200);
        });
    });

    describe('addReview', () => {
        it('should add a review successfully', async () => {
            const mockReview = { id: 1, rating: 5 };
            req.validatedBody = {
                lessonId: 1,
                clarity: 5,
                understanding: 5,
                focus: 5,
                helpful: 5
            };
            req.userId = 'mock-tutee-id';

            lessonService.addReview.mockResolvedValue(mockReview);

            await lessonController.addReview(req, res, next);

            expect(lessonService.addReview).toHaveBeenCalledWith(
                req.validatedBody.lessonId,
                req.userId,
                req.validatedBody.clarity,
                req.validatedBody.understanding,
                req.validatedBody.focus,
                req.validatedBody.helpful
            );
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: 'Review added successfully',
                data: { review: mockReview }
            });
        });
    });

    describe('getVerdictPendingLessons', () => {
        it('should get verdict pending lessons successfully', async () => {
            const mockVerdictPendingLessons = [{ id: 1 }];
            lessonService.getVerdictPendingLessons.mockResolvedValue(mockVerdictPendingLessons);

            await lessonController.getVerdictPendingLessons(req, res, next);

            expect(lessonService.getVerdictPendingLessons).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
        });
    });

    describe('updateLessonVerdict', () => {
        it('should update lesson verdict successfully', async () => {
            const mockUpdatedLesson = { id: 1, status: 'approved' };
            req.validatedBody = { lessonId: 1, isApproved: true };
            lessonService.updateLessonVerdict.mockResolvedValue(mockUpdatedLesson);

            await lessonController.updateLessonVerdict(req, res, next);

            expect(lessonService.updateLessonVerdict).toHaveBeenCalledWith(
                req.validatedBody.lessonId,
                req.validatedBody.isApproved
            );
            expect(res.status).toHaveBeenCalledWith(200);
        });
    });

    // Consolidated Error Handling Tests
    describe('Error Handling', () => {
        const methods = [
            'editLesson',
            'getAmountOfApprovedLessons',
            'enrollToLesson',
            'getLessonsOfTutee',
            'searchAvailableLessons',
            'addReview',
            'withdrawFromLesson',
            'updateLessonVerdict',
            'getVerdictPendingLessons',
            'createLesson',
            'cancelLesson',
            'uploadLessonReport',
            'getLessonsOfTutor'
        ];

        methods.forEach(method => {
            it(`should handle errors in ${method}`, async () => {
                const error = new Error(`${method} error`);
                lessonService[method].mockRejectedValue(error);
                await lessonController[method](req, res, next);
                expect(next).toHaveBeenCalledWith(error);
            });
        });
    });
});
