const lessonService = require("../service/lesson-service");


// *TUTOR

/**
 * @desc    Create a new lesson (Tutor only)
 * @route   POST /lessons/create
 * @access  Private (Tutor only)
 */
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
    const { lessonId, description, format, locationOrLink } = req.validatedBody;
    const lesson = await lessonService.editLesson(lessonId, tutorUserId, description, format, locationOrLink);

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

//*Tutee

/**
 * @desc    Get available lessons filtered by subject(s)
 * @route   POST /lessons/available
 * @access  Public
 */
exports.searchAvailableLessons = async (req, res, next) => {
  try {
    const { subjectName, grade, level } = req.validatedBody;
    const tuteeUserId = req.userId;

    const lessons = await lessonService.searchAvailableLessons(subjectName, grade, level, tuteeUserId);

    res.status(200).json({
      success: true,
      message: 'Available lessons retrieved successfully',
      data: { lessons }
    });
  } catch (err) {
    next(err);
  }
};

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
 * @desc    Add a review for a completed lesson
 * @route   POST /lessons/review
 * @access  Private (Tutee only)
 */
exports.addReview = async (req, res, next) => {
  try {
    const tuteeUserId = req.userId; // From JWT via middleware
    const { lessonId, clarity, understanding, focus, helpful } = req.validatedBody;
    const result = await lessonService.addReview(lessonId, tuteeUserId, clarity, understanding, focus, helpful);

    res.status(201).json({
      success: true,
      message: 'Review added successfully',
      data: { review: result }
    });
  } catch (err) {
    next(err);
  }
};

//* ADMIN

/**
 * @desc    Get all verdict pending lessons
 * @route   GET /lessons/verdict-pending-lessons
 * @access  Private (Admin only)
 */
exports.getVerdictPendingLessons = async (req, res, next) => {
  try {
    const verdictPendingLessons = await lessonService.getVerdictPendingLessons();

    res.status(200).json({
      success: true,
      message: 'Verdict pending lessons retrieved successfully',
      data: { verdictPendingLessons }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * @desc    Update a lesson verdict
 * @route   PATCH /lessons/update-lesson-verdict
 * @access  Private (Admin only)
 */
exports.updateLessonVerdict = async (req, res, next) => {
  try {
    const { lessonId, isApproved } = req.validatedBody;
    const updatedLesson = await lessonService.updateLessonVerdict(lessonId, isApproved);

    res.status(200).json({
      success: true,
      message: 'Lesson verdict updated successfully',
      data: { updatedLesson }
    });
  } catch (err) {
    next(err);
  }
}
