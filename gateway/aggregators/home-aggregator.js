const jwt = require("jsonwebtoken");
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

const getUserFromToken = (req) => {
  const authHeader = req.headers.authorization;
  console.log("Authorization Header:", req.headers.authorization);
  if (!authHeader) throw new Error("No token provided");

  const token = authHeader.startsWith("Bearer ")
    ? authHeader.split(" ")[1]
    : authHeader;

  if (!token) throw new Error("Token missing");

  return jwt.verify(token, process.env.JWT_SECRET);
};

exports.aggregateHomeData = async (req) => {
  const { id: userId, role } = getUserFromToken(req);
  const headers = { Authorization: req.headers.authorization };
  const lessons_base = process.env.LESSON_SERVICE_URL;

  // Implementation for future reference:
  /*
  if (role === "mentor") {
    // Get all mentor's lessons
    const lessonsRes = await axios.get(`${lessons_base}/mentor/lessons/${userId}`, { headers });
    const lessons = lessonsRes.data;

    // Find next lesson
    const now = new Date();
    const nextLesson = lessons
      .filter(lesson => new Date(lesson.date) > now)
      .sort((a, b) => new Date(a.date) - new Date(b.date))[0];

    // Calculate total hours
    const totalHours = lessons.reduce((acc, lesson) => {
      const duration = (new Date(lesson.endTime) - new Date(lesson.startTime)) / (1000 * 60 * 60);
      return acc + duration;
    }, 0);

    return {
      role,
      userName: "יוסי כהן",
      totalHours: Math.round(totalHours),
      nextLesson: nextLesson || null,
      feedbackStats: {
        averageScore: 4.7,
        totalFeedbacks: 15
      }
    };
  }

  if (role === "student") {
    // Get all student's lessons
    const lessonsRes = await axios.get(`${lessons_base}/student/lessons/${userId}`, { headers });
    const lessons = lessonsRes.data;

    // Find next lesson
    const now = new Date();
    const nextLesson = lessons
      .filter(lesson => new Date(lesson.date) > now)
      .sort((a, b) => new Date(a.date) - new Date(b.date))[0];

    return {
      role,
      userName: "דניאל ישראלי",
      nextLesson: nextLesson || null,
      motivationSentence: getRandomMotivation()
    };
  }
  */

  // Current mock implementation:
  if (role === "mentor") {
    return {
      role,
      userName: "MATAN COHEN",
      totalHours: 12,
      nextLesson: {
        date: "2025-04-01",
        day: "Tuesday",
        startTime: "16:00",
        endTime: "17:00",
        student: "Naom levy",
        subject: "English",
        grade: "7",
        description: "Advanced vocabulary and conversation practice",
        location: "Zoom Meeting",
      },
      feedbackStats: {
        averageScore: 4.7,
        totalFeedbacks: 15,
      },
    };
  }

  if (role === "student") {
    return {
      role,
      userName: "NOA COHEN",
      nextLesson: {
        date: "2025-04-01",
        day: "Thursday",
        startTime: "15:00",
        endTime: "16:00",
        subject: "Phisycs",
        grade: "9",
        mentor: "Ido Ben Ami",
        description: "Mechanics and motion",
        location: "Zoom Meeting",
      },
      motivationSentence: getRandomMotivation(),
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
