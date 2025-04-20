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
    const lesson = await lessonService.createLesson({
      ...req.validatedBody,
      tutorUserId,
      tutorFullName
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
    const tutorFullName = req.userFullName;
    const canceledLesson = await lessonService.cancelLesson({ ...req.validatedBody, tutorUserId });

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

    const lessonsWithEnrolledTutees = await lessonService.getLessonsOfTutor({
      tutorUserId,
      lessonCategory
    });

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
    const { subjectName, grade, level } = req.validatedBody;
    const tuteeId = req.userId;

    const lessons = await lessonService.getAvailableLessons({
      subject: subjectName,
      grade,
      level,
      tuteeId,
    });

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

    const lessonsWithEnrolledTutees = await lessonService.getLessonsOfTutee({
      tuteeUserId,
      lessonCategory
    });

    res.status(200).json({
      success: true,
      message: `Tutee ${lessonCategory} lessons retrieved successfully`,
      data: { lessonsWithEnrolledTutees }
    });
  } catch (err) {
    next(err);
  }
};

// ! get My next Lessons tutoee
// ! get My next Lessons tutor
// ! get approved lessons tutor
// ! get awaiting approval lessons tutor
// ! get not approved lessons tutor - means the admin review the lesson and decided to not approve it




// ! Tutor:
// ! 2 getLessonsOfTutor -----------------------------------------------------------------------------(Created/OccuredButNotCompleted): Hard
// ! 3 getAmountOfApprovedLessons (returns int): Medium
//  4 getAmountOfNotApprovedLessons (returns int) ------------------------------------------X
//  5 getPendingLessons - completed/unattended
// ! 6 createSummary -----------------------------------------------------------------------------,TutteesAtendncy, summary,: Hard
// ! 7 addLinkOrLocationToLesson  : Easy (format, link\location) (onlinVSin-person)


// ! Tutee:
// ! 9 getLessonsOfTutee ----------------------------------------------------------------------------(upcoming/ ???): Hard
// ! 10 getAvailableLessonsBySubject: Hard
// ! 11 enrollToLesson: Medium
// ! 12 withdrawFromLesson: Medium

// 7, 10 ,11 ,12 Itay
// 6  Amit 3 2 9




// ! Admin: ------------------------------------------------------------- X
// ! getLessonsByStatus
// ! approveLesson (think of bettter name)
// ! getTotalCompletedLessons (returns int) ??



// ! Periodical functions:
// ! changeStatusFromCreatedToCanceledByDate
// ! Notifictations




// TODO:
//? 1. by removing the tutors_table, ther are no option to keep tutor's score (if we dcide to implement it)
//? 2. think about modfiying tutees table to have full_name instead of first_name and last_name
//? 2.2 think about removing tutees table and use only tuteeLessons table with tuteeFullName column 

//
// TUTEE
//

/**
 * @desc    Enroll a tutee in a lesson
 * @param   {lessonId} - The lessonId
 * @route   POST /lessons/enroll
 * @access  Private (Tutee only)
 */
exports.enrollToLesson = async (req, res, next) => {
  try {
    const userId = req.userId;
    const tuteeFullName = req.userFullName;

    const enrollment = await lessonService.enrollToLesson({
      ...req.validatedBody,
      tuteeId: userId,
      tuteeFullName: tuteeFullName
    });

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
 * @param   {lessonId} - The lessonId
 * @route   DELETE /lessons/withdraw
 * @access  Private (Tutee only)
 */
exports.withdrawFromLesson = async (req, res, next) => {
  try {
    const tuteeId = req.userId;
    const { lessonId } = req.validatedBody;

    const updatedLesson = await lessonService.withdrawFromLesson(lessonId, tuteeId);

    res.status(200).json({
      success: true,
      message: 'Withdrawn from lesson successfully',
      data: { lesson: updatedLesson }
    });
  } catch (err) {
    next(err);
  }
};

exports.addReview = async (req, res, next) => {
  try {
    const tuteeId = req.userId; // From JWT via middleware
    const reviewData = {
      ...req.validatedBody,
      tuteeUserId: tuteeId
    };

    const result = await lessonService.addReview(reviewData);

    res.status(201).json({
      success: true,
      message: 'Review added successfully',
      data: { review: result }
    });
  } catch (err) {
    next(err);
  }
};
