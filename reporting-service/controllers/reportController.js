const reportService = require('../services/reportService');

exports.getMentorAverageReview = async (req, res, next) => {
  try {
     const mentorId = req.params.mentorId;
     const averageData  = await reportService.getMentorAverageScore(mentorId);
      res.status(200).json(averageData);

  } catch (err) {
      next(err);
  }
};

exports.getMentorCompletedLessonsCount = async (req, res, next) => {
  try {
      const mentorId = req.params.mentorId;
      const completedLessons   = await reportService.getMentorCompletedLessonsCount(mentorId);
      res.status(200).json(completedLessons );

  } catch (err) {
      next(err);
  }
};

exports.getTopMentors = async (req, res, next) => {
  try {
      const topMentors = await reportService.getTopMentorsByCompletedLessons();
      res.status(200).json(topMentors);
  } catch (err) {
      next(err);
  }
};


exports.getAverageLessonsPerMentor = async (req, res) => {
  try {
    const avg = await reportService.calculateAverageLessonsPerMentor();
    res.status(200).json(avg);
  } catch (error) {
    console.error('❌ Failed to calculate average lessons per mentor:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.getLessonsCreatedLastWeek = async (req, res) => {
  try {
    const total = await reportService.countLessonsCreatedLastWeek();
    res.status(200).json(total);
  } catch (error) {
    console.error('❌ Failed to count lessons created last week:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.getMentorOverview = async (req, res) => {
  try {
    const { mentorId } = req.params;

    const overview = await reportService.getMentorOverview(mentorId);

    if (!overview) {
      return res.status(404).json({ error: 'Mentor not found' });
    }
    res.status(200).json(overview);
  } catch (error) {
    console.error('❌ Failed to get mentor overview:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.getLessonGradeDistribution = async (req, res, next) => {
  try {
      const distribution = await reportService.getLessonGradeDistribution();
      res.status(200).json(distribution);
  } catch (err) {
      console.error('❌ Failed to get lesson grade distribution:', err.message);
      next(err);
  }
};