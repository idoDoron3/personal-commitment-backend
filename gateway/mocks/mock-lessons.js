// Next & Previous Lessons
const mockPrevLesson = {
  id: 4,
  subject: "Mathematics",
  grade: "8",
  dateTime: "2025-04-01T11:00:00.000Z", // ISO format
  mentor: "Galit Bar",
  description: "Review of function analysis",
  format: "in-person", // 👈 הוספנו פורמט
  students: [
    { _id: "s8", first_name: "Omer", last_name: "Golan" },
    { _id: "s9", first_name: "Roni", last_name: "Chen" },
  ],
  lessonLocation: "Classroom 4",
  status: "completed",
  mentorReview: true,
  studentReview: false,
};

const mockNextLesson = {
  id: 5,
  subject: "Mathematics",
  grade: "8",
  dateTime: "2025-04-06T13:00:00.000Z", // ISO format
  mentor: "Ido Caspi",
  description: "Practice quadratic equations",
  format: "online", // 👈 הוספנו פורמט
  students: [
    { _id: "s10", first_name: "Lihi", last_name: "Shapira" },
    { _id: "s11", first_name: "Uri", last_name: "Barak" },
  ],
  lessonLocation: "Classroom 2",
  status: "upcoming",
  mentorReview: false,
  studentReview: false,
};

const mockSearchResults = [
  {
    id: 1,
    subject: "Mathematics",
    grade: "8",
    group: "2",
    dateTime: "2025-04-02T14:00:00.000Z",
    mentor: "Yossi Cohen",
    description: "Test prep",
    format: "online", // 👈 הוספנו פורמט
    students: [
      { _id: "s1", first_name: "Daniel", last_name: "Levi" },
      { _id: "s2", first_name: "Noam", last_name: "Katz" },
      { _id: "s3", first_name: "Shira", last_name: "Cohen" },
    ],
    status: "completed",
    mentorReview: false,
    studentReview: false,
  },
  {
    id: 2,
    subject: "Mathematics",
    grade: "8",
    group: "2",
    dateTime: "2025-04-03T15:00:00.000Z",
    mentor: "Noa Barak",
    description: "Final review",
    format: "online", // 👈 הוספנו פורמט
    lessonLocation: "www.zoom.com",
    students: [
      { _id: "s4", first_name: "Tamar", last_name: "David" },
      { _id: "s5", first_name: "Roi", last_name: "Shalom" },
    ],
    status: "completed",
    mentorReview: true,
    studentReview: true,
  },
  {
    id: 3,
    subject: "Mathematics",
    grade: "8",
    group: "2",
    dateTime: "2025-04-04T12:00:00.000Z",
    mentor: "Yoav Levi",
    description: "Practice lesson",
    format: "in-person", // 👈 הוספנו פורמט
    students: [
      { _id: "s6", first_name: "Yuval", last_name: "Mizrahi" },
      { _id: "s7", first_name: "Lia", last_name: "Ashkenazi" },
    ],
    status: "completed",
    mentorReview: true,
    studentReview: true,
  },
];

const mockPendingReviews = [
  {
    id: 101,
    subject: "Mathematics",
    grade: "8",
    date: "1.4.2025",
    day: "Thursday",
    startTime: "11:00",
    endTime: "12:00",
    mentor: "Galit Bar",
    description: "Review of function analysis",
    studentAttendance: {
      s8: "Present",
      s9: "Absent",
    },
    studentNames: {
      s8: "Omer Golan",
      s9: "Roni Chen",
    },
    selectedDescriptions: [
      "Students understood the material",
      "Additional explanations were needed",
    ],
    rating: 4,
    status: "pending",
  },
  {
    id: 102,
    subject: "Mathematics",
    grade: "8",
    date: "2.4.2025",
    day: "Sunday",
    startTime: "14:00",
    endTime: "15:00",
    mentor: "Yossi Cohen",
    description: "Test prep",
    studentAttendance: {
      s1: "Present",
      s2: "Late",
      s3: "Present",
    },
    studentNames: {
      s1: "Daniel Levi",
      s2: "Noam Katz",
      s3: "Shira Cohen",
    },
    selectedDescriptions: [
      "Students actively participated",
      "The lesson was interesting",
    ],
    rating: 5,
    status: "pending",
  },
];

const mockMyLessons = [mockSearchResults[0], mockSearchResults[1]];
const mockAllLessons = [...mockSearchResults];

module.exports = {
  mockPrevLesson,
  mockNextLesson,
  mockSearchResults,
  mockMyLessons,
  mockAllLessons,
  mockPendingReviews,
};
