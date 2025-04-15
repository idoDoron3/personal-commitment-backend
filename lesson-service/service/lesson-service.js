const { Lesson, Tutor } = require('../models');
const appError = require('../utils/errors/appError');
const { LESSON_STATUS } = require('../models/lesson');

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
const createLesson = async (lessonData) => {
    try {
        const {
            subjectName,
            grade,
            level,
            description,
            tutorUserId,
            tutorFullName,
            appointedDateTime,
            format,
            locationOrLink,
        } = lessonData;

        // Create the lesson
        const lesson = await Lesson.create({
            subjectName,
            grade,
            level,
            description,
            tutorUserId,
            tutorFullName,
            appointedDateTime,
            format,
            locationOrLink,
        });

        return lesson;
    } catch (error) {
        if (error.type) { throw error; }
        throw new appError('Failed to create lesson', 500, 'CREATE_LESSON_ERROR', 'lesson-service:createLesson');
    }
};

/**
 * 
 * Cancel a lesson (tutor only)
 * @param {Object} validatedBody - The validated request body containing lessonId and tutorId
 * @returns {Promise<Object>} The canceled lesson
 */
const cancelLesson = async (validatedBody) => {
    try {
        const { lessonId, tutorUserId } = validatedBody;
        const lesson = await Lesson.findByPk(lessonId);
        if (!lesson) {
            throw new AppError('Lesson not found', 404, 'NOT_FOUND', 'lesson-service:cancelLesson');
        }
        if (lesson.tutorUserId !== tutorUserId) {
            throw new AppError('Unauthorized: Only the assigned tutor can cancel the lesson', 403, 'UNAUTHORIZED', 'lesson-service:cancelLesson');
        }
        if (lesson.status !== LESSON_STATUS.CREATED) {
            throw new AppError(`Lesson cannot be canceled in its current status: ${lesson.status}`, 400, 'INVALID_STATUS', 'lesson-service:cancelLesson');
        }
        if (lesson.appointedDateTime <= new Date()) {
            throw new AppError('Cannot cancel a lessons whose appointed time has passed', 400, 'TIME_PASSED', 'lesson-service:cancelLesson');
        }
        const result = await Lesson.cancelLesson(lessonId);
        return result;
    } catch (error) {
        if (error instanceof AppError) { throw error; }
        throw new AppError('Failed to cancel lesson', 500, 'CANCEL_LESSON_ERROR', 'lesson-service:cancelLesson');
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
 * * @returns {Promise<Object>} The updated lesson
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
      console.error("Error editing lesson:", error);
      throw new appError("Failed to edit lesson", 500, "EDIT_LESSON_ERROR", "lesson-service:editLesson");
    }
  };
  
/**
 * Get all lessons by tutor
 * @param {Object} validatedBody - The validated request body containing tutorId and userId
 * @returns {Promise<Array>} Array of lessons
 */
const getLessonsByTutor = async (validatedBody) => {
    try {
        const { tutorUserId } = validatedBody;

        // Check if tutor exists and matches the authenticated user
        const tutor = await Tutor.findByUserId(tutorUserId);
        if (!tutor) {
            throw new AppError('Tutor not found', 404, 'TUTOR_NOT_FOUND');
        }

        if (tutor.tutorUserId !== tutorUserId) {
            throw new AppError('Unauthorized: You can only access your own lessons', 403, 'UNAUTHORIZED');
        }

        // Get all lessons for the tutor
        //! Amit: the function Lesson.getUpcomingLessonsByTutor(tutorId) is not yet implemented
        const lessons = await Lesson.getUpcomingLessonsByTutor(tutorUserId);
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
 * @param {Object} input
 * @param {number} input.lessonId - The ID of the lesson
 * @param {string} input.tuteeId - The ID of the tutee (from token)
 * @returns {Promise<Object>} The updated lesson
 */
const enrollToLesson = async ({ lessonId, tuteeId,tuteeFullName }) => {
    try {
      if (!lessonId || isNaN(Number(lessonId)) || !tuteeId || typeof tuteeId !== 'string') {
        throw new appError('Invalid lesson or tutee ID', 400, 'INVALID_ID', 'lesson-service:enrollToLesson');
      }
  
      const lesson = await Lesson.signUpTutee(Number(lessonId), tuteeId, tuteeFullName);
      return lesson;
    } catch (error) {
      console.error('Error in enrollToLesson service:', error);
  
      if (error instanceof appError || error.type === 'INVALID_ID') {
        throw error;
      }
  
      throw new appError('Failed to enroll tutee to lesson', 500, 'ENROLL_ERROR', 'lesson-service:enrollToLesson');
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
        if (!lessonId || isNaN(Number(lessonId)) || !tuteeId || typeof tuteeId !== 'string') {
            throw new appError('Invalid lesson ID or tutee ID', 400, 'INVALID_ID');
        }

        const updatedLesson = await Lesson.handleTuteeCancellation(Number(lessonId), tuteeId);
        return updatedLesson;
    } catch (error) {
        console.error('Error in withdrawFromLesson service:', error);

        if (error instanceof appError) {
            throw error;
        }

        throw new appError('Failed to withdraw tutee from lesson', 500, 'WITHDRAW_ERROR');
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
      console.error('Error in getAvailableLessons service:', error);
  
      if (error instanceof appError) throw error;
  
      throw new appError(
        'Failed to get available lessons',
        500,
        'GET_AVAILABLE_LESSONS_ERROR',
        'lesson-service:getAvailableLessons'
      );
    }
  };
  
  



//* helper functions


module.exports = {
    createLesson,
    cancelLesson,
    getLessonsByTutor,
    enrollToLesson,
    withdrawFromLesson,
    getLessonsByTutee,
    getAvailableLessons,
    editLesson,
};

