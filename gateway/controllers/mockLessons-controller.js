const {
    mockSearchResults,
    mockLessons,
    mockMyLessons,
    mockNextLesson,
    mockPrevLesson,
    mockStudentNoSpace,
    mockStudentNotRegistered,
    mockStudentRegistered,
    mockPendingReviews,
  } = require("../mocks/mock-lessons");
  
  // ===================== GENERAL =====================
  exports.searchLessons = (req, res) => {
    res.status(200).json(mockSearchResults);
  };
  
  exports.getLessonById = (req, res) => {
    const lesson = mockLessons.find((l) => l.id === parseInt(req.params.id));
    if (!lesson) return res.status(404).json({ error: "Lesson not found" });
    res.status(200).json(lesson);
  };
  
  // ===================== STUDENT =====================
  exports.getStudentLessons = (req, res) => {
    res.status(200).json(mockMyLessons);
  };
  
  exports.getNextStudentLesson = (req, res) => {
    res.status(200).json(mockNextLesson);
  };
  
  exports.getLastStudentLesson = (req, res) => {
    res.status(200).json(mockPrevLesson);
  };
  
  exports.registerToLesson = (req, res) => {
    res.status(200).json({ message: "Student registered successfully" });
  };
  
  exports.unregisterFromLesson = (req, res) => {
    res.status(200).json({ message: "Student unregistered successfully" });
  };
  exports.submitStudentReview = async (req, res) => {
    console.log("📝 Student review submission received:", {
    });
    
    res.status(200).json({ message: "Student review submitted successfully" });
  }; 
  
  // ===================== MENTOR =====================
  exports.createLesson = (req, res) => {
    const newLesson = {
      ...req.body,
      id: Math.floor(Math.random() * 10000),
    };
    res.status(201).json(newLesson);
  };

  exports.updateLesson = (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    res.status(200).json({ message: `Lesson ${id} updated`, updates });
  };

  exports.deleteLesson = (req, res) => {
    const { id } = req.params;
    console.log(`Deleting lesson with ID: ${id}`);
    
    res.status(200).json({ message: `Lesson ${id} deleted successfully` });
  };

  exports.getLessonCount = (req, res) => {
    res.status(200).json({ count: mockMyLessons.length });
  };
  
  exports.getNextMentorLesson = (req, res) => {
    res.status(200).json(mockNextLesson);
  };
  
  exports.getUpcomingLessons = (req, res) => {
    res.status(200).json(mockMyLessons);
  };
  
  exports.getMentorLessons = (req, res) => {
    res.status(200).json(mockMyLessons);
  };

  exports.submitMentorReview = (req, res) => {
  
    console.log("📥 Received mentor review:");
  
    res.status(200).json({
      message: "Mentor review submitted (mock)"});
  };
  
  
  // ===================== ADMIN =====================
  exports.getAllLessons = (req, res) => {
    res.status(200).json(mockLessons);
  };
  
  exports.approveLesson = (req, res) => {
    res.status(200).json({ message: `Lesson ${req.params.lessonId} approved` });
  };
  
  exports.rejectLesson = (req, res) => {
    res.status(200).json({ message: `Lesson ${req.params.lessonId} rejected` });
  };

  exports.getPendingReviews = (req, res) =>{
    res.status(200).json(mockPendingReviews);
  }
  