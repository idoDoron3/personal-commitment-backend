const express = require('express');
const router = express.Router();
const axios = require('axios'); // For making requests to microservices

// Example route: Forward request to auth-service
router.get('/auth-service/status', async (req, res) => {
  try {
    const response = await axios.get('http://localhost:3001/');
    res.json({ success: true, data: response.data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
