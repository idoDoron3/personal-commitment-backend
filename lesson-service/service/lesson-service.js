const { Lesson, Tutor } = require('../models');
const { AppError } = require('../utils/errors/appError');

/**
 * Create a new lesson
 * @param {Object} lessonData - The validated lesson data
 * @param {string} lessonData.subjectName - The subject of the lesson
 * @param {string} lessonData.level - The level of the lesson
 * @param {string} lessonData.userId - The user ID of the tutor
 * @param {string} lessonData.userFirstName - The first name of the user
 * @param {string} lessonData.userLastName - The last name of the user
 * @param {Date} lessonData.appointedDateTime - The date and time of the lesson
 * @param {string} [lessonData.locationOrLink] - Optional location or link for the lesson
 * @returns {Promise<Object>} The created lesson
 */
const createLesson = async (lessonData) => {
    try {
        const {
            subjectName,
            level,
            userId,
            userFirstName,
            userLastName,
            appointedDateTime,
            locationOrLink,
        } = lessonData;


        //! Debug date handling - delete after explaining the data handling
        // console.log('--------------------------------------------------------------------------------------------------------------------');
        // console.log('Current DateTime:', new Date().toString());
        // console.log('Original appointedDateTime:', appointedDateTime);
        // console.log('Date in ISO format:', appointedDateTime.toISOString());
        // console.log('Local date string:', appointedDateTime.toString());
        // console.log('--------------------------------------------------------------------------------------------------------------------');
        // Get or create tutor
        const tutor = await getOrCreateTutor(userId, userFirstName, userLastName);

        // Create the lesson
        const lesson = await Lesson.create({
            subjectName,
            level,
            tutorId: tutor.tutor_id,
            appointedDateTime: appointedDateTime,
            locationOrLink: locationOrLink || '',
        });

        return lesson;
    } catch (error) {
        console.error('Error: lesson-service: createLesson:', error);

        // If it's already a typed error, just rethrow it
        if (error.type) {
            throw error;
        }
        throw wrapError(error, 'CREATE_LESSON_ERROR', 'Failed to create lesson');
    }
};

/**
 * Cancel a lesson (tutor only)
 * @param {Object} validatedBody - The validated request body containing lessonId and tutorId
 * @returns {Promise<Object>} The canceled lesson
 */
const cancelLesson = async (validatedBody) => {
    try {
        const { lessonId, tutorId } = validatedBody;
        const lesson = await Lesson.findByPk(lessonId);
        if (!lesson) {
            throw new AppError('Lesson not found', 404, 'NOT_FOUND');
        }
        if (lesson.tutorId !== tutorId) {
            throw new AppError('Unauthorized: Only the assigned tutor can cancel the lesson', 403, 'UNAUTHORIZED');
        }
        if (lesson.status !== LESSON_STATUS.CREATED) {
            throw new AppError(`Lesson cannot be canceled in its current status: ${lesson.status}`, 400, 'INVALID_STATUS');
        }
        if (lesson.appointedDateTime <= new Date()) {
            throw new AppError('Cannot cancel a lessons whose appointed time has passed', 400, 'TIME_PASSED');
        }
        const result = await Lesson.cancelLesson(lessonId);
        return result;
    } catch (error) {
        console.error('Error in cancelLesson service:', error);
        if (error instanceof AppError) {
            throw error;
        }
        throw wrapError(error, 'CANCEL_LESSON_ERROR', 'Failed to cancel lesson');
    }
};

/**
 * Get all lessons by tutor
 * @param {Object} validatedBody - The validated request body containing tutorId and userId
 * @returns {Promise<Array>} Array of lessons
 */
const getLessonsByTutor = async (validatedBody) => {
    try {
        const { tutorId, userId } = validatedBody;

        // Check if tutor exists and matches the authenticated user
        const tutor = await Tutor.findByPk(tutorId);
        if (!tutor) {
            throw new AppError('Tutor not found', 404, 'TUTOR_NOT_FOUND');
        }

        if (tutor.userId !== userId) {
            throw new AppError('Unauthorized: You can only access your own lessons', 403, 'UNAUTHORIZED');
        }

        // Get all lessons for the tutor
        //! Amit: the function Lesson.getUpcomingLessonsByTutor(tutorId) is not yet implemented
        const lessons = await Lesson.getUpcomingLessonsByTutor(tutorId);
        return lessons;
    } catch (error) {
        console.error('Error in getLessonsByTutor service:', error);
        if (error instanceof AppError) {
            throw error;
        }
        throw new AppError('Failed to get lessons by tutor', 500, 'SERVICE_ERROR');
    }
};

/**
 * Enroll a tutee into a lesson
 * @param {number} lessonId - The ID of the lesson
 * @param {number} tuteeId - The ID of the tutee
 * @returns {Promise<Object>} The enrollment result
 */
const enrollToLesson = async (lessonId, tuteeId) => {
    try {
        // Validate inputs
        if (!lessonId || isNaN(Number(lessonId)) || !tuteeId || isNaN(Number(tuteeId))) {
            const error = new Error('Invalid lesson ID or tutee ID');
            error.type = 'INVALID_ID';
            throw error;
        }

        // Use the static method from the Lesson model
        const result = await Lesson.signUpTutee(Number(lessonId), Number(tuteeId));
        return result;
    } catch (error) {
        console.error('Error in enrollToLesson service:', error);

        if (error.type) {
            throw error;
        }

        const serviceError = new Error('Failed to enroll tutee to lesson');
        serviceError.type = 'SERVICE_ERROR';
        serviceError.originalError = error;
        throw serviceError;
    }
};

/**
 * Withdraw a tutee from a lesson
 * @param {number} lessonId - The ID of the lesson
 * @param {number} tuteeId - The ID of the tutee
 * @returns {Promise<Object>} The withdrawal result
 */
const withdrawFromLesson = async (lessonId, tuteeId) => {
    try {
        // Validate inputs
        if (!lessonId || isNaN(Number(lessonId)) || !tuteeId || isNaN(Number(tuteeId))) {
            const error = new Error('Invalid lesson ID or tutee ID');
            error.type = 'INVALID_ID';
            throw error;
        }

        // Use the static method from the Lesson model
        const result = await Lesson.handleTuteeCancellation(Number(lessonId), Number(tuteeId));
        return result;
    } catch (error) {
        console.error('Error in withdrawFromLesson service:', error);

        if (error.type) {
            throw error;
        }

        const serviceError = new Error('Failed to withdraw tutee from lesson');
        serviceError.type = 'SERVICE_ERROR';
        serviceError.originalError = error;
        throw serviceError;
    }
};

/**
 * Get all lessons a tutee is enrolled in
 * @param {number} tuteeId - The ID of the tutee
 * @returns {Promise<Array>} Array of lessons
 */
const getLessonsByTutee = async (tuteeId) => {
    try {
        // Validate tuteeId
        if (!tuteeId || isNaN(Number(tuteeId))) {
            const error = new Error('Invalid tutee ID');
            error.type = 'INVALID_ID';
            throw error;
        }

        // Get all lessons for the tutee
        const lessons = await Lesson.getUpcomingLessonsByTutee(Number(tuteeId));
        return lessons;
    } catch (error) {
        console.error('Error in getLessonsByTutee service:', error);

        if (error.type) {
            throw error;
        }

    }
};

/**
 * Get all available lessons (with optional filters) for tutee
 * @param {Array<string>} subjects - Optional array of subjects to filter by
 * @returns {Promise<Array>} Array of available lessons
 */
const getAvailableLessons = async (subjects) => {
    return await Lesson.getAvailableLessonsBySubject(subjects);
  };

//* helper functions

/**
 * Creates a new tutor or returns an existing one
 */
const getOrCreateTutor = async (userId, firstName, lastName) => {
    let tutor = await Tutor.findByUserId(userId);
    if (!tutor) {
        tutor = await Tutor.addTutor({
            userId,
            firstName,
            lastName
        });
    }
    return tutor;
};
function wrapError(error, type = 'GENERIC_SERVICE_ERROR', defaultMessage = 'An unexpected error occurred') {
    const wrapped = new Error(error.message || defaultMessage);
    wrapped.type = type;
    wrapped.originalError = error;
    wrapped.statusCode = error.statusCode || 500;
    return wrapped;
}

module.exports = {
    createLesson,
    cancelLesson,
    getLessonsByTutor,
    enrollToLesson,
    withdrawFromLesson,
    getLessonsByTutee,
    getAvailableLessons
};

