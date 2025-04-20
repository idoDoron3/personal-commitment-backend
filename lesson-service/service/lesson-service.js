const { Lesson, TuteeLesson } = require('../models');
const appError = require('../utils/errors/appError');
const { LESSON_STATUS } = require('../models/lesson');
const { Op } = require('sequelize');

/**
 * Create a new lesson
 * @param {Object} lessonData - The validated lesson data
 * @param {string} lessonData.subjectName - The subject of the lesson
 * @param {string} lessonData.grade - The grade level
 * @param {string} lessonData.level - The level of the lesson
 * @param {string} lessonData.description - The lesson description
 * @param {string} lessonData.tutorUserId - The user ID of the tutor
 * @param {string} lessonData.tutorFullName - The full name of the tutor
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
 * 
 * Cancel a lesson (tutor only)
 * @param {Object} validatedBody - The validated request body containing lessonId and tutorId
 * @returns {Promise<Object>} The canceled lesson
 */
const cancelLesson = async (lessonId, tutorUserId) => {
    try {
        const lessonToCancel = await Lesson.findByPk(lessonId, {
            include: [{
                model: sequelize.models.TuteeLesson,
                as: 'enrolledTutees',
                attributes: ['tutee_user_id']
            }]
        });

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

        const result = await Lesson.cancelLesson(lessonToCancel, lessonToCancel.enrolledTutees);
        return result;
    } catch (error) {
        if (error instanceof appError) {
            throw error;
        }
        throw new appError('Failed to cancel lesson', 500, 'CANCEL_LESSON_ERROR', 'lesson-service:cancelLesson');
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
 * Edit a lesson
 * @param {Object} lessonData - The validated lesson data
 * @param {number} lessonData.lessonId - The ID of the lesson to edit
 * @param {string} lessonData.tutorUserId - The user ID of the tutor
 * @param {string} lessonData.description - The lesson description
 * @param {string} lessonData.format - The format of the lesson (online/offline)
 * @param {string} [lessonData.locationOrLink] - Optional location or link for the lesson
 * @returns {Promise<Object>} The updated lesson
 * */
const editLesson = async ({ lessonId, tutorUserId, description, format, locationOrLink }) => {
    try {
        const updatedLesson = await Lesson.editLessonByTutor(
            lessonId,
            tutorUserId,
            { description, format, locationOrLink }
        );
        return updatedLesson;
    } catch (error) {
        // console.error("Error editing lesson:", error);
        if (error instanceof appError) {
            throw error;
        }
        throw new appError("Failed to edit lesson", 500, "EDIT_LESSON_ERROR", "lesson-service:editLesson");
    }
};

/**
 * Get all lessons by tutor
 * @param {Object} tutorData - The tutor data
 * @param {string} tutorData.tutorUserId - The ID of the tutor
 * @param {string} tutorData.lessonCategory - The type of lessons to retrieve ('upcoming' or 'summaryPending')
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
 * Get all lessons by tutee
 * @param {Object} tuteeData - The tutee data
 * @param {string} tuteeData.tuteeUserId - The ID of the tutee
 * @param {string} tuteeData.lessonCategory - The type of lessons to retrieve ('upcoming' or 'reviewPending')
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
 * @param {Object} input
 * @param {number} input.lessonId - The ID of the lesson
 * @param {string} input.tuteeUserId - The ID of the tutee (from token)
 * @returns {Promise<Object>} The updated lesson
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
                lesson_id: lessonId,
                tutee_user_id: tuteeUserId
            }
        });

        if (!lessonInTuteeLesson) {
            throw new appError('Unauthorized: Only the assigned tutee can withdraw from the lesson', 404, 'NOT_FOUND', 'lesson-service:withdrawFromLesson');
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
 * Get all available lessons, optionally filtered by subject(s)
 * @param {Array<string>} [subjects] - Optional array of subject names to filter
 * @returns {Promise<Array>} Array of available lessons
 */
const getAvailableLessons = async (subjects) => {
    try {
        // ✅ Validate subjects
        if (subjects && (!Array.isArray(subjects) || !subjects.every(sub => typeof sub === 'string'))) {
            throw new appError(
                'Invalid subjects: must be an array of strings',
                400,
                'INVALID_SUBJECTS',
                'lesson-service:getAvailableLessons'
            );
        }

        // ✅ Call model-level method
        return await Lesson.getAvailableLessons(subjects);
    } catch (error) {
        // console.error('Error in getAvailableLessons service:', error);

        if (error.type) {
            throw error;
        }

        const serviceError = new Error('Failed to get available lessons');
        serviceError.type = 'SERVICE_ERROR';
        serviceError.originalError = error;
        throw serviceError;
    }
};


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






module.exports = {
    createLesson,
    cancelLesson,
    getLessonsOfTutor,
    enrollToLesson,
    withdrawFromLesson,
    getLessonsOfTutee,
    getAvailableLessons,
    getAmountOfApprovedLessons,
    editLesson,
    uploadLessonReport
};

