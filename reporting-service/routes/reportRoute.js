const express = require('express');
const router = express.Router();
const { getReportsByMentor } = require('../controllers/reportController');

router.get('/tutor/:tutorId', getReportsByMentor);

module.exports = router;
