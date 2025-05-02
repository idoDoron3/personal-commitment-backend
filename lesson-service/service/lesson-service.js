const { Lesson, TuteeLesson } = require('../models');
const appError = require('../utils/errors/appError');
const { LESSON_STATUS } = require('../models/lesson');
const { publishEvent } = require('../messaging/producer');

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
        console.log("======publush create lesson=========");
        try {
            await publishEvent('lesson.created', {
                eventType: 'lesson.created',
                occurredAt: new Date(),
                data: lessonToCreate.toJSON()
            });
            console.log("✅ Event published successfully [lesson.created]");
        } catch (publishError) {
            console.error("❌ Failed to publish event [lesson.created]:", publishError.message);
            console.error("Continuing without blocking the main flow...");
        }

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
            throw new appError('Lesson cannot be canceled in this stage', 400, 'INVALID_STATUS', 'lesson-service:cancelLesson');
        }

        const THREE_HOURS_BEFORE_APPOINTMENT = new Date(lessonToCancel.appointedDateTime - (3 * 60 * 60 * 1000));
        const cancellationWindow = '3 hours';
        const NOW = new Date();
        if (NOW > THREE_HOURS_BEFORE_APPOINTMENT) {
            throw new appError(`Cancellation not allowed within ${cancellationWindow} of the lesson`, 400, 'TIME_PASSED', 'lesson-service:cancelLesson');
        }

        const result = await Lesson.cancelLesson(lessonToCancel);
        try {
            console.log(`[cancelLesson] ======Attempting to publish cancellation event=====`);
            const eventData = {
                eventType: 'lesson.canceled',
                occurredAt: new Date(),
                data: result.lesson 
            };            
            await publishEvent('lesson.canceled', eventData);
            console.log(`[cancelLesson] Event published successfully`);
        } catch (publishError) {
            console.error(`[cancelLesson] Failed to publish event:`, publishError);
            console.error(`[cancelLesson] Error details:`, {
                name: publishError.name,
                message: publishError.message,
                stack: publishError.stack
            });
            console.log(`[cancelLesson] Continuing despite event publishing failure - lesson was successfully canceled`);
        }
        return result;
    } catch (error) {
        console.error(`[cancelLesson] Error in cancelLesson:`, error);
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
            throw new appError('Unauthorized: Only assigned tutor can edit lesson', 403, 'UNAUTHORIZED', 'lesson-service:editLesson');
        }
        if (lessonToEdit.status !== LESSON_STATUS.CREATED) {
            throw new appError('Lesson cannot be edited in this stage', 400, 'INVALID_STATUS', 'lesson-service:editLesson');
        }
        const updatedLesson = await Lesson.editLesson(lessonToEdit, description, format, locationOrLink);
        
        try {
            console.log("====== Publishing lesson edited ======");
            await publishEvent('lesson.edited', {
              eventType: 'lesson.edited',
              occurredAt: new Date(),
              data: updatedLesson.toJSON()
            });
            console.log("[lesson.edited] Event published successfully");
          } catch (publishError) {
            console.error("[lesson.edited] Failed to publish event:", publishError.message);
            console.error("[lesson.edited] Continuing - edit was successful, event not sent");
          }

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
        throw new appError('Fetching approved lessons amount failed', 500, 'GET_AMOUNT_OF_APPROVED_LESSONS_ERROR', 'lesson-service:getAmountOfApprovedLessons');
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
        throw new appError('Fetching lessons failed', 500, 'SERVICE_ERROR', 'lesson-service:getLessonsOfTutor');
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
        // Authorization check
        if (lessonToUploadReport.tutorUserId !== tutorUserId) {
            throw new appError('Unauthorized: Only assigned user can upload report', 403, 'UNAUTHORIZED', 'lesson-service:uploadLessonReport');
        }
        // Status check
        if (lessonToUploadReport.status !== LESSON_STATUS.CREATED) {
            throw new appError('Cannot upload lesson report in this stage', 400, 'INVALID_STATUS', 'lesson-service:uploadLessonReport');
        }
        // Time check
        const LESSON_END_TIME = new Date(lessonToUploadReport.appointedDateTime + (1 * 60 * 60 * 1000)); // apoointed time + 1 hour
        const NOW = new Date();
        if (LESSON_END_TIME > NOW) {
            throw new appError('Cannot upload lesson report before lesson has ended', 400, 'LESSON_NOT_ENDED', 'lesson-service:uploadLessonReport');
        }
        // Add enrolled tutees check
        const hasTutees = await TuteeLesson.hasEnrolledTutees(lessonId);
        if (!hasTutees) {
            throw new appError(
                'Report upload failed: lesson has no participants.',
                400,
                'NO_ENROLLED_TUTEES',
                'lesson-service:uploadLessonReport'
            );
        }
        const updatedLesson = await Lesson.uploadLessonReport(lessonToUploadReport, lessonSummary, tuteesPresence);

        const studentsPresence = updatedLesson.enrolledTutees.map(t => ({
            studentId: t.tuteeUserId,
            studentFullName: t.tuteeFullName,
            attendanceStatus: t.presence ? 'present' : 'absent'
          }));

        console.log("======publush mentor review=========");
        try {
            await publishEvent('mentor.review.published', {
                eventType: 'mentor.review.published',
                occurredAt: new Date(),
                data: {
                    lessonId: lessonId,
                    mentorId: tutorUserId,
                    report: {
                        summary: lessonSummary,
                        studentsPresence: studentsPresence
                    }
                }
            });
            console.log("✅ Event published successfully [mentor.review.published]");
        } catch (publishError) {
            console.error("❌ Failed to publish event [mentor.review.published]:", publishError.message);
            console.error("Continuing without blocking the main flow...");
        }
        return updatedLesson;
        
    } catch (error) {
        if (error instanceof appError) {
            throw error;
        }
        throw new appError('Uploading report failed', 500, 'UPLOAD_REPORT_ERROR', 'lesson-service:uploadLessonReport');
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
            'Lesson search failed',
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
        throw new appError('Fetching lessons failed', 500, 'SERVICE_ERROR', 'lesson-service:getLessonsOfTutee');
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
            throw new appError('Cannot enroll to this lesson in this stage', 400, 'INVALID_STATUS', 'lesson-service:enrollToLesson');
        }
        if (lessonToEnroll.appointedDateTime <= new Date()) {
            throw new appError('Cannot enroll for past lesson', 400, 'TIME_PASSED', 'lesson-service:enrollToLesson');
        }
        // Delegate to model layer for data operations and synchronization
        const result = await Lesson.enrollToLesson(lessonToEnroll, tuteeUserId, tuteeFullName, tuteeEmail);
        return result;
    } catch (error) {
        if (error instanceof appError) {
            throw error;
        }
        throw new appError('Enrollment failed', 500, 'ENROLL_ERROR', 'lesson-service:enrollToLesson');
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
            throw new appError('Lesson cannot be withdrawn in this stage', 400, 'INVALID_STATUS', 'lesson-service:withdrawFromLesson');
        }
        const THREE_HOURS_BEFORE_APPOINTMENT = new Date(lessonToWithdraw.appointedDateTime - (3 * 60 * 60 * 1000));
        const NOW = new Date();
        const withdrawalWindow = '3 hours';
        if (NOW > THREE_HOURS_BEFORE_APPOINTMENT) {
            throw new appError(`Withdrawal not allowed within ${withdrawalWindow} of the lesson`, 400, 'TIME_PASSED', 'lesson-service:withdrawFromLesson');
        }

        const lessonInTuteeLesson = await TuteeLesson.findOne({
            where: {
                lessonId: lessonId,
                tuteeUserId: tuteeUserId
            }
        });

        if (!lessonInTuteeLesson) {
            throw new appError('Enrollment not found', 404, 'NOT_FOUND', 'lesson-service:withdrawFromLesson');
        }
        const result = await Lesson.withdrawFromLesson(lessonToWithdraw, lessonInTuteeLesson);

        return result;
    } catch (error) {
        if (error instanceof appError) {
            throw error;
        }
        throw new appError('Withdrawal failed', 500, 'WITHDRAW_ERROR', 'lesson-service:withdrawFromLesson');
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

        if (lesson.status !== LESSON_STATUS.CREATED) { //TODO - check with amit and itay whystatis after mentor review unattended
            throw new appError('Cannot review lesson in this stage', 400, 'INVALID_LESSON_STATE', 'lesson-service:addReview');
        }

        // Fetch the tuteeLesson record
        const tuteeInLessonToReview = await TuteeLesson.findOne({
            where: {
                lessonId: lessonId,
                tuteeUserId: tuteeUserId
            }
        });

        if (!tuteeInLessonToReview) {
            throw new appError('Enrollment in this lesson not found', 403, 'NOT_ENROLLED', 'lesson-service:addReview');
        }

        const ONE_HOUR_AFTER_APPOINTMENT = new Date(lesson.appointedDateTime.getTime() + 1 * 60 * 60 * 1000);
        const SEVEN_DAYS_AFTER_APPOINTMENT = new Date(lesson.appointedDateTime.getTime() + 7 * 24 * 60 * 60 * 1000);
        const NOW = new Date();

        if (NOW < ONE_HOUR_AFTER_APPOINTMENT) {
            throw new appError(
                'Review window not yet open.',
                400,
                'TOO_EARLY_TO_REVIEW',
                'lesson-service:addReview'
            );
        }

        if (NOW > SEVEN_DAYS_AFTER_APPOINTMENT) {
            throw new appError(
                'Review period expired',
                403,
                'REVIEW_PERIOD_EXPIRED',
                'lesson-service:addReview'
            );
        }

        // Check if review already exists in the TuteeLesson record
        if (tuteeInLessonToReview.clarity && tuteeInLessonToReview.understanding && tuteeInLessonToReview.focus && tuteeInLessonToReview.helpful) {
            throw new appError('Review submission rejected: already recorded', 409, 'REVIEW_EXISTS', 'lesson-service:addReview');
        }

        // Update the record with the review ratings
        const reviewedLessonByTutee = await TuteeLesson.addReview(tuteeInLessonToReview, clarity, understanding, focus, helpful);
        
        
        console.log("======publish student review=========");
        
        try {
            await publishEvent('student.review.submitted', {
                eventType: 'student.review.submitted',
                occurredAt: new Date(),
                data: {
                    lessonId: lessonId,
                    mentorId: lesson.tutorUserId,
                    studentId: tuteeUserId,
                    clarity,
                    understanding,
                    focus,
                    helpful
                }
            });
            console.log("✅ Event published successfully [student.review.submitted]");
        } catch (publishError) {
            console.error("❌ Failed to publish event [student.review.submitted]:", publishError.message);
            console.error("Continuing without blocking the main flow...");
        }

        // Update the lesson status to REVIEW_PENDING
        return { lesson, reviewedLessonByTutee };
    } catch (error) {
        if (error instanceof appError) {
            throw error;
        }
        throw new appError('Review submission failed', 500, 'ADD_REVIEW_ERROR', 'lesson-service:addReview');
    }
};

//* Admin

/**
 * Get all verdict pending lessons
 * @returns {Promise<Array>} Array of verdict pending lessons
 */
const getVerdictPendingLessons = async () => {
    try {
        const verdictPendingLessons = await Lesson.getVerdictPendingLessons();
        return verdictPendingLessons;
    } catch (error) {
        if (error instanceof appError) {
            throw error;
        }
        throw new appError('Fetching verdict pending lessons failed', 500, 'GET_VERDICT_PENDING_LESSONS_ERROR', 'lesson-service:getVerdictPendingLessons');
    }
}

/**
 * Update the verdict of a lesson
 * @param {number} lessonId - The ID of the lesson
 * @param {boolean} isApproved - The verdict of the lesson
 * @returns {Promise<Object>} The updated lesson
 */
const updateLessonVerdict = async (lessonId, isApproved) => {
    try {
        const updatedLesson = await Lesson.updateLessonVerdict(lessonId, isApproved);

        console.log("======publish lesson verdict updated=========");
        try {
            await publishEvent('lesson.verdict.updated', {
                eventType: 'lesson.verdict.updated',
                occurredAt: new Date(),
                data: {
                    lessonId,
                    isApproved
                }
            });
            console.log("✅ Event published successfully [lesson.verdict.updated]");
        } catch (publishError) {
            console.error("❌ Failed to publish event [lesson.verdict.updated]:", publishError.message);
            console.error("Continuing without blocking the main flow...");
        }

        return updatedLesson;
    } catch (error) {
        if (error instanceof appError) {
            throw error;
        }
        throw new appError('Updating verdict failed', 500, 'UPDATE_VERDICT_ERROR', 'lesson-service:updateLessonVerdict');
    }
}




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
    addReview,
    getVerdictPendingLessons,
    updateLessonVerdict
};