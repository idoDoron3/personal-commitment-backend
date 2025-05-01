const reportService = require('../services/reportService');

exports.getMentorAverageReview = async (req, res, next) => {
  try {
      const mentorId = req.userId;

      const averageData  = await reportService.getMentorAverageScore(mentorId);
      res.status(200).json(averageData);

  } catch (err) {
      next(err);
  }
};

exports.getMentorCompletedLessonsCount = async (req, res, next) => {
  try {
      const mentorId = req.userId;
      const completedLessons   = await reportService.getMentorCompletedLessonsCount(mentorId);
      res.status(200).json(completedLessons );

  } catch (err) {
      next(err);
  }
};

exports.getTopMentors = async (req, res, next) => {
  try {
      const topMentors = await reportService.getTopMentorsByCompletedLessons();
      res.status(200).json({ topMentors });
  } catch (err) {
      next(err);
  }
};


