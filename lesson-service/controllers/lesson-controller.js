// lesson-service/controllers/lesson-controller.js

const lessonService = require("../service/lesson-service");

//
// TUTOR
//

/**
 * @desc    Create a new lesson (Tutor only)
 * @route   POST /lessons
 * @body    { subjectName, level, tutorId, dateTime }
 * @returns { message, lesson }
 */
exports.createLesson = async (req, res) => {
  try {
    const { subjectName, level, tutorId, dateTime } = req.body;

    const lesson = await lessonService.createLesson(
      subjectName,
      level,
      tutorId,
      dateTime
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
 * @route  PATCH /lessons/:lessonId/abort
 * @access Tutor
 * @param  lessonId in URL
 * @body   { tutorId } for authorization
 * @returns { message }
 */
exports.abortLesson = async (req, res) => {
    try {
        // Extract lessonId from URL and tutorId from request body
      const { lessonId } = req.params;
      const { tutorId } = req.body;
  
      // Abort lesson in DB
      const abortedLesson = await lessonService.abortLesson(lessonId, tutorId);
      // TODO: until the Integrate with notifiction microservice
      // Get enrolled tutiers and notify them (simulate)
    //   const tutierIds = await lessonService.getEnrolledTutiers(lessonId); 
  
      // Send message to each tutier (or send to notification service later)
    //   tutierIds.forEach((tutierId) => {
    //     console.log(`📨 Notify tutier ${tutierId}: Lesson ${lessonId} has been cancelled.`);
        // TODO: Integrate with notification microservice
    //   });
  
      res.status(200).json({
        message: `Lesson ${lessonId} aborted successfully and all tutiers notified.`,
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
 * @param   tutorId
 * @returns { lessons[] }
 */
exports.getLessonsByTutor = async (req, res) => {
  try {
    // Extract tutorId from URL parameters
    const { tutorId } = req.params;
    // Call the service to get lessons by tutorId
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
// *TUTIER
//

/**
 * @desc    Enroll a tutier into a lesson
 * @route   POST /lessons/enroll
 * @body    { lessonId, tutierId }
 * @returns { message, result }
 */
exports.enrollToLesson = async (req, res) => {
  try {
    const { lessonId, tutierId } = req.body;

    const result = await lessonService.enrollToLesson(lessonId, tutierId);

    res.status(200).json({ message: "Enrolled successfully", result });
  } catch (error) {
    console.error("Error in enrollToLesson:", error.message);

    if (error.type === "ALREADY_ENROLLED") {
      return res.status(409).json({ error: error.message });
    }

    if (error.type === "LESSON_NOT_FOUND") {
      return res.status(404).json({ error: error.message });
    }

    if (error.type === "TUTIER_NOT_FOUND") {
      return res.status(404).json({ error: error.message });
    }

    if (error.type === "LESSON_FULL") {
      return res.status(403).json({ error: error.message });
    }

    res.status(500).json({ error: "Something went wrong" });
  }
};

/**
 * @desc   Withdraw a tutier from a lesson
 * @route  DELETE /lessons/:lessonId/withdraw
 * @access Tutier
 * @param  lessonId in URL
 * @body   { tutierId }
 * @returns { message }
 */
exports.withdrawFromLesson = async (req, res) => {
    try {
        // Extract lessonId from URL and tutierId from request body
      const { lessonId } = req.params;
      const { tutierId } = req.body;
  
      const result = await lessonService.withdrawFromLesson(lessonId, tutierId);
  
      res.status(200).json({
        message: `Tutier ${tutierId} withdrawn from lesson ${lessonId}.`,
        result
      });
    } catch (error) {
      console.error("Error in withdrawFromLesson:", error.message);
  
      if (error.type === "NOT_ENROLLED") {
        return res.status(404).json({ error: "Tutier is not enrolled in this lesson" });
      }
  
      if (error.type === "LESSON_NOT_FOUND") {
        return res.status(404).json({ error: error.message });
      }
  
      res.status(500).json({ error: "Something went wrong" });
    }
  };

  
/**
 * @desc    Get all lessons a tutier is enrolled in
 * @route   GET /lessons/tutier/:tutierId
 * @param   tutierId
 * @returns { lessons[] }
 */
exports.getTutierLessons = async (req, res) => {
  try {
    const { tutierId } = req.params;

    const lessons = await lessonService.getLessonsByTutier(tutierId);

    res.status(200).json({ lessons });
  } catch (error) {
    console.error("Error in getMyLessons:", error.message);

    if (error.type === "TUTIER_NOT_FOUND") {
      return res.status(404).json({ error: error.message });
    }

    res.status(500).json({ error: "Something went wrong" });
  }
};

/**
 * @desc    Get all available lessons for enrollment (Tutier)
 * @route   GET /lessons/available
 * @body    { subjects: string[] }   // Optional: list of subjects to filter lessons
 * @returns { lessons[] }
 */
exports.getAvailableLessons = async (req, res) => {
    try {
      const { subjects } = req.body; // subjects can be undefined, an empty array, or a populated array
      const lessons = await lessonService.getAvailableLessons(subjects);
      res.status(200).json({ lessons });
    } catch (error) {
      console.error("Error in getAvailableLessons:", error.message);
      res.status(500).json({ error: "Something went wrong" });
    }
  };
  