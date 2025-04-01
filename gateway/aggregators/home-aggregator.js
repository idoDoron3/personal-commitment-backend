const jwt = require("jsonwebtoken");
const axios = require("axios");

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
//   const lessons_base = process.env.LESSON_SERVICE_URL;//TODO - check if this the correct URL name
//   const feedback_base = process.env.LESSON_SERVICE_URL;//TODO - check if this the correct URL name
//   const notfiactions_base = process.env.LESSON_SERVICE_URL;//TODO - check if this the correct URL name


//   if (role === "mentor") {
//     const [countRes, nextRes, feedbackRes] = await Promise.all([
//       axios.get(`${lessons_base}/mentor/lesson-count/${userId}`, { headers }),
//       axios.get(`${lessons_base}/mentor/next-lesson/${userId}`, { headers }),
//       axios.get(`${feedback_base}/mentor/avg-feedback/${userId}`, { headers })
//     ]);

//     return {
//       role,
//       lessonCount: countRes.data.count,
//       nextLesson: nextRes.data,
//       feedbackStats: feedbackRes.data
//     };
//   }

//   if (role === "student") {
//     const [lastRes, nextRes] = await Promise.all([
//       axios.get(`${lessons_base}/student/last-lesson/${userId}`, { headers }),
//       axios.get(`${lessons_base}/student/next-lesson/${userId}`, { headers })
//     ]);

//     return {
//       role,
//       lastLesson: lastRes.data,
//       upcomingLesson: nextRes.data
//     };
//   }

//   if (role === "admin") {
//     const [scoreRes, pendingRes] = await Promise.all([
//       axios.get(`${feedback_base}/admin/mentor-avg-score`, { headers }),
//       axios.get(`${notfiactions_base}/admin/pending-requests`, { headers })
//     ]);

//     return {
//       role,
//       mentorAvgScore: scoreRes.data,
//       pendingRequests: pendingRes.data
//     };
//   }

//   throw new Error("Unsupported role");
if (role === "mentor") {
    return {
      role,
      lessonCount: 12,
      nextLesson: {
        date: "2025-04-01",
        time: "16:00",
        student: "יוסי כהן",
        subject: "אנגלית – הכנה למבחן"
      },
      feedbackStats: {
        averageScore: 4.7,
        totalFeedbacks: 15
      }
    };
  }

  if (role === "student") {
    return {
      role,
      lastLesson: {
        date: "2025-03-27",
        subject: "מתמטיקה – שיעור חזרה",
        mentor: "מתן כהן"
      },
      upcomingLesson: {
        date: "2025-04-01",
        subject: "פיזיקה – תרגול לקראת בגרות",
        mentor: "עידו בן עמי"
      }
    };
  }

  if (role === "admin") {
    return {
      role,
      mentorAvgScore: 4.5,
      pendingRequests: [
        { type: "שיעור חדש", user: "יוסי לוי" },
        { type: "בקשת חונך", user: "נועה רוזן" }
      ]
    };
  }

  throw new Error("Unsupported role");
};
