const { Lesson, TuteeLesson } = require('../models');
const appError = require('../utils/errors/appError');
const { LESSON_STATUS } = require('../models/lesson');

//*Tutor
/**
 * Create a new lesson
 * @param {Object} lessonData - The validated lesson data
 * @param {string} lessonData.subjectName - The subject of the lesson
 * @param {string} lessonData.grade - The grade level
 * @param {string} lessonData.level - The level of the lesson
 * @param {string} lessonData.description - The lesson description
 * @param {string} lessonData.tutorUserId - The user ID of the tutor
 * @param {string} lessonData.tutorFullName - The full name of the tutor
 * @param {string} lessonData.tutorEmail - The email of the tutor
 * @param {Date} lessonData.appointedDateTime - The date and time of the lesson
 * @param {string} lessonData.format - The format of the lesson (online/offline)
 * @param {string} [lessonData.locationOrLink] - Optional location or link for the lesson
 * @returns {Promise<Object>} The created lesson
 */
const createLesson = async ({ subjectName, grade, level, description, tutorUserId, tutorFullName, tutorEmail, appointedDateTime, format, locationOrLink }) => {
    try {
        const lessonToCreate = await Lesson.create({
            subjectName,
            grade,
            level,
            description,
            tutorUserId,
            tutorFullName,
            tutorEmail,
            appointedDateTime,
            format,
            locationOrLink,
        });

        return lessonToCreate;
    } catch (error) {
        if (error instanceof appError) {
            throw error;
        }
        throw new appError('Failed to create lesson', 500, 'CREATE_LESSON_ERROR', 'lesson-service:createLesson');
    }
};

/**
 * Cancel a lesson
 * @param {number} lessonId - The ID of the lesson
 * @param {string} tutorUserId - The ID of the tutor
 * @returns {Promise<Object>} The canceled lesson
 */
const cancelLesson = async (lessonId, tutorUserId) => {
    try {
        const lessonToCancel = await Lesson.findByPk(lessonId);

        if (!lessonToCancel) {
            throw new appError('Lesson not found', 404, 'NOT_FOUND', 'lesson-service:cancelLesson');
        }
        if (lessonToCancel.tutorUserId !== tutorUserId) {
            throw new appError('Unauthorized: Only the assigned tutor can cancel the lesson', 403, 'UNAUTHORIZED', 'lesson-service:cancelLesson');
        }
        if (lessonToCancel.status !== LESSON_STATUS.CREATED) {
            throw new appError(`Lesson cannot be canceled in its current status: ${lessonToCancel.status}`, 400, 'INVALID_STATUS', 'lesson-service:cancelLesson');
        }
        if (lessonToCancel.appointedDateTime <= new Date()) {
            throw new appError('Cannot cancel a lessons whose appointed time has passed', 400, 'TIME_PASSED', 'lesson-service:cancelLesson');
        }

        const result = await Lesson.cancelLesson(lessonToCancel);
        return result;
    } catch (error) {
        if (error instanceof appError) {
            throw error;
        }
        throw new appError('Failed to cancel lesson', 500, 'CANCEL_LESSON_ERROR', 'lesson-service:cancelLesson');
    }
};

/**
 * Edit a lesson
 * @param {Object} lessonData - The validated lesson data
 * @param {number} lessonData.lessonId - The ID of the lesson to edit
 * @param {string} lessonData.tutorUserId - The user ID of the tutor
 * @param {string} lessonData.description - The lesson description
 * @param {string} lessonData.format - The format of the lesson (online/offline)
 * @param {string} [lessonData.locationOrLink] - Optional location or link for the lesson
 * @returns {Promise<Object>} The updated lesson
 * */
const editLesson = async (lessonId, tutorUserId, description, format, locationOrLink) => {
    try {

        const lessonToEdit = await Lesson.findByPk(lessonId);
        if (!lessonToEdit) {
            throw new appError('Lesson not found', 404, 'NOT_FOUND', 'lesson-service:editLesson');
        }
        if (lessonToEdit.tutorUserId !== tutorUserId) {
            throw new appError('Unauthorized: Only the assigned tutor can edit the lesson', 403, 'UNAUTHORIZED', 'lesson-service:editLesson');
        }
        if (lessonToEdit.status !== LESSON_STATUS.CREATED) {
            throw new appError(`Lesson cannot be edited in its current status: ${lessonToEdit.status}`, 400, 'INVALID_STATUS', 'lesson-service:editLesson');
        }
        const updatedLesson = await Lesson.editLesson(lessonToEdit, description, format, locationOrLink);
        return updatedLesson;
    } catch (error) {
        if (error instanceof appError) {
            throw error;
        }
        throw new appError("Failed to edit lesson", 500, "EDIT_LESSON_ERROR", "lesson-service:editLesson");
    }
};

/**
 * Get the amount of approved lessons
 * @param {string} tutorUserId - The ID of the tutor
 * @returns {Promise<number>} The amount of approved lessons
 */
const getAmountOfApprovedLessons = async (tutorUserId) => {
    try {
        const amountOfApprovedLessons = await Lesson.getAmountOfApprovedLessons(tutorUserId);
        return amountOfApprovedLessons;
    } catch (error) {
        throw new appError('Failed to get amount of approved lessons', 500, 'GET_AMOUNT_OF_APPROVED_LESSONS_ERROR', 'lesson-service:getAmountOfApprovedLessons');
    }
}

/**
 * Get all lessons by tutor (upcoming or summary pending)
 * @param {string} tutorUserId - The ID of the tutor
 * @param {string} lessonCategory - The type of lessons to retrieve ('upcoming' or 'summaryPending')
 * @returns {Promise<Array>} Array of lessons
 */
const getLessonsOfTutor = async (tutorUserId, lessonCategory) => {
    try {
        const lessons = await Lesson.getLessonsOfTutor(tutorUserId, lessonCategory);
        return lessons;
    } catch (error) {
        if (error instanceof appError) {
            throw error;
        }
        throw new appError('Failed to get lessons of tutor', 500, 'SERVICE_ERROR', 'lesson-service:getLessonsOfTutor');
    }
};

/**
 * Upload a lesson report (tutor only)
 * @param {number} lessonId - The ID of the lesson
 * @param {string} lessonSummary - The summary of the lesson
 * @param {string} tuteesPresence - The presence of the tutees
 * @param {string} tutorUserId - The ID of the tutor
 * @returns {Promise<Object>} The updated lesson
 */
const uploadLessonReport = async (lessonId, lessonSummary, tuteesPresence, tutorUserId) => {
    try {
        const lessonToUploadReport = await Lesson.findByPk(lessonId);
        if (!lessonToUploadReport) {
            throw new appError('Lesson not found', 404, 'NOT_FOUND', 'lesson-service:uploadLessonReport');
        }
        if (lessonToUploadReport.tutorUserId !== tutorUserId) {
            throw new appError('Unauthorized: Only the assigned tutor can upload a lesson report', 403, 'UNAUTHORIZED', 'lesson-service:uploadLessonReport');
        }
        if (lessonToUploadReport.status !== LESSON_STATUS.CREATED) {
            throw new appError(`Lesson report cannot be uploaded in its current status: ${lessonToUploadReport.status}`, 400, 'INVALID_STATUS', 'lesson-service:uploadLessonReport');
        }
        if (lessonToUploadReport.appointedDateTime > new Date()) {
            throw new appError('Cannot upload a lesson report for a lesson whose not occurred yet', 400, 'LESSON_NOT_OCCURRED', 'lesson-service:uploadLessonReport');
        }

        const updatedLesson = await Lesson.uploadLessonReport(lessonToUploadReport, lessonSummary, tuteesPresence, tutorUserId);
        return updatedLesson;
    } catch (error) {
        if (error instanceof appError) {
            throw error;
        }
        throw new appError('Failed to upload lesson report', 500, 'UPLOAD_REPORT_ERROR', 'lesson-service:uploadLessonReport');
    }
};

//*Tutee

/**
 * Get available lessons by subject, grade, and level
 * @param {Object} filterData
 * @param {string} filterData.subject - Subject name
 * @param {string|number} filterData.grade - Grade level
 * @param {string} filterData.level - Skill level
 * @param {string} filterData.tuteeId - User ID from token
 * @returns {Promise<Array>} Filtered lessons
 */
const searchAvailableLessons = async (subject, grade, level, tuteeUserId) => {
    try {
        return await Lesson.searchAvailableLessons(subject, grade, level, tuteeUserId);
    } catch (error) {
        if (error instanceof appError) {
            throw error;
        }
        throw new appError(
            'Failed to get available lessons',
            500,
            'GET_AVAILABLE_ERROR',
            'lesson-service:getAvailableLessons'
        );
    }
};

/**
 * Get all lessons by tutee (upcoming or review pending)
 * @param {string} tuteeUserId - The ID of the tutee
 * @param {string} lessonCategory - The type of lessons to retrieve ('upcoming' or 'reviewPending')
 * @returns {Promise<Array>} Array of lessons
 */
const getLessonsOfTutee = async (tuteeUserId, lessonCategory) => {
    try {
        const lessons = await Lesson.getLessonsOfTutee(tuteeUserId, lessonCategory);
        return lessons;
    } catch (error) {
        if (error instanceof appError) {
            throw error;
        }
        throw new appError('Failed to get lessons of tutee', 500, 'SERVICE_ERROR', 'lesson-service:getLessonsOfTutee');
    }
};


/**
 * Enroll a tutee into a lesson
 * @param {number} lessonId - The ID of the lesson
 * @param {string} tuteeUserId - The ID of the tutee
 * @param {string} tuteeFullName - The full name of the tutee
 * @param {string} tuteeEmail - The email of the tutee
 */
const enrollToLesson = async (lessonId, tuteeUserId, tuteeFullName, tuteeEmail) => {
    try {
        // Check lesson existence and status
        const lessonToEnroll = await Lesson.findByPk(lessonId);
        if (!lessonToEnroll) {
            throw new appError('Lesson not found', 404, 'NOT_FOUND', 'lesson-service:enrollToLesson');
        }
        if (lessonToEnroll.status !== LESSON_STATUS.CREATED) {
            throw new appError(`Lesson is in an invalid status: ${lessonToEnroll.status}`, 400, 'INVALID_STATUS', 'lesson-service:enrollToLesson');
        }
        if (lessonToEnroll.appointedDateTime <= new Date()) {
            throw new appError('Cannot sign up for past lesson', 400, 'TIME_PASSED', 'lesson-service:enrollToLesson');
        }
        // Delegate to model layer for data operations and synchronization
        const result = await Lesson.enrollToLesson(lessonToEnroll, tuteeUserId, tuteeFullName, tuteeEmail);
        return result;
    } catch (error) {
        if (error instanceof appError) {
            throw error;
        }
        throw new appError('Failed to enroll tutee to lesson', 500, 'ENROLL_ERROR', 'lesson-service:enrollToLesson');
    }
};


/**
 * Withdraw a tutee from a lesson
 * @param {number} lessonId - The ID of the lesson
 * @param {number} tuteeUserId - The ID of the tutee
 * @returns {Promise<Object>} The withdrawal result
 */
const withdrawFromLesson = async (lessonId, tuteeUserId) => {

    try {
        const lessonToWithdraw = await Lesson.findByPk(lessonId);

        if (!lessonToWithdraw) {
            throw new appError('Lesson not found', 404, 'NOT_FOUND', 'lesson-service:withdrawFromLesson');
        }
        if (lessonToWithdraw.status !== LESSON_STATUS.CREATED) {
            throw new appError('Lesson cannot be withdrawn in its current status: ${lessonToWithdraw.status}', 400, 'INVALID_STATUS', 'lesson-service:withdrawFromLesson');
        }
        if (lessonToWithdraw.appointedDateTime <= new Date()) {
            throw new appError('Cannot withdraw from a lesson whose appointed time has passed', 400, 'TIME_PASSED', 'lesson-service:withdrawFromLesson');
        }

        const lessonInTuteeLesson = await TuteeLesson.findOne({
            where: {
                lessonId: lessonId,
                tuteeUserId: tuteeUserId
            }
        });

        if (!lessonInTuteeLesson) {
            throw new appError('You are not enrolled in this lesson', 404, 'NOT_FOUND', 'lesson-service:withdrawFromLesson');
        }
        const result = await Lesson.withdrawFromLesson(lessonToWithdraw, lessonInTuteeLesson);

        return result;
    } catch (error) {
        if (error instanceof appError) {
            throw error;
        }
        throw new appError('Failed to withdraw tutee from lesson', 500, 'WITHDRAW_ERROR', 'lesson-service:withdrawFromLesson');
    }
};

/**
 * Add a review for a completed lesson
 * @param {number} lessonId - The ID of the lesson
 * @param {string} tuteeUserId - The ID of the tutee
 * @param {string} clarity - The clarity of the lesson
 * @param {string} understanding - The understanding of the lesson
 * @param {string} focus - The focus of the lesson
 * @param {string} helpful - The helpfulness of the lesson
 */
const addReview = async (lessonId, tuteeUserId, clarity, understanding, focus, helpful) => {
    try {
        const lesson = await Lesson.findByPk(lessonId);
        if (!lesson) {
            throw new appError('Lesson not found', 404, 'LESSON_NOT_FOUND', 'lesson-service:addReview');
        }

        if (lesson.status !== LESSON_STATUS.CREATED) {
            throw new appError(`Cannot review a lesson in its current status: ${lesson.status}`, 400, 'INVALID_LESSON_STATE', 'lesson-service:addReview');
        }

        // Fetch the tuteeLesson record
        const tuteeInLessonToReview = await TuteeLesson.findOne({
            where: {
                lessonId: lessonId,
                tuteeUserId: tuteeUserId
            }
        });

        if (!tuteeInLessonToReview) {
            throw new appError('You are not enrolled in this lesson', 403, 'NOT_ENROLLED', 'lesson-service:addReview');
        }

        // Check if review already exists in the TuteeLesson record
        if (tuteeInLessonToReview.clarity && tuteeInLessonToReview.understanding && tuteeInLessonToReview.focus && tuteeInLessonToReview.helpful) {
            throw new appError('Review already submitted for this lesson', 409, 'REVIEW_EXISTS', 'lesson-service:addReview');
        }

        // Update the record with the review ratings
        const reviewedLessonByTutee = await TuteeLesson.addReview(tuteeInLessonToReview, clarity, understanding, focus, helpful);
        // Update the lesson status to REVIEW_PENDING
        return { lesson, reviewedLessonByTutee };
    } catch (error) {
        if (error instanceof appError) {
            throw error;
        }
        throw new appError('Failed to add review', 500, 'ADD_REVIEW_ERROR', 'lesson-service:addReview');
    }
};

module.exports = {
    createLesson,
    cancelLesson,
    getLessonsOfTutor,
    enrollToLesson,
    withdrawFromLesson,
    getLessonsOfTutee,
    searchAvailableLessons,
    getAmountOfApprovedLessons,
    editLesson,
    uploadLessonReport,
    addReview
};