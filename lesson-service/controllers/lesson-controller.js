// lesson-service/controllers/lesson-controller.js
// ? TODO: check if the use of the GET request is correct when using the body to send data instead of the URL

const lessonService = require("../service/lesson-service");

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
    const lesson = await lessonService.createLesson(req.validatedBody);

    res.status(201).json({
      success: true,
      message: 'Lesson created successfully',
      data: { lesson }
    });
  } catch (err) {
    // console.warn('createLesson controller error:', err);
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
    const canceledLesson = await lessonService.cancelLesson(req.validatedBody);

    res.status(200).json({
      success: true,
      message: 'Lesson canceled successfully',
      data: {
        lesson: canceledLesson.lesson,
        // affectedTutees: canceledLesson.affectedTutees //!Amit: need to notify the affected tutees
      }
    });
  } catch (err) {
    console.warn('cancelLesson controller error:', err);
    next(err);
  }
};


/**
 * @desc    Get all lessons by tutor //! Amit: We Use POST instead of GET because get request can't send body
 * @route   POST /lessons/tutor-upcoming-lessons
 * @access  Private (Tutor only)
 */
exports.getLessonsByTutor = async (req, res, next) => {
  try {
    const lessons = await lessonService.getLessonsByTutor(req.validatedBody);

    res.status(200).json({
      success: true,
      message: 'Lessons retrieved successfully',
      data: { lessons }
    });
  } catch (err) {
    console.warn('getLessonsByTutor controller error:', err);
    next(err);
  }
};


//
// *Tutee
//


// ! get My next Lessons tutoee
// ! get My next Lessons tutor
// ! get approved lessons tutor
// ! get awaiting approval lessons tutor
// ! get not approved lessons tutor - means the admin review the lesson and decided to not approve it




// ! Tutor:
// ! 1 get by user id: Easy
// ! 2 getLessonsByTutor -----------------------------------------------------------------------------(Created/Occured/???????): Hard
// ! 3 getAmountOfApprovedLessons (returns int): Medium
//  4 getAmountOfNotApprovedLessons (returns int) ------------------------------------------X
//  5 getPendingLessons - completed/unattended
// ! 6 createSummary -----------------------------------------------------------------------------,TutteesAtendncy, summary,: Hard
// ! 7 addLinkOrLocationToLesson  : Easy


// ! Tutee:
// ! 8 get by user id: Easy
// ! 9 getLessonsByTutee ----------------------------------------------------------------------------(upcoming/ ???): Hard
// ! 10 getAvailableLessonsBySubject: Hard
// ! 11 enrollToLesson: Medium
// ! 12 withdrawFromLesson: Medium

// 1, 8, 10 ,11 ,12 Itay
// 2, 3, 6, 7, 9    Amit




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
