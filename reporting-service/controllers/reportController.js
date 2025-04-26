const reportService = require('../services/reportService');

exports.getReportsByMentor = async (req, res) => {
  try {
    const reports = await reportService.fetchReportsByMentor(req.params.tutorId);
    res.json(reports);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
};
