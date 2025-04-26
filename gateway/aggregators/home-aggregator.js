const axios = require("axios");

const motivationSentences = [
  "Every lesson is a step closer to your goals!",
  "Keep pushing forward, you're doing great!",
  "Your dedication to learning is inspiring!",
  "Every challenge is an opportunity to grow!",
  "Success is the sum of small efforts repeated daily!",
  "You're not just learning, you're building your future!",
  "Every lesson brings you closer to mastery!",
  "Your progress is your power!",
  "Learning is a journey, enjoy every step!",
  "You're capable of amazing things!",
];

const getRandomMotivation = () => {
  return motivationSentences[
    Math.floor(Math.random() * motivationSentences.length)
  ];
};

exports.aggregateHomeData = async (req) => {
  const { userId, role, fullName, email, username } = req.user;
  
  const headers = { Authorization: req.headers.authorization };
  const lessons_base = process.env.LESSON_SERVICE_URL;


  if (role === "mentor") {
    // Get all mentor's lessons
    const lessonsRes = await axios.get(`${lessons_base}/tutor-upcoming-lessons`, { headers });
    const lessons = lessonsRes.data.data.lessonsWithEnrolledTutees;



    // Find next lesson
    const now = new Date();
    const nextLesson = lessons
      .filter(lesson => new Date(lesson.appointedDateTime) > now)
      .sort((a, b) => new Date(a.appointedDateTime) - new Date(b.appointedDateTime))[0];
  
    // Calculate total hours
    const totalHours = await axios.get(`${lessons_base}/approved-lessons-amount`, { headers });
    return {
      role,
      userName: fullName,
      totalHours: Math.round(totalHours.data.data.amountOfApprovedLessons),
      nextLesson: nextLesson || null,
      feedbackStats: {
        averageScore: 4.7, //TODO call real API
        totalFeedbacks: 15 //TODO - use real API
      }
    };
  }

  if (role === "student") {
    // Get all student's lessons
    const lessonsRes = await axios.get(`${lessons_base}/tutee-upcoming-lessons`, { headers });
    const lessons = lessonsRes.data.data.lessonsWithEnrolledTutees;

    // Find next lesson
    const now = new Date();
    const nextLesson = lessons
      .filter(lesson => new Date(lesson.appointedDateTime) > now)
      .sort((a, b) => new Date(a.appointedDateTime) - new Date(b.appointedDateTime))[0];

    return {
      role,
      userName: fullName,
      nextLesson: nextLesson || null,
      motivationSentence: getRandomMotivation()
    };
  }

  if (role === "admin") {
    return {
      role,
      userName: "System Admin",
      mentorAvgScore: 4.5,
      pendingRequests: [
        {
          type: "New Lesson Request",
          user: "Yossi Levi",
          requestId: "123",
        },
        {
          type: "Mentor Application",
          user: "Noa Rosen",
          requestId: "124",
        },
      ],
    };
  }

  throw new Error("Unsupported role");
};
