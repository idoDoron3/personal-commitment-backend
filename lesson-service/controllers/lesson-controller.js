// lesson-service/controllers/lesson-controller.js
// ? TODO: check if the use of the GET request is correct when using the body to send data instead of the URL

const lessonService = require("../service/lesson-service");
const { Lesson, TuteeLesson } = require("../models");

//
// TUTOR
//

/**
 * @desc    Create a new lesson (Tutor only)
 * @route   POST /lessons/create
 * @access  Private (Tutor only)
 */
// ? amit: can location or linke be null and edited later ? for now yea
// ? amit: do we need to ask for the user email also for notification purposes ?
exports.createLesson = async (req, res, next) => {
  try {
    const tutorUserId = req.userId; // Now available from middleware
    const tutorFullName = req.userFullName; // Now available from middleware
    const tutorEmail = req.userEmail; // Now available from middleware
    const lesson = await lessonService.createLesson({
      ...req.validatedBody,
      tutorUserId,
      tutorFullName,
      tutorEmail,
    });

    res.status(201).json({
      success: true,
      message: 'Lesson created successfully',
      data: { lesson }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc   Cancel a lesson (tutor only)
 * @route  PATCH /lessons/cancel
 * @access Private (Tutor only)
 */
exports.cancelLesson = async (req, res, next) => {
  try {
    const tutorUserId = req.userId;
    const lessonId = req.validatedBody.lessonId;
    const canceledLesson = await lessonService.cancelLesson(lessonId, tutorUserId);

    res.status(200).json({
      success: true,
      message: 'Lesson canceled successfully',
      data: {
        lesson: canceledLesson.lesson,
        // affectedTutees: canceledLesson.affectedTutees //!Amit: need to notify the affected tutees
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Edit a lesson (tutor only)
 * @route   PATCH /lessons/edit
 * @access  Private (Tutor only)
 */

exports.editLesson = async (req, res, next) => {
  try {
    const tutorUserId = req.userId;
    const lesson = await lessonService.editLesson({
      ...req.validatedBody,
      tutorUserId
    });

    res.status(200).json({
      success: true,
      message: 'Lesson updated successfully',
      data: { lesson }
    });
  } catch (err) {
    next(err);
  }
};


/**
 * @desc    Get the amount of approved lessons (tutor only)
 * @route   GET /lessons/amount-of-approved-lessons
 * @access  Private (Tutor only)
 */
exports.getAmountOfApprovedLessons = async (req, res, next) => {
  try {
    const tutorUserId = req.userId;
    const amountOfApprovedLessons = await lessonService.getAmountOfApprovedLessons(tutorUserId);

    res.status(200).json({
      success: true,
      message: 'Amount of approved lessons retrieved successfully',
      data: { amountOfApprovedLessons }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * @desc    Get all lessons by tutor (upcoming or summary pending)
 * @route   GET /lessons/tutor-upcoming-lessons or /lessons/tutor-summary-pending-lessons
 * @access  Private (Tutor only)
 */
exports.getLessonsOfTutor = async (req, res, next) => {
  try {
    const tutorUserId = req.userId;
    const lessonCategory = req.path.includes('summary-pending') ? 'summaryPending' : 'upcoming';

    const lessonsWithEnrolledTutees = await lessonService.getLessonsOfTutor(tutorUserId, lessonCategory);

    res.status(200).json({
      success: true,
      message: `Tutor ${lessonCategory} lessons retrieved successfully`,
      data: { lessonsWithEnrolledTutees }
    });
  } catch (err) {
    next(err);
  }
};


//
// *Tutee
//
/**
 * @desc    Get available lessons filtered by subject(s)
 * @route   POST /lessons/available
 * @access  Public
 */
exports.getAvailableLessonsBySubject = async (req, res, next) => {
  try {
    const { subjects } = req.validatedBody;
    const lessons = await lessonService.getAvailableLessons(subjects);
    console.log("Received subjects:", subjects);

    res.status(200).json({
      success: true,
      message: 'Available lessons retrieved successfully',
      data: { lessons }
    });
  } catch (err) {
    next(err);
  }
};


// TODO: amit: I didnt check yet this fucntion throw the layers because enrollToLesson is not implemented yet
/**
 * @desc    Get all lessons by tutee (upcoming or review pending)
 * @route   GET /lessons/tutee-upcoming-lessons or /lessons/tutee-review-pending-lessons
 * @access  Private (Tutee only)
 */
exports.getLessonsOfTutee = async (req, res, next) => {
  try {
    const tuteeUserId = req.userId;
    const lessonCategory = req.path.includes('review-pending') ? 'reviewPending' : 'upcoming';

    const lessonsWithEnrolledTutees = await lessonService.getLessonsOfTutee(tuteeUserId, lessonCategory);

    res.status(200).json({
      success: true,
      message: `Tutee ${lessonCategory} lessons retrieved successfully`,
      data: { lessonsWithEnrolledTutees }
    });
  } catch (err) {
    next(err);
  }
};


/**
 * @desc    Upload a lesson report (tutor only)
 * @route   PATCH /lessons/upload-lesson-report
 * @access  Private (Tutor only)
 */
exports.uploadLessonReport = async (req, res, next) => {
  try {
    const { lessonId, lessonSummary, tuteesPresence } = req.validatedBody;
    const tutorUserId = req.userId;

    const updatedLesson = await lessonService.uploadLessonReport(lessonId, lessonSummary, tuteesPresence, tutorUserId);

    res.status(200).json({
      success: true,
      message: 'Lesson report uploaded successfully',
      data: { updatedLesson }
    });

  } catch (err) {
    next(err);
  }
}

// ! Admin: ------------------------------------------------------------- X
// ! getLessonsByStatus
// ! approveLesson (think of bettter name)
// ! getTotalCompletedLessons (returns int) ??


// ! Periodical functions:
// ! changeStatusFromCreatedToCanceledByDate
// ! Notifictations


//
// TUTEE
//

/**
 * @desc    Enroll a tutee in a lesson
 * @route   POST /lessons/enroll
 * @access  Private (Tutee only)
 */
exports.enrollToLesson = async (req, res, next) => {
  try {
    const { lessonId } = req.validatedBody;
    const tuteeUserId = req.userId;
    const tuteeFullName = req.userFullName;
    const tuteeEmail = req.userEmail;

    const enrollment = await lessonService.enrollToLesson(lessonId, tuteeUserId, tuteeFullName, tuteeEmail);

    res.status(200).json({
      success: true,
      message: 'Enrolled in lesson successfully',
      data: { enrollment }
    });
  } catch (err) {
    next(err);
  }
};


/**
 * @desc    Withdraw a tutee from a lesson
 * @route   DELETE /lessons/withdraw
 * @access  Private (Tutee only)
 */
exports.withdrawFromLesson = async (req, res, next) => {
  try {
    const tuteeUserId = req.userId;
    const { lessonId } = req.validatedBody;

    const updatedLesson = await lessonService.withdrawFromLesson(lessonId, tuteeUserId);

    res.status(200).json({
      success: true,
      message: 'Withdrawn from lesson successfully',
      data: { lesson: updatedLesson }
    });
  } catch (err) {
    next(err);
  }
};


/**
 * @desc    Get all available lessons
 * @route   GET /lessons/available
 * @access  Public
 */
exports.getAvailableLessons = async (req, res, next) => {
  try {
    const lessons = await lessonService.getAvailableLessons();

    res.status(200).json({
      success: true,
      message: 'Available lessons retrieved successfully',
      data: { lessons }
    });
  } catch (err) {
    next(err);
  }
};
