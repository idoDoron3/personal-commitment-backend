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
  const reports_base = process.env.REPORT_SERVICE_URL; //! Amit: make sure this is updated in the .env file
  console.log("-------------------------------------");
  // console.log({ reports_base });
  console.log("-------------------------------------");


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

    const overallMentorAvgScoreRes = await axios.get(`${reports_base}/average-mentor`, { headers });
    const overallMentorAvgScore = overallMentorAvgScoreRes.data.averageScore.averageScore

    const totalApprovedLessonsRes = await axios.get(`${reports_base}/get-all-approved-lessons`, { headers });
    const totalApprovedLessons = totalApprovedLessonsRes.data.approvedLessonsCount;

    const averageLessonsPerMentorRes = await axios.get(`${reports_base}/average-lessons-per-mentor`, { headers });
    const averageLessonsPerMentor = averageLessonsPerMentorRes.data;

    const lessonsCreatedLastWeekRes = await axios.get(`${reports_base}/lessons-created-last-week`, { headers });
    const lessonsCreatedLastWeek = lessonsCreatedLastWeekRes.data;

    const lessonGradeDistributionRes = await axios.get(`${reports_base}/lesson-grade-distribution`, { headers });
    const lessonGradeDistribution = lessonGradeDistributionRes.data;


    return {
      role,
      userName: fullName,
      // ! Amit: keep mocks until production 
      overallMentorAvgScore: overallMentorAvgScore,
      totalApprovedLessons: totalApprovedLessons,
      averageLessonsPerMentor: averageLessonsPerMentor,
      lessonsCreatedLastWeek: lessonsCreatedLastWeek,
      // lessonsnsGradeDistribution: lessonsnsGradeDistribution,
      // overallMentorAvgScore: 4.4,
      // totalCompletedLessons: 29, //Aprooved
      // averageLessonsPerMentor: 8.4,
      // lessonsCreatedLastWeek: 22,
      lessonsnsGradeDistribution: lessonGradeDistribution
      // [
      //   { "subjectName": "Mathematics", "grade": "7", "count": 7 },
      //   { "subjectName": "Mathematics", "grade": "8", "count": 8 },
      //   { "subjectName": "Mathematics", "grade": "9", "count": 1 },
      //   { "subjectName": "Science", "grade": "9", "count": 9 },
      //   { "subjectName": "Science", "grade": "8", "count": 6 },
      //   { "subjectName": "History", "grade": "9", "count": 4 },
      //   { "subjectName": "English", "grade": "7", "count": 6 },
      //   { "subjectName": "English", "grade": "9", "count": 5 },
      //   { "subjectName": "Computer Science", "grade": "9", "count": 3 },
      //   { "subjectName": "Art", "grade": "8", "count": 2 },
      //   { "subjectName": "Physical Education", "grade": "7", "count": 4 },
      // ]
    };
  }

  throw new Error("Unsupported role");
};
