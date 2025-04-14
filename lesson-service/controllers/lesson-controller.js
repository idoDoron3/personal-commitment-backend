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
    console.warn('createLesson controller error:', err);
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

/**
 * @desc    Enroll a tutee into a lesson
 * @route   POST /lessons/enroll
 * @body    { lessonId, tuteeId }
 * @returns { message, result }
 */
exports.enrollToLesson = async (req, res) => {
  try {
    const { lessonId, tuteeId } = req.body;

    const result = await lessonService.enrollToLesson(lessonId, tuteeId);

    res.status(200).json({ message: "Enrolled successfully", result });
  } catch (error) {
    console.error("Error in enrollToLesson:", error.message);

    if (error.type === "ALREADY_ENROLLED") {
      return res.status(409).json({ error: error.message });
    }

    if (error.type === "LESSON_NOT_FOUND") {
      return res.status(404).json({ error: error.message });
    }

    if (error.type === "TUTEE_NOT_FOUND") {
      return res.status(404).json({ error: error.message });
    }

    if (error.type === "LESSON_FULL") {
      return res.status(403).json({ error: error.message });
    }

    res.status(500).json({ error: "Something went wrong" });
  }
};

/**
 * @desc   Withdraw a tutee from a lesson
 * @route  DELETE /lessons/withdraw
 * @access tutee
 * @body   { lessonId, tuteeId }
 * @returns { message }
 */
exports.withdrawFromLesson = async (req, res) => {
  try {
    // Extract lessonId and tuteeId from request body
    const { lessonId, tuteeId } = req.body;

    const result = await lessonService.withdrawFromLesson(lessonId, tuteeId);

    res.status(200).json({
      message: `tutee ${tuteeId} withdrawn from lesson ${lessonId}.`,
      result
    });
  } catch (error) {
    console.error("Error in withdrawFromLesson:", error.message);

    if (error.type === "NOT_ENROLLED") {
      return res.status(404).json({ error: "tutee is not enrolled in this lesson" });
    }

    if (error.type === "LESSON_NOT_FOUND") {
      return res.status(404).json({ error: error.message });
    }

    res.status(500).json({ error: "Something went wrong" });
  }
};


/**
 * @desc    Get all lessons a tutee is enrolled in
 * @route   GET /lessons/tutee/:tuteeId
 * @param   tuteeId
 * @returns { lessons[] }
 */
exports.getLessonsByTutee = async (req, res) => {
  try {

    const { tuteeId } = req.params; // this is the standard way to extract parameters from the URL in a GET request
    // const { tuteeId } = req.body; // Extract tuteeId from request body

    const lessons = await lessonService.getLessonsByTutee(tuteeId);

    res.status(200).json({ lessons });
  } catch (error) {
    console.error("Error in getMyLessons:", error.message);

    if (error.type === "TUTEE_NOT_FOUND") {
      return res.status(404).json({ error: error.message });
    }

    res.status(500).json({ error: "Something went wrong" });
  }
};

/**
 * @desc    Get all available lessons for enrollment (tutee)
 * @route   GET /lessons/available
 * @body    { subjects: string[] }   // tutee chooses subjects to filter lessons
 * @returns { lessons[] }
 */
exports.getAvailableLessonsBySubject = async (req, res) => {
  try {
    const { subjects } = req.query; // this is the standard way to extract query parameters from the URL in a GET request

    // const { subjects } = req.body; // subjects can be undefined, an empty array, or a populated array
    const lessons = await lessonService.getAvailableLessons(subjects);
    res.status(200).json({ lessons });
  } catch (error) {
    console.error("Error in getAvailableLessons:", error.message);
    res.status(500).json({ error: "Something went wrong" });
  }
};


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




