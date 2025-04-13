// mockLessons.data.js

// Next & Previous Lessons
const mockPrevLesson = {
    id: 4,
    subject: "Mathematics",
    grade: "8",
    date: "1.4.2025",
    day: "Thursday",
    startTime: "11:00",
    endTime: "12:00",
    mentor: "Galit Bar",
    description: "Review of function analysis",
    students: [
      { _id: "s8", first_name: "Omer", last_name: "Golan" },
      { _id: "s9", first_name: "Roni", last_name: "Chen" }
    ],
    lessonLocation: "Classroom 4",
    hasReview: false
  };
  
const mockNextLesson = {
    id: 5,
    subject: "Mathematics",
    grade: "8",
    date: "6.4.2025",
    day: "Friday",
    startTime: "13:00",
    endTime: "14:00",
    mentor: "Ido Caspi",
    description: "Practice quadratic equations",
    students: [
      { _id: "s10", first_name: "Lihi", last_name: "Shapira" },
      { _id: "s11", first_name: "Uri", last_name: "Barak" }
    ],
    lessonLocation: "Classroom 2",
    hasReview: false
  };
  
  const mockSearchResults = [
    {
      id: 1,
      subject: "Mathematics",
      grade: "8",
      group: "2",
      date: "2.4.2025",
      day: "Sunday",
      startTime: "14:00",
      endTime: "15:00",
      mentor: "Yossi Cohen",
      description: "Test prep",
      students: [
        { _id: "s1", first_name: "Daniel", last_name: "Levi" },
        { _id: "s2", first_name: "Noam", last_name: "Katz" },
        { _id: "s3", first_name: "Shira", last_name: "Cohen" },
      ]
    },
    {
      id: 2,
      subject: "Mathematics",
      grade: "8",
      group: "2",
      date: "3.4.2025",
      day: "Monday",
      startTime: "15:00",
      endTime: "16:00",
      mentor: "Noa Barak",
      description: "Final review",
      students: [
        { _id: "s4", first_name: "Tamar", last_name: "David" },
        { _id: "s5", first_name: "Roi", last_name: "Shalom" },
      ]
    },
    {
      id: 3,
      subject: "Mathematics",
      grade: "8",
      group: "2",
      date: "4.4.2025",
      day: "Tuesday",
      startTime: "12:00",
      endTime: "13:00",
      mentor: "Yoav Levi",
      description: "Practice lesson",
      students: [
        { _id: "s6", first_name: "Yuval", last_name: "Mizrahi" },
        { _id: "s7", first_name: "Lia", last_name: "Ashkenazi" }
      ]
    }
  ];
  
  const mockMyLessons = [mockSearchResults[0], mockSearchResults[1]];
  const mockAllLessons = [...mockSearchResults];
  
  module.exports = {
    mockPrevLesson,
    mockNextLesson,
    mockSearchResults,
    mockMyLessons,
    mockAllLessons,
  };