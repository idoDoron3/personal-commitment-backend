// lesson-service/controllers/lesson-controller.js
// ? TODO: check if the use of the GET request is correct when using the body to send data instead of the URL

const lessonService = require("../service/lesson-service");

//
// TUTOR
//

/**
 * @desc    Create a new lesson (Tutor only)
 * @route   POST /lessons
 * @body    { subjectName, level, tutorId, appointedDateTime }
 * @returns { message, lesson }
 */
exports.createLesson = async (req, res) => {
  try {
    const { subjectName, level, tutorId, appointedDateTime } = req.body;

    const lesson = await lessonService.createLesson(
      subjectName,
      level,
      tutorId,
      appointedDateTime
    );

    res.status(201).json({ message: "Lesson created", lesson });
  } catch (error) {
    console.error("Error in createLesson:", error.message);

    if (error.type === "TUTOR_NOT_FOUND") {
      return res.status(404).json({ error: error.message });
    }

    if (error.type === "MISSING_FIELDS") {
      return res.status(400).json({ error: error.message });
    }

    res.status(500).json({ error: "Something went wrong" });
  }
};

/**
 * @desc   Abort a lesson (tutor only)
 * @route  PATCH /lessons/abort
 * @access Tutor
 * @body   { lessonId, tutorId } for authorization
 * @returns { message }
 */
exports.abortLesson = async (req, res) => {
  try {
    const { lessonId, tutorId } = req.body; // Extract lessonId and tutorId from request body for consistency

    // Abort lesson in DB
    const abortedLesson = await lessonService.abortLesson(lessonId, tutorId);
    // TODO: until the Integrate with notifiction microservice
    // Get enrolled tutees and notify them (simulate)
    //   const tuteeIds = await lessonService.getEnrolledtutees(lessonId); 

    //   Send message to each tutee (or send to notification service later)
    //   tuteeIds.forEach((tuteeId) => {
    //     console.log(`📨 Notify tutee ${tuteeId}: Lesson ${lessonId} has been cancelled.`);
    //     TODO: Integrate with notification microservice
    //   });

    res.status(200).json({
      message: `Lesson ${lessonId} aborted successfully and all tutees notified.`,
    });
  } catch (error) {
    console.error("Error in abortLesson:", error.message);

    if (error.type === "LESSON_NOT_FOUND") {
      return res.status(404).json({ error: error.message });
    }

    res.status(500).json({ error: "Something went wrong" });
  }
};


/**
 * @desc    Get all lessons by tutor
 * @route   GET /lessons/tutor/:tutorId
 * @body   { tutorId } // Optional: for consistency
 * @returns { lessons[] }
 */
exports.getLessonsByTutor = async (req, res) => {
  try {
    // const { tutorId } = req.body; // Extract tutorId from request body for consistency with the full code
    const { tutorId } = req.params; // Extract tutorId from request parameters - because this is a GET request this is the standard way

    const lessons = await lessonService.getLessonsByTutor(tutorId);

    res.status(200).json({ lessons });
  } catch (error) {
    console.error("Error in getLessonsByTutor:", error.message);

    if (error.type === "TUTOR_NOT_FOUND") {
      return res.status(404).json({ error: error.message });
    }

    res.status(500).json({ error: "Something went wrong" });
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
exports.getTuteeLessons = async (req, res) => {
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
exports.getAvailableLessons = async (req, res) => {
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